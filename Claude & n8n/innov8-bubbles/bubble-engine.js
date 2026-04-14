/* ============================================================
   bubble-engine.js — Canvas-based physics bubble simulation
   ============================================================ */

import { PHYSICS, BUBBLE, changeToColor, changeToRGB, marketCapToRadius, getLogoUrl } from './config.js';

// ─── Mobile Detection ───
const _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const _isSmallScreen = () => window.innerWidth < 768;

export class BubbleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bubbles = [];
    this.hoveredBubble = null;
    this.animFrameId = null;
    this.running = false;
    this.dpr = window.devicePixelRatio || 1;
    this.width = 0;
    this.height = 0;
    this.mouseX = -9999;
    this.mouseY = -9999;

    // Image cache for coin logos
    this._imageCache = new Map(); // url → Image | null (null = failed)

    // Callbacks
    this._onBubbleClick = null;
    this._onBubbleHover = null;

    // Bind events
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onClick = this._handleClick.bind(this);
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);

    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('click', this._onClick);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
    canvas.addEventListener('touchend', this._onTouchEnd);
    canvas.addEventListener('mouseleave', () => {
      this.mouseX = -9999;
      this.mouseY = -9999;
      if (this.hoveredBubble) {
        this.hoveredBubble = null;
        this.canvas.style.cursor = 'default';
        if (this._onBubbleHover) this._onBubbleHover(null);
      }
    });

    // Disable touch-move on canvas to prevent pull-to-refresh interfering
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });

    this.resize();
  }

  // ─── Public API ───

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    // On mobile, cap DPR at 2 to save GPU — iPhone 13 is 3x which kills perf
    this.dpr = _isMobile ? Math.min(window.devicePixelRatio || 1, 2) : (window.devicePixelRatio || 1);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  setBubbles(assets, period = '24h') {
    if (!assets || assets.length === 0) {
      this.bubbles = [];
      return;
    }

    // Cap assets — fewer on mobile to reduce physics load + overcrowding
    const maxBubbles = _isSmallScreen() ? 50 : 100;
    if (assets.length > maxBubbles) {
      assets = [...assets].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)).slice(0, maxBubbles);
    }

    const changeKey = this._periodToKey(period);
    const caps = assets.map(a => a.marketCap).filter(c => c > 0);
    const minCap = Math.min(...caps) || 1;
    const maxCap = Math.max(...caps) || 1;

    // Scale down when many bubbles to prevent overcrowding
    const threshold = _isSmallScreen() ? 30 : 60;
    const countScale = assets.length > threshold ? threshold / assets.length : 1;

    // Map of existing bubble IDs for position persistence
    const existingMap = new Map();
    for (const b of this.bubbles) existingMap.set(b.id, b);

    const cx = this.width / 2;
    const cy = this.height / 2;

    this.bubbles = assets.map(asset => {
      const change = asset[changeKey];
      const isSponsored = asset._isSponsored;
      const sizeBoost = isSponsored ? 1.5 : 1;
      const targetRadius = marketCapToRadius(asset.marketCap, minCap, maxCap) * countScale * sizeBoost;
      const color = changeToColor(change, 0.85);
      const existing = existingMap.get(asset.id);

      if (existing) {
        existing.targetRadius = targetRadius;
        existing.color = color;
        existing.change = change;
        existing.data = asset;
        existing.symbol = asset.symbol;
        existing.name = asset.name;
        existing.removing = false;
        return existing;
      }

      // New bubble: random position near center — gentler initial velocity on mobile
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * Math.min(this.width, this.height) * 0.3;
      const spawnSpeed = _isMobile ? 0.3 : 2;
      return {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        assetClass: asset.assetClass,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * spawnSpeed,
        vy: (Math.random() - 0.5) * spawnSpeed,
        radius: 0,
        targetRadius,
        color,
        change,
        data: asset,
        removing: false,
      };
    });

    // Mark removed bubbles for shrink animation
    for (const [id, b] of existingMap) {
      if (!assets.find(a => a.id === id)) {
        b.removing = true;
        b.targetRadius = 0;
        this.bubbles.push(b);
      }
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  stop() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  onBubbleClick(cb) { this._onBubbleClick = cb; }
  onBubbleHover(cb) { this._onBubbleHover = cb; }

  destroy() {
    this.stop();
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
  }

  // ─── Layout & Render Loop ───

  _loop() {
    if (!this.running) return;
    this._update();
    this._render();
    this.animFrameId = requestAnimationFrame(() => this._loop());
  }

  _update() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const mobile = _isMobile;
    const bubbles = this.bubbles;

    // Physics constants — softer on mobile for calm, stable layout
    const GRAVITY = mobile ? 0.0005 : PHYSICS.GRAVITY;       // Stronger pull to center on mobile = tighter cluster
    const DAMPING = mobile ? 0.88 : PHYSICS.DAMPING;          // More friction on mobile = less sliding
    const LERP = mobile ? 0.06 : PHYSICS.LERP_SPEED;          // Slightly slower size transitions
    const COLLISION_PAD = mobile ? 1.15 : PHYSICS.COLLISION_PADDING; // Tighter collision on mobile = less bouncing
    const DRIFT = mobile ? 0.008 : 0.04;                      // Much less random drift on mobile
    const BOUNCE = mobile ? -0.3 : -0.5;                      // Softer wall bounce on mobile

    // Remove fully shrunk bubbles
    for (let i = bubbles.length - 1; i >= 0; i--) {
      if (bubbles[i].removing && bubbles[i].radius < 0.5) {
        bubbles.splice(i, 1);
      }
    }

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];

      // Radius interpolation
      b.radius += (b.targetRadius - b.radius) * LERP;

      // Gentle random drift
      b.vx += (Math.random() - 0.5) * DRIFT;
      b.vy += (Math.random() - 0.5) * DRIFT;

      // Center gravity
      b.vx += (cx - b.x) * GRAVITY;
      b.vy += (cy - b.y) * GRAVITY;

      // Damping
      b.vx *= DAMPING;
      b.vy *= DAMPING;

      // Velocity clamp on mobile — prevent any runaway bubbles
      if (mobile) {
        const maxV = 2;
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > maxV) {
          b.vx = (b.vx / speed) * maxV;
          b.vy = (b.vy / speed) * maxV;
        }
      }

      // Pairwise collision
      for (let j = i + 1; j < bubbles.length; j++) {
        const o = bubbles[j];
        const dx = o.x - b.x;
        const dy = o.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (b.radius + o.radius) * COLLISION_PAD;

        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          b.x -= nx * overlap;
          b.y -= ny * overlap;
          o.x += nx * overlap;
          o.y += ny * overlap;

          // Transfer velocity — gentler on mobile
          const dvx = b.vx - o.vx;
          const dvy = b.vy - o.vy;
          const dot = dvx * nx + dvy * ny;
          if (dot > 0) {
            const transfer = mobile ? 0.3 : 0.5;
            b.vx -= dot * nx * transfer;
            b.vy -= dot * ny * transfer;
            o.vx += dot * nx * transfer;
            o.vy += dot * ny * transfer;
          }
        }
      }

      // Apply velocity
      b.x += b.vx;
      b.y += b.vy;

      // Boundary containment — soft on mobile
      const margin = 10;
      if (b.x - b.radius < margin) { b.x = margin + b.radius; b.vx *= BOUNCE; }
      if (b.x + b.radius > this.width - margin) { b.x = this.width - margin - b.radius; b.vx *= BOUNCE; }
      if (b.y - b.radius < margin) { b.y = margin + b.radius; b.vy *= BOUNCE; }
      if (b.y + b.radius > this.height - margin) { b.y = this.height - margin - b.radius; b.vy *= BOUNCE; }
    }

    // Hover detection (skip on mobile — no hover, only tap)
    if (!mobile) {
      this._updateHover();
    }
  }

  _render() {
    const ctx = this.ctx;
    const mobile = _isMobile;
    ctx.clearRect(0, 0, this.width, this.height);

    // Sort: hovered on top
    const sorted = [...this.bubbles].sort((a, b) => {
      if (a === this.hoveredBubble) return 1;
      if (b === this.hoveredBubble) return -1;
      return b.radius - a.radius;
    });

    for (const b of sorted) {
      if (b.radius < 1) continue;
      const isHovered = b === this.hoveredBubble;
      const r = isHovered ? b.radius * 1.05 : b.radius;
      const [cr, cg, cb] = changeToRGB(b.change);

      // ── 3D Sphere gradient ──
      const grad = ctx.createRadialGradient(
        b.x - r * 0.3, b.y - r * 0.3, r * 0.05,
        b.x, b.y, r
      );
      const hr = Math.min(255, cr + 70);
      const hg = Math.min(255, cg + 70);
      const hb = Math.min(255, cb + 70);
      const er = Math.max(0, Math.round(cr * 0.7));
      const eg = Math.max(0, Math.round(cg * 0.7));
      const eb = Math.max(0, Math.round(cb * 0.7));

      grad.addColorStop(0, `rgb(${hr}, ${hg}, ${hb})`);
      grad.addColorStop(0.5, `rgb(${cr}, ${cg}, ${cb})`);
      grad.addColorStop(1, `rgb(${er}, ${eg}, ${eb})`);

      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Sponsored: pulsing gold glow ring ──
      if (b.data._isSponsored) {
        const pulse = 0.4 + Math.sin(Date.now() * 0.003) * 0.25;
        const glowR = r + 6;
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 160, 23, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(212, 160, 23, 0.6)';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      // ── Border ring ──
      ctx.strokeStyle = b.data._isSponsored ? `rgba(212, 160, 23, 0.6)` : `rgba(${er}, ${eg}, ${eb}, 0.5)`;
      ctx.lineWidth = b.data._isSponsored ? 2 : 1.5;
      ctx.stroke();

      // ── Hover ring (desktop only) ──
      if (isHovered && !mobile) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // ── Coin logo ──
      const logoUrl = getLogoUrl(b.data);
      const img = logoUrl ? this._getImage(logoUrl) : null;
      // On mobile, only show logos for larger bubbles to save GPU
      const logoThreshold = mobile ? 20 : 14;
      const hasLogo = img && b.radius > logoThreshold;

      if (hasLogo) {
        const logoSize = r < 28 ? r * 0.65 : r * 0.5;
        const logoY = r < 28 ? b.y - r * 0.15 : b.y - r * 0.22;
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, logoY, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, b.x - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
        ctx.restore();
      }

      // ── Text ──
      if (b.radius > 8) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = mobile ? 2 : 3;
        ctx.fillStyle = '#ffffff';

        const symbolSize = Math.max(10, r * BUBBLE.FONT_SIZE_RATIO);

        if (b.radius > 22) {
          // Symbol
          ctx.font = `800 ${symbolSize}px "DM Mono", monospace`;
          const symY = hasLogo ? b.y + r * 0.15 : b.y - symbolSize * 0.35;
          ctx.fillText(b.symbol, b.x, symY);

          // Change %
          const changeSize = Math.max(9, r * BUBBLE.CHANGE_FONT_RATIO);
          ctx.font = `600 ${changeSize}px "DM Mono", monospace`;
          const changeText = b.change != null ? (b.change >= 0 ? '+' : '') + b.change.toFixed(1) + '%' : '—';
          const chgY = hasLogo ? b.y + r * 0.15 + symbolSize * 0.9 : b.y + symbolSize * 0.5;
          ctx.fillText(changeText, b.x, chgY);

          // Sponsored micro-badge
          if (b.data._isSponsored && r > 30) {
            const badgeSize = Math.max(7, r * 0.14);
            ctx.font = `700 ${badgeSize}px "DM Mono", monospace`;
            ctx.fillStyle = '#d4a017';
            ctx.fillText('SPONSORED', b.x, chgY + changeSize + 2);
            ctx.fillStyle = '#ffffff';
          }
        } else {
          // Small bubble
          ctx.font = `800 ${symbolSize}px "DM Mono", monospace`;
          const smallSymY = hasLogo ? b.y + r * 0.25 : b.y;
          ctx.fillText(b.symbol, b.x, smallSymY);
        }

        ctx.restore();
      }
    }

    // Tooltip (desktop only)
    if (!mobile && this.hoveredBubble && this.hoveredBubble.radius > 5) {
      this._renderTooltip(this.hoveredBubble);
    }
  }

  _renderTooltip(b) {
    const ctx = this.ctx;
    const padding = 8;
    const lineHeight = 16;
    const name = b.name;
    const price = b.data.price != null ? '$' + b.data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: b.data.price < 1 ? 6 : 2 }) : '';

    ctx.save();
    ctx.font = '500 12px "DM Mono", monospace';
    const nameWidth = ctx.measureText(name).width;
    const priceWidth = ctx.measureText(price).width;
    const tooltipW = Math.max(nameWidth, priceWidth) + padding * 2;
    const tooltipH = lineHeight * 2 + padding * 2;

    let tx = b.x + b.radius + 12;
    let ty = b.y - tooltipH / 2;

    if (tx + tooltipW > this.width - 10) tx = b.x - b.radius - tooltipW - 12;
    if (ty < 10) ty = 10;
    if (ty + tooltipH > this.height - 10) ty = this.height - tooltipH - 10;

    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    this._roundRect(ctx, tx, ty, tooltipW, tooltipH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(71, 85, 105, 0.6)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, tx, ty, tooltipW, tooltipH, 6);
    ctx.stroke();

    ctx.fillStyle = '#f0f0f0';
    ctx.font = '600 12px "DM Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(name, tx + padding, ty + padding);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 12px "DM Mono", monospace';
    ctx.fillText(price, tx + padding, ty + padding + lineHeight);

    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ─── Image Loading ───

  _getImage(url) {
    if (!url) return null;
    if (this._imageCache.has(url)) return this._imageCache.get(url);

    this._imageCache.set(url, null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { this._imageCache.set(url, img); };
    img.onerror = () => { this._imageCache.set(url, null); };
    img.src = url;
    return null;
  }

  // ─── Interaction ───

  _updateHover() {
    const prev = this.hoveredBubble;
    this.hoveredBubble = this._findBubbleAt(this.mouseX, this.mouseY);
    this.canvas.style.cursor = this.hoveredBubble ? 'pointer' : 'default';

    if (prev !== this.hoveredBubble && this._onBubbleHover) {
      this._onBubbleHover(this.hoveredBubble ? this.hoveredBubble.data : null);
    }
  }

  _findBubbleAt(x, y) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (b.radius < 3) continue;
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.radius * b.radius) return b;
    }
    return null;
  }

  _handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  _handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bubble = this._findBubbleAt(x, y);
    if (bubble && this._onBubbleClick) {
      this._onBubbleClick(bubble.data);
    }
  }

  _touchBubble = null;
  _handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this._touchBubble = this._findBubbleAt(x, y);
    // Don't update mouseX/mouseY on touch — prevents phantom hover jitter
  }

  _handleTouchEnd(e) {
    if (this._touchBubble && this._onBubbleClick) {
      this._onBubbleClick(this._touchBubble.data);
    }
    this._touchBubble = null;
  }

  // ─── Helpers ───

  _periodToKey(period) {
    const map = { '1h': 'change1h', '24h': 'change24h', '7d': 'change7d', '30d': 'change30d', '1y': 'change1y' };
    return map[period] || 'change24h';
  }
}
