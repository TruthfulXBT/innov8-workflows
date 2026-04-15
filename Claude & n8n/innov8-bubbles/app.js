/* ============================================================
   app.js — Innov8 Bubbles: Entry point, state, event wiring
   ============================================================ */

import { ASSET_CLASSES, STORAGE, STRIPE_CONFIG, AD_BADGE_TYPES, CURRENCIES, COLOR_SCHEMES, CUSTOM_ASSET_TYPES, PENSION_PROVIDERS, SPONSORED_PRICES, formatPrice, formatLargeNumber, formatChange, getLogoUrl, setColorScheme, getColorScheme } from './config.js';
import { BubbleEngine } from './bubble-engine.js';
import { fetchAssets, invalidateCache, fetchChartData } from './data-service.js';
import * as Portfolio from './portfolio.js';
import * as CustomAssets from './custom-assets.js';
import { initFirebase, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut as firebaseSignOut, onAuthChange, getCurrentUser, isSignedIn, getUserInitial, getUserDisplayName, fetchApprovedAds, fetchApprovedSponsored, syncLocalPortfoliosToCloud, loadPortfoliosFromCloud, uploadAdLogo, loadCustomAssetsFromCloud, syncLocalCustomAssetsToCloud } from './auth.js';
import { initStripe, submitAndPay, submitAndPaySponsored, checkPaymentReturn, generateAdPreviewHTML, generateSponsoredItemHTML } from './ads.js';

// ─── State ───
const state = {
  assetClass: 'crypto',
  period: '24h',
  searchQuery: '',
  activePortfolioId: null,
  allAssets: [],        // raw from API
  filteredAssets: [],    // after search + portfolio filter
  isSample: false,
  refreshInterval: 60,
  refreshTimer: null,
  selectedAsset: null,   // for detail panel
  viewMode: 'bubble',   // 'bubble' or 'table'
  sortBy: 'marketCap',
  sortDir: 'desc',
  theme: 'midnight',    // 'midnight', 'dark', 'slate', 'light'
  currency: 'usd',      // 'usd', 'gbp', 'eur', 'jpy', 'aud'
  colorScheme: 'red-green', // 'red-green', 'blue-yellow', 'purple-orange'
  propertyFilter: 'all',  // 'all', 'mine', 'regional'
};

// ─── DOM References ───
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  loading: $('#loading-screen'),
  canvas: $('#bubble-canvas'),
  canvasContainer: $('#canvas-container'),
  sampleBadge: $('#sample-badge'),
  emptyState: $('#empty-state'),
  apiPrompt: $('#api-prompt'),
  apiPromptBtn: $('#api-prompt-btn'),
  refreshBarFill: $('#refresh-bar-fill'),

  // Header
  assetPills: $('#asset-class-pills'),
  periodPills: $('#period-pills'),
  searchInput: $('#search-input'),
  mobileSearchInput: $('#mobile-search-input'),

  // Portfolio dropdown
  portfolioDropdown: $('#portfolio-dropdown'),
  portfolioBtn: $('#portfolio-btn'),
  portfolioLabel: $('#portfolio-label'),
  portfolioMenu: $('#portfolio-menu'),
  portfolioList: $('#portfolio-list'),
  managePortfoliosBtn: $('#manage-portfolios-btn'),

  // Detail panel
  detailPanel: $('#detail-panel'),
  detailClose: $('#detail-close'),
  detailImage: $('#detail-image'),
  detailName: $('#detail-name'),
  detailSymbol: $('#detail-symbol'),
  detailPrice: $('#detail-price'),
  detailChangeMain: $('#detail-change-main'),
  detailMcap: $('#detail-mcap'),
  detailVolume: $('#detail-volume'),
  detail1h: $('#detail-1h'),
  detail24h: $('#detail-24h'),
  detail7d: $('#detail-7d'),
  detail30d: $('#detail-30d'),
  detail1y: $('#detail-1y'),
  addToPortfolioBtn: $('#add-to-portfolio-btn'),
  portfolioPopover: $('#portfolio-popover'),
  popoverPortfolioList: $('#popover-portfolio-list'),
  popoverNewPortfolio: $('#popover-new-portfolio'),

  // Settings modal
  settingsBtn: $('#settings-btn'),
  settingsModal: $('#settings-modal'),
  settingsClose: $('#settings-close'),
  fmpKeyInput: $('#fmp-key-input'),
  settingsSave: $('#settings-save'),

  // Portfolio modal
  portfolioModal: $('#portfolio-modal'),
  portfolioModalClose: $('#portfolio-modal-close'),
  portfolioManagerList: $('#portfolio-manager-list'),
  newPortfolioInput: $('#new-portfolio-input'),
  createPortfolioBtn: $('#create-portfolio-btn'),

  // Mobile
  hamburgerBtn: $('#hamburger-btn'),
  mobileMenu: $('#mobile-menu'),
  mobileMenuClose: $('#mobile-menu-close'),
  mobileAssetPills: $('#mobile-asset-pills'),
  mobilePeriodPills: $('#mobile-period-pills'),
  mobilePortfolioList: $('#mobile-portfolio-list'),
  mobileSettingsBtn: $('#mobile-settings-btn'),

  // Toast
  toastContainer: $('#toast-container'),

  // View toggle + table
  viewBubbles: $('#view-bubbles'),
  viewTable: $('#view-table'),
  tableView: $('#table-view'),
  assetTableBody: $('#asset-table-body'),
  assetTable: $('#asset-table'),

  // Auth
  signinBtn: $('#signin-btn'),
  userMenu: $('#user-menu'),
  userAvatarBtn: $('#user-avatar-btn'),
  userAvatar: $('#user-avatar'),
  userDropdownMenu: $('#user-dropdown-menu'),
  userMenuName: $('#user-menu-name'),
  userMenuEmail: $('#user-menu-email'),
  userManagePortfolios: $('#user-manage-portfolios'),
  userPlaceAd: $('#user-place-ad'),
  userSignout: $('#user-signout'),

  // Auth modal
  authModal: $('#auth-modal'),
  authModalTitle: $('#auth-modal-title'),
  authClose: $('#auth-close'),
  googleSigninBtn: $('#google-signin-btn'),
  signinForm: $('#signin-form'),
  signupForm: $('#signup-form'),
  authError: $('#auth-error'),

  // Property sub-filter bar
  propertyFilterBar: $('#property-filter-bar'),
  propertyFilterPills: $('#property-filter-pills'),
  propertyFilterCount: $('#property-filter-count'),

  // Custom asset modal
  customAssetModal: $('#custom-asset-modal'),
  customAssetClose: $('#custom-asset-close'),
  customAssetTitle: $('#custom-asset-modal-title'),
  caTypePills: $('#ca-type-pills'),
  caName: $('#ca-name'),
  caSubtype: $('#ca-subtype'),
  caPostcode: $('#ca-postcode'),
  caBedrooms: $('#ca-bedrooms'),
  caPurchasePrice: $('#ca-purchase-price'),
  caCurrentValue: $('#ca-current-value'),
  caPurchaseDate: $('#ca-purchase-date'),
  caLocation: $('#ca-location'),
  caNotes: $('#ca-notes'),
  caPropertyFields: $('#ca-property-fields'),
  caPensionFields: $('#ca-pension-fields'),
  caPensionProvider: $('#ca-pension-provider'),
  caPensionEmployee: $('#ca-pension-employee'),
  caPensionEmployer: $('#ca-pension-employer'),
  caPensionGrowth: $('#ca-pension-growth'),
  caPensionRetirementAge: $('#ca-pension-retirement-age'),
  caPensionProjection: $('#ca-pension-projection'),
  caLocationGroup: $('#ca-location-group'),
  caSavingsGrowthGroup: $('#ca-savings-growth-group'),
  caSavingsGrowth: $('#ca-savings-growth'),
  caPurchasePriceLabel: $('#ca-purchase-price-label'),
  caCurrentValueLabel: $('#ca-current-value-label'),
  caPurchaseDateLabel: $('#ca-purchase-date-label'),
  caAutoValue: $('#ca-auto-value'),
  caValuationStatus: $('#ca-valuation-status'),
  caSaveBtn: $('#ca-save-btn'),
  caDeleteBtn: $('#ca-delete-btn'),
  caPortfolioBtn: $('#ca-portfolio-btn'),
  caCancelBtn: $('#ca-cancel-btn'),
  addCustomAssetBtn: $('#add-custom-asset-btn'),
  mobileAddCustomAssetBtn: $('#mobile-add-custom-asset-btn'),

  // Ad modal
  adModal: $('#ad-modal'),
  adClose: $('#ad-close'),
  adBadgeSelect: $('#ad-badge-select'),
  adName: $('#ad-name'),
  adText: $('#ad-text'),
  adUrl: $('#ad-url'),
  adDurationGrid: $('#ad-duration-grid'),
  adPreviewStrip: $('#ad-preview-strip'),
  adSummary: $('#ad-summary'),
  adPayBtn: $('#ad-pay-btn'),
};

let engine;


// ─── Ad Ticker ───

// Placeholder sponsored ads — replace with real ad data from your backend/n8n
const TICKER_ADS = [
  { badge: 'new-drop', badgeText: 'NEW', name: '$LUNAR', text: 'AI-powered DeFi launching May 2026 — Early access live', url: '#' },
  { badge: 'ipo', badgeText: 'IPO', name: 'Klarna', text: 'Fintech giant IPO expected Q2 2026 — $15B valuation', url: '#' },
  { badge: 'presale', badgeText: 'PRESALE', name: '$NEXGEN', text: 'Next-gen L2 blockchain — Presale now open', url: '#' },
  { badge: 'promo', badgeText: 'PROMO', name: 'Innov8', text: 'Build your custom portfolio — Track all assets in one place', url: '#' },
  { badge: 'new-drop', badgeText: 'NEW', name: '$AURA', text: 'Real-world asset tokenisation — Launching on Ethereum', url: '#' },
  { badge: 'ipo', badgeText: 'IPO', name: 'Stripe', text: 'Payments giant confidentially files for IPO', url: '#' },
  { badge: 'presale', badgeText: 'PRESALE', name: '$ORBIT', text: 'Cross-chain DEX aggregator — Whitelist open', url: '#' },
  { badge: 'new-drop', badgeText: 'NEW', name: '$VRTX', text: 'Decentralised GPU compute network — Token live', url: '#' },
];

async function _initTicker() {
  const container = document.getElementById('ticker-content');
  if (!container) return;

  // Try to fetch real ads from Firestore, fall back to placeholder ads
  let ads = TICKER_ADS;
  try {
    const approvedAds = await fetchApprovedAds();
    if (approvedAds && approvedAds.length > 0) {
      ads = [...approvedAds, ...TICKER_ADS]; // paid ads first, then defaults
    }
  } catch (e) {
    // Firestore not configured — use defaults
  }

  // Build items HTML — duplicate for seamless loop
  const itemsHTML = ads.map(ad => {
    const logoHtml = ad.logoUrl ? `<img class="ticker-ad-logo" src="${ad.logoUrl}" alt="">` : '';
    return `<a class="ticker-item" href="${ad.url || '#'}" target="_blank" rel="noopener">
      <span class="ticker-badge ${ad.badge}">${ad.badgeText}</span>
      ${logoHtml}
      <span class="ticker-name">${ad.name}</span>
      <span>${ad.text}</span>
    </a>`;
  }).join('<span class="ticker-sep">|</span>');

  // Double the content for seamless infinite scroll
  container.innerHTML = itemsHTML + '<span class="ticker-sep">|</span>' + itemsHTML;

  // Adjust speed based on content width
  const duration = Math.max(20, ads.length * 5);
  container.style.setProperty('--ticker-duration', duration + 's');
}


// ─── Sponsored Modal ───

let _spState = { step: 1, durationIndex: 0, logoFile: null, logoUrl: null };

function _wireSponsoredModal() {
  const modal = $('#sponsored-modal');
  if (!modal) return;

  // Open from user menu
  const promoteBtn = $('#user-promote-launch');
  if (promoteBtn) {
    promoteBtn.addEventListener('click', () => {
      if (!isSignedIn()) {
        _openModal($('#auth-modal'));
        _toast('Please sign in to promote a launch', 'error');
        return;
      }
      _openSponsoredModal();
    });
  }

  // Close
  $('#sponsored-close').addEventListener('click', () => _closeModal(modal));

  // Step navigation
  $('#sp-next-1').addEventListener('click', () => {
    const name = $('#sp-name').value.trim();
    const symbol = $('#sp-symbol').value.trim();
    if (!name || !symbol) {
      _toast('Please enter a name and ticker symbol', 'error');
      return;
    }
    _spGoToStep(2);
  });
  $('#sp-back-2').addEventListener('click', () => _spGoToStep(1));
  $('#sp-next-2').addEventListener('click', () => _spGoToStep(3));
  $('#sp-back-3').addEventListener('click', () => _spGoToStep(2));

  // Logo upload
  const logoUpload = $('#sp-logo-upload');
  const logoInput = $('#sp-logo-input');
  const logoPreview = $('#sp-logo-preview');
  if (logoUpload && logoInput) {
    logoUpload.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', () => {
      const file = logoInput.files[0];
      if (!file) return;
      if (file.size > 200 * 1024) { _toast('Logo must be under 200KB', 'error'); return; }
      _spState.logoFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        _spState.logoUrl = e.target.result;
        logoPreview.innerHTML = `<img src="${e.target.result}" style="height:100%;max-width:100%;object-fit:contain;border-radius:6px">`;
        logoPreview.classList.add('has-image');
      };
      reader.readAsDataURL(file);
    });
  }

  // Duration selection
  const durationGrid = $('#sp-duration-grid');
  durationGrid.innerHTML = SPONSORED_PRICES.map((p, i) =>
    `<div class="sp-duration-card ${i === 0 ? 'selected' : ''}" data-sp-dur="${i}">
      <span class="sp-duration-days">${p.label}</span>
      <span class="sp-duration-price">${p.price}</span>
    </div>`
  ).join('');

  durationGrid.addEventListener('click', (e) => {
    const card = e.target.closest('[data-sp-dur]');
    if (!card) return;
    durationGrid.querySelectorAll('.sp-duration-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    _spState.durationIndex = parseInt(card.dataset.spDur);
  });

  // Pay button
  $('#sp-pay-btn').addEventListener('click', async () => {
    try {
      const btn = $('#sp-pay-btn');
      btn.disabled = true;
      btn.textContent = 'Processing...';

      let logoUrl = _spState.logoUrl || null;
      if (_spState.logoFile) {
        logoUrl = await uploadAdLogo(_spState.logoFile);
      }

      const data = _getSponsoredFormData();
      data.logoUrl = logoUrl;

      await submitAndPaySponsored(data, _spState.durationIndex);
      _closeModal(modal);
      _toast('Launch promoted! It will appear shortly.', 'success');
      _fetchAndRender(false);
    } catch (e) {
      _toast(e.message || 'Failed to submit', 'error');
      const btn = $('#sp-pay-btn');
      btn.disabled = false;
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pay &amp; Launch';
    }
  });
}

function _openSponsoredModal() {
  _spState = { step: 1, durationIndex: 0, logoFile: null, logoUrl: null };
  // Reset form
  const fields = ['sp-name', 'sp-symbol', 'sp-description', 'sp-url', 'sp-price', 'sp-change'];
  fields.forEach(id => { const el = $('#' + id); if (el) el.value = ''; });
  const logoPreview = $('#sp-logo-preview');
  if (logoPreview) {
    logoPreview.classList.remove('has-image');
    logoPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span>Click to upload</span>';
  }
  _spGoToStep(1);
  _openModal($('#sponsored-modal'));
}

function _spGoToStep(step) {
  _spState.step = step;

  // Update step indicators
  $('#sponsored-modal').querySelectorAll('[data-sp-step]').forEach(el => {
    const s = parseInt(el.dataset.spStep);
    el.classList.toggle('active', s === step);
    el.classList.toggle('done', s < step);
  });

  // Show/hide step content
  for (let i = 1; i <= 3; i++) {
    const el = $('#sp-step-' + i);
    if (el) el.classList.toggle('hidden', i !== step);
  }

  // Step 3: render preview
  if (step === 3) {
    const data = _getSponsoredFormData();
    const duration = SPONSORED_PRICES[_spState.durationIndex];

    // Strip preview
    const stripPreview = $('#sp-preview-strip');
    if (stripPreview) {
      stripPreview.innerHTML = generateSponsoredItemHTML({
        ...data,
        badgeText: (AD_BADGE_TYPES.find(b => b.value === data.badge) || AD_BADGE_TYPES[0]).badgeText,
        logoUrl: _spState.logoUrl,
      });
    }

    // Bubble preview (simple visual mockup)
    const bubblePreview = $('#sp-preview-bubble');
    if (bubblePreview) {
      const sym = data.symbol || '?';
      const chg = data.change24h ? (data.change24h >= 0 ? '+' : '') + Number(data.change24h).toFixed(1) + '%' : '';
      bubblePreview.innerHTML = `
        <div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,rgba(34,197,94,0.8),rgba(22,163,74,0.6));display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(212,160,23,0.5),0 0 40px rgba(212,160,23,0.2);border:2px solid rgba(212,160,23,0.6);animation:sp-glow-pulse 1.5s ease-in-out infinite">
          <span style="font:800 16px 'DM Mono',monospace;color:#fff">${sym}</span>
          <span style="font:600 11px 'DM Mono',monospace;color:#fff">${chg}</span>
          <span style="font:700 6px 'DM Mono',monospace;color:#d4a017;margin-top:2px">SPONSORED</span>
        </div>`;
    }

    // Summary
    const summary = $('#sp-summary');
    if (summary && duration) {
      summary.innerHTML = `<strong>${duration.label}</strong> — <strong style="color:#d4a017">${duration.price}</strong> — Featured bubble + New Launches strip`;
    }
  }
}

function _getSponsoredFormData() {
  return {
    name: ($('#sp-name').value || '').trim(),
    symbol: ($('#sp-symbol').value || '').trim().toUpperCase(),
    description: ($('#sp-description').value || '').trim(),
    url: ($('#sp-url').value || '').trim() || '#',
    badge: $('#sp-badge-select').value,
    price: parseFloat($('#sp-price').value) || 0,
    change24h: parseFloat($('#sp-change').value) || 0,
  };
}


// ─── Initialize ───

function _init() {
  try {
    _loadSettings();
    state.activePortfolioId = Portfolio.getActivePortfolioId();

    // Init Firebase & Stripe (non-blocking — works without them)
    initFirebase();
    initStripe();
    checkPaymentReturn().then(adId => {
      if (adId) _toast('Ad submitted and approved!', 'success');
    });

    engine = new BubbleEngine(dom.canvas);
    engine.onBubbleClick(asset => _showDetail(asset));
    engine.start();

    _wireAssetPills();
    _wirePeriodPills();
    _wireSearch();
    _wirePortfolioDropdown();
    _wireDetailPanel();
    _wireDetailChartPills();
    _wireSettingsModal();
    _wirePortfolioModal();
    _wireMobileMenu();
    _wireResize();
    _wireRefreshPills();
    _wireAuthModal();
    _wireUserMenu();
    _wireAdModal();
    _wireSponsoredModal();
    _wirePropertyFilter();
    _wireCustomAssetModal();
    _wireViewToggle();
    _wireShareButton();
    _wireHoldingsForm();
    _wireNetWorthPanel();
    _wireKeyboardShortcuts();
    _wireVisibilityThrottle();
    _initTicker();

    // Listen for auth state
    onAuthChange(_handleAuthStateChange);

    _fetchAndRender();
  } catch (e) {
    console.error('[init] error:', e.message, e.stack);
  }
}

// Module scripts are deferred — DOM is parsed when this runs.
// Use setTimeout(0) to let the browser complete layout before measuring.
setTimeout(_init, 0);


// ─── Data Flow ───

let _hasLoadedOnce = false;

async function _fetchAndRender(showLoader = true) {
  // Only show full loading screen on first load or explicit asset class switch
  if (!_hasLoadedOnce && showLoader) {
    _showLoading(true);
  }
  _hideStates();

  const assetClass = state.assetClass;

  // Check if key required (skip for "all" — it will show what it can)
  if (assetClass !== 'all' && ASSET_CLASSES[assetClass] && ASSET_CLASSES[assetClass].requiresKey && !localStorage.getItem(STORAGE.FMP_KEY)) {
    _showLoading(false);
    _showApiPrompt(true);
    engine.setBubbles([], state.period);
    return;
  }

  try {
    const { data, isSample } = await fetchAssets(assetClass);
    state.allAssets = data;
    state.isSample = isSample;

    // Ensure canvas is sized correctly
    engine.resize();
    _applyFilters();
    _showLoading(false);
    _hasLoadedOnce = true;

    if (isSample) {
      dom.sampleBadge.classList.remove('hidden');
    }

    _updateFooterStats();
    _startAutoRefresh();
  } catch (err) {
    console.error('[app] fetch error:', err);
    _showLoading(false);
    _hasLoadedOnce = true;
    _toast('Failed to load data. Showing sample data.', 'error');
  }
}

function _applyFilters() {
  let assets = [...state.allAssets];

  // When a portfolio is active, inject custom assets that belong to it
  // so they show alongside crypto/stocks/etc regardless of active tab
  if (state.activePortfolioId && state.assetClass !== 'assets' && state.assetClass !== 'finance') {
    const portfolio = Portfolio.getActivePortfolio();
    if (portfolio) {
      const idSet = new Set(Portfolio.getAssetIds(portfolio));
      const customInPortfolio = CustomAssets.getCustomAssetsNormalized()
        .filter(a => idSet.has(a.id));
      if (customInPortfolio.length > 0) {
        // Dedupe — don't add if already present (e.g. on 'all' tab)
        const existingIds = new Set(assets.map(a => a.id));
        for (const ca of customInPortfolio) {
          if (!existingIds.has(ca.id)) assets.push(ca);
        }
      }
    }
  }

  // Portfolio filter
  if (state.activePortfolioId) {
    const portfolio = Portfolio.getActivePortfolio();
    if (portfolio) {
      const idSet = new Set(Portfolio.getAssetIds(portfolio));
      assets = assets.filter(a => idSet.has(a.id));
    }
  }

  // Property sub-filter
  if ((state.assetClass === 'assets' || state.assetClass === 'finance') && state.propertyFilter !== 'all') {
    if (state.propertyFilter === 'mine') {
      assets = assets.filter(a => a._isCustom);
    } else if (state.propertyFilter === 'regional') {
      assets = assets.filter(a => !a._isCustom);
    }
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    assets = assets.filter(a =>
      a.symbol.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
    );
  }

  // Enrich assets with holdings data when a portfolio is active
  if (state.activePortfolioId) {
    const portfolio = Portfolio.getActivePortfolio();
    if (portfolio) {
      const priceMap = {};
      assets.forEach(a => { priceMap[a.id] = a.price; });
      const summary = Portfolio.getPortfolioSummary(portfolio, priceMap);
      const assetMap = new Map(summary.assetSummaries.map(s => [s.assetId, s]));
      assets.forEach(a => {
        const s = assetMap.get(a.id);
        if (s) {
          a._holdingsQty = s.totalQty;
          a._holdingsValue = s.value;
          a._holdingsPL = s.pl;
          a._holdingsPLPercent = s.plPercent;
          a._holdingsAvgCost = s.avgCost;
        }
      });
    }
  }

  state.filteredAssets = assets;

  // Update filter count
  _updatePropertyFilterCount();

  // Render the active view
  if (state.viewMode === 'table') {
    _renderTable();
  } else {
    engine.setBubbles(assets, state.period);
  }

  // Show/hide empty state with contextual messaging
  const emptyTitle = $('#empty-title');
  const emptySub = $('#empty-subtitle');
  if (assets.length === 0) {
    if (state.assetClass === 'launches') {
      emptyTitle.textContent = '🚀 No sponsored launches yet';
      emptySub.innerHTML = 'Promote your token, ICO or project here<br><button class="btn btn-primary btn-sm" style="margin-top:12px;background:#d4a017" onclick="document.getElementById(\'user-promote-launch\').click()">Promote a Launch — from £500</button>';
    } else if (state.assetClass === 'finance') {
      emptyTitle.textContent = '🏦 No financial assets yet';
      emptySub.innerHTML = 'Track your pensions, savings & ISAs<br><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="document.getElementById(\'add-custom-asset-btn\').click()">+ Add Pension or Savings</button>';
    } else if (state.assetClass === 'assets' && state.allAssets.length === 0) {
      emptyTitle.textContent = '🏠 No personal assets yet';
      emptySub.innerHTML = 'Add properties, vehicles, watches & more<br><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="document.getElementById(\'add-custom-asset-btn\').click()">+ Add Asset</button>';
    } else if (state.searchQuery) {
      emptyTitle.textContent = 'No assets found';
      emptySub.textContent = 'Try a different search term';
    } else {
      emptyTitle.textContent = 'No assets found';
      emptySub.textContent = 'Try a different asset class';
    }
    dom.emptyState.classList.remove('hidden');
  } else {
    dom.emptyState.classList.add('hidden');
  }
}


// ─── Asset Class Pills ───

function _wireAssetPills() {
  const handler = (e) => {
    const btn = e.target.closest('.pill');
    if (!btn || !btn.dataset.class) return;
    state.assetClass = btn.dataset.class;

    // Update all pill groups
    _syncPills('class', btn.dataset.class);
    _closeDetail();
    _updatePropertyFilterVisibility();
    _fetchAndRender();
  };

  dom.assetPills.addEventListener('click', handler);
  dom.mobileAssetPills.addEventListener('click', handler);
}

function _syncPills(type, value) {
  const attr = type === 'class' ? 'data-class' : 'data-period';
  $$(`[${attr}]`).forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute(attr) === value);
  });
}


// ─── Period Pills ───

function _wirePeriodPills() {
  const periodToField = { '1h': 'change1h', '24h': 'change24h', '7d': 'change7d', '30d': 'change30d', '1y': 'change1y' };
  const handler = (e) => {
    const btn = e.target.closest('.pill');
    if (!btn || !btn.dataset.period) return;
    state.period = btn.dataset.period;
    _syncPills('period', btn.dataset.period);
    // In table view, also sort by the selected period
    if (state.viewMode === 'table') {
      const field = periodToField[btn.dataset.period];
      if (field) {
        state.sortBy = field;
        state.sortDir = 'desc'; // best performers first
      }
    }
    _applyFilters();
  };

  dom.periodPills.addEventListener('click', handler);
  dom.mobilePeriodPills.addEventListener('click', handler);
}


// ─── Search ───

function _wireSearch() {
  let debounce;
  const handler = (value) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.searchQuery = value;
      _applyFilters();
    }, 300);
  };

  dom.searchInput.addEventListener('input', (e) => handler(e.target.value));
  dom.mobileSearchInput.addEventListener('input', (e) => {
    handler(e.target.value);
    dom.searchInput.value = e.target.value;
  });
}


// ─── Portfolio Dropdown ───

function _wirePortfolioDropdown() {
  dom.portfolioBtn.addEventListener('click', () => {
    dom.portfolioDropdown.classList.toggle('open');
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!dom.portfolioDropdown.contains(e.target)) {
      dom.portfolioDropdown.classList.remove('open');
    }
  });

  dom.portfolioMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-item[data-portfolio]');
    if (!item) return;

    const id = item.dataset.portfolio === 'all' ? null : item.dataset.portfolio;
    state.activePortfolioId = id;
    Portfolio.setActivePortfolio(id);

    _updatePortfolioLabel();
    _applyFilters();
    dom.portfolioDropdown.classList.remove('open');
  });

  dom.managePortfoliosBtn.addEventListener('click', () => {
    dom.portfolioDropdown.classList.remove('open');
    _openPortfolioModal();
  });

  _renderPortfolioDropdown();
}

function _renderPortfolioDropdown() {
  const portfolios = Portfolio.getPortfolios();

  // Desktop dropdown
  dom.portfolioList.innerHTML = portfolios.map(p =>
    `<button class="dropdown-item ${state.activePortfolioId === p.id ? 'active' : ''}" data-portfolio="${p.id}">${p.name} <span style="color:var(--muted);font-size:0.7rem">(${Portfolio.getAssetIds(p).length})</span></button>`
  ).join('');

  // "All Assets" active state
  dom.portfolioMenu.querySelector('[data-portfolio="all"]').classList.toggle('active', !state.activePortfolioId);

  // Mobile portfolio list
  dom.mobilePortfolioList.innerHTML =
    `<button class="mobile-menu-item ${!state.activePortfolioId ? 'active' : ''}" data-portfolio="all">All Assets</button>` +
    portfolios.map(p =>
      `<button class="mobile-menu-item ${state.activePortfolioId === p.id ? 'active' : ''}" data-portfolio="${p.id}">${p.name} (${Portfolio.getAssetIds(p).length})</button>`
    ).join('');

  // Mobile portfolio click
  dom.mobilePortfolioList.onclick = (e) => {
    const item = e.target.closest('[data-portfolio]');
    if (!item) return;
    const id = item.dataset.portfolio === 'all' ? null : item.dataset.portfolio;
    state.activePortfolioId = id;
    Portfolio.setActivePortfolio(id);
    _updatePortfolioLabel();
    _applyFilters();
    _closeMobileMenu();
  };

  _updatePortfolioLabel();
}

function _updatePortfolioLabel() {
  if (state.activePortfolioId) {
    const p = Portfolio.getActivePortfolio();
    dom.portfolioLabel.textContent = p ? p.name : 'All Assets';
  } else {
    dom.portfolioLabel.textContent = 'All Assets';
  }
}


// ─── Detail Panel ───

function _wireDetailPanel() {
  dom.detailClose.addEventListener('click', _closeDetail);

  dom.addToPortfolioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dom.portfolioPopover.classList.toggle('hidden');
    _renderPopoverPortfolios();
  });

  dom.popoverNewPortfolio.addEventListener('click', () => {
    const name = prompt('Portfolio name:');
    if (name && name.trim()) {
      const p = Portfolio.createPortfolio(name);
      if (state.selectedAsset) {
        Portfolio.addAsset(p.id, state.selectedAsset.id);
        _toast(`Added to "${p.name}"`, 'success');
      }
      dom.portfolioPopover.classList.add('hidden');
      _renderPortfolioDropdown();
    }
  });

  // Close popover on outside click
  document.addEventListener('click', (e) => {
    if (!dom.portfolioPopover.contains(e.target) && e.target !== dom.addToPortfolioBtn) {
      dom.portfolioPopover.classList.add('hidden');
    }
  });
}

function _showDetail(asset) {
  // Custom assets open the edit modal instead of the detail panel
  if (asset._isCustom) {
    _openCustomAssetForEdit(asset._customAssetId);
    return;
  }

  state.selectedAsset = asset;
  const p = dom.detailPanel;

  const logoUrl = getLogoUrl(asset);
  dom.detailImage.src = logoUrl || '';
  dom.detailImage.style.display = logoUrl ? 'block' : 'none';
  dom.detailName.textContent = asset.name;
  dom.detailSymbol.textContent = asset.symbol;
  dom.detailPrice.textContent = formatPrice(asset.price);

  const mainChange = asset['change' + state.period.replace('h','h').replace('d','d').replace('y','y')] || asset.change24h;
  dom.detailChangeMain.textContent = formatChange(mainChange);
  dom.detailChangeMain.className = 'detail-change ' + (mainChange >= 0 ? 'color-green' : 'color-red');

  dom.detailMcap.textContent = formatLargeNumber(asset.marketCap);
  dom.detailVolume.textContent = formatLargeNumber(asset.volume24h);

  _setChangeEl(dom.detail1h, asset.change1h);
  _setChangeEl(dom.detail24h, asset.change24h);
  _setChangeEl(dom.detail7d, asset.change7d);
  _setChangeEl(dom.detail30d, asset.change30d);
  _setChangeEl(dom.detail1y, asset.change1y);

  // Show/hide sponsored-specific content vs portfolio button
  const portfolioAdd = document.getElementById('detail-portfolio-add');
  let sponsoredSection = document.getElementById('detail-sponsored-section');

  if (asset._isSponsored) {
    // Hide portfolio button for sponsored
    if (portfolioAdd) portfolioAdd.style.display = 'none';

    // Create or update the sponsored section
    if (!sponsoredSection) {
      sponsoredSection = document.createElement('div');
      sponsoredSection.id = 'detail-sponsored-section';
      sponsoredSection.className = 'detail-sponsored-section';
      portfolioAdd.parentElement.insertBefore(sponsoredSection, portfolioAdd);
    }
    sponsoredSection.style.display = '';

    const badge = AD_BADGE_TYPES.find(b => b.value === asset._sponsoredBadge) || AD_BADGE_TYPES[0];
    sponsoredSection.innerHTML = `
      <div class="detail-sponsored-badge">
        <span class="sponsored-badge ${badge.value}">${badge.badgeText}</span>
        <span class="detail-sponsored-label">SPONSORED LAUNCH</span>
      </div>
      ${asset._sponsoredDescription ? `<p class="detail-sponsored-desc">${asset._sponsoredDescription}</p>` : ''}
      <a class="btn btn-primary detail-visit-btn" href="${asset._sponsoredUrl || '#'}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Visit Project
      </a>
    `;
  } else {
    // Normal asset — show portfolio button, hide sponsored section
    if (portfolioAdd) portfolioAdd.style.display = '';
    if (sponsoredSection) sponsoredSection.style.display = 'none';
  }

  // Show holdings summary if user owns this asset in any portfolio
  _renderDetailHoldings(asset);

  p.classList.remove('hidden');
  requestAnimationFrame(() => p.classList.add('open'));

  // Render chart (async, non-blocking)
  _renderDetailChart(asset, 30);
}

function _setChangeEl(el, val) {
  el.textContent = formatChange(val);
  el.className = 'detail-stat-value ' + (val == null ? '' : val >= 0 ? 'color-green' : 'color-red');
}

// ─── Detail Holdings Summary ───

function _renderDetailHoldings(asset) {
  const container = document.getElementById('detail-actions');
  if (!container) return;

  // Remove old holdings section if exists
  let section = document.getElementById('detail-holdings-section');
  if (section) section.remove();

  // Find all holdings for this asset across all portfolios
  const portfolios = Portfolio.getPortfolios();
  const allHoldings = [];
  for (const p of portfolios) {
    const lots = Portfolio.getHoldingsForAsset(p.id, asset.id);
    if (lots.length > 0) {
      allHoldings.push({ portfolio: p, lots });
    }
  }

  if (allHoldings.length === 0) return;

  // Calculate totals
  const currentPrice = asset.price || 0;
  let totalQty = 0;
  let totalCost = 0;
  for (const { lots } of allHoldings) {
    for (const h of lots) {
      totalQty += h.quantity || 0;
      totalCost += (h.quantity || 0) * (h.purchasePrice || 0);
    }
  }
  const totalValue = totalQty * currentPrice;
  const totalPL = totalValue - totalCost;
  const totalPLPct = totalCost > 0 ? ((totalPL / totalCost) * 100).toFixed(1) : '0.0';
  const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
  const isPos = totalPL >= 0;
  const sym = document.querySelector('[data-currency].active')?.textContent?.charAt(0) || '$';

  // Build the HTML
  section = document.createElement('div');
  section.id = 'detail-holdings-section';
  section.className = 'detail-holdings-section';

  let lotsHTML = '';
  for (const { portfolio, lots } of allHoldings) {
    for (const h of lots) {
      if (!h.quantity) continue;
      const lotVal = h.quantity * currentPrice;
      const lotCost = h.quantity * (h.purchasePrice || 0);
      const lotPL = lotVal - lotCost;
      const lotPos = lotPL >= 0;
      lotsHTML += `<div class="detail-holding-lot">
        <span class="lot-qty">${h.quantity.toLocaleString('en-US', {maximumFractionDigits:4})}</span>
        <span class="lot-at">@ ${sym}${(h.purchasePrice || 0).toLocaleString('en-US', {maximumFractionDigits:2})}</span>
        <span class="lot-pl ${lotPos ? 'color-green' : 'color-red'}">${lotPos ? '+' : ''}${sym}${Math.abs(lotPL).toLocaleString('en-US', {maximumFractionDigits:0})}</span>
      </div>`;
    }
  }

  section.innerHTML = `
    <div class="detail-holdings-header">
      <span class="detail-holdings-label">YOUR POSITION</span>
    </div>
    <div class="detail-holdings-summary">
      <div class="detail-holdings-row">
        <span>Quantity</span>
        <span class="detail-holdings-val">${totalQty.toLocaleString('en-US', {maximumFractionDigits:4})}</span>
      </div>
      <div class="detail-holdings-row">
        <span>Avg Cost</span>
        <span class="detail-holdings-val">${sym}${avgCost.toLocaleString('en-US', {maximumFractionDigits:2})}</span>
      </div>
      <div class="detail-holdings-row">
        <span>Value</span>
        <span class="detail-holdings-val">${sym}${totalValue.toLocaleString('en-US', {maximumFractionDigits:2})}</span>
      </div>
      <div class="detail-holdings-row">
        <span>P&L</span>
        <span class="detail-holdings-val ${isPos ? 'color-green' : 'color-red'}">${isPos ? '+' : ''}${sym}${Math.abs(totalPL).toLocaleString('en-US', {maximumFractionDigits:0})} (${isPos ? '+' : ''}${totalPLPct}%)</span>
      </div>
    </div>
    ${lotsHTML ? `<div class="detail-holdings-lots">${lotsHTML}</div>` : ''}
  `;

  // Insert before the portfolio add button
  const portfolioAdd = document.getElementById('detail-portfolio-add');
  if (portfolioAdd) {
    container.insertBefore(section, portfolioAdd);
  } else {
    container.appendChild(section);
  }
}


// ─── Detail Chart ───

let _chartInstance = null;
let _chartJSLoaded = false;
let _chartJSLoading = false;

function _loadChartJS() {
  if (_chartJSLoaded) return Promise.resolve();
  if (_chartJSLoading) return _chartJSLoading;

  _chartJSLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = () => { _chartJSLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Chart.js'));
    document.head.appendChild(script);
  });
  return _chartJSLoading;
}

async function _renderDetailChart(asset, days = 30) {
  const container = document.getElementById('detail-chart');
  const loading = document.getElementById('detail-chart-loading');
  const canvas = document.getElementById('detail-chart-canvas');
  if (!container || !canvas) return;

  // Show loading
  if (loading) loading.classList.remove('hidden');

  // Update pill active state
  container.querySelectorAll('[data-chart-period]').forEach(p => {
    p.classList.toggle('active', p.dataset.chartPeriod == days);
  });

  try {
    // Lazy load Chart.js
    await _loadChartJS();

    // Fetch data
    const points = await fetchChartData(asset, days);

    if (loading) loading.classList.add('hidden');

    if (!points || points.length < 2) {
      canvas.style.display = 'none';
      if (loading) {
        const needsKey = ['stocks', 'indices', 'commodities', 'realestate'].includes(asset.assetClass) && !localStorage.getItem('innov8-bubbles-fmp-key');
        loading.textContent = needsKey ? 'Add FMP API key in Settings for stock charts' : 'No chart data available';
        loading.classList.remove('hidden');
      }
      return;
    }
    canvas.style.display = '';

    // Determine color based on price direction
    const firstPrice = points[0].price;
    const lastPrice = points[points.length - 1].price;
    const isUp = lastPrice >= firstPrice;
    const lineColor = isUp ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
    const fillColor = isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';

    // Format labels
    const labels = points.map(p => {
      const d = new Date(p.date);
      return days <= 7 ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit' })
        : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    });
    const data = points.map(p => p.price);

    // Destroy old chart
    if (_chartInstance) { _chartInstance.destroy(); _chartInstance = null; }

    const ctx = canvas.getContext('2d');
    _chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: lineColor,
          backgroundColor: fillColor,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: lineColor,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: '"DM Mono", monospace', size: 11 },
            bodyFont: { family: '"DM Mono", monospace', size: 12, weight: 'bold' },
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (ctx) => formatPrice(ctx.raw),
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { maxTicksLimit: 5, font: { family: '"DM Mono", monospace', size: 9 }, color: '#64748b' },
            border: { display: false },
          },
          y: {
            display: true,
            position: 'right',
            grid: { color: 'rgba(100, 116, 139, 0.1)' },
            ticks: {
              maxTicksLimit: 4,
              font: { family: '"DM Mono", monospace', size: 9 },
              color: '#64748b',
              callback: (v) => formatPrice(v),
            },
            border: { display: false },
          }
        }
      }
    });
  } catch (e) {
    console.warn('[chart] render error:', e.message);
    if (loading) { loading.textContent = 'Chart unavailable'; loading.classList.remove('hidden'); }
  }
}

function _wireDetailChartPills() {
  const container = document.getElementById('detail-chart-pills');
  if (!container) return;
  container.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-chart-period]');
    if (!pill || !state.selectedAsset) return;
    const days = pill.dataset.chartPeriod === 'max' ? 'max' : parseInt(pill.dataset.chartPeriod);
    _renderDetailChart(state.selectedAsset, days);
  });
}


function _closeDetail() {
  dom.detailPanel.classList.remove('open');
  setTimeout(() => dom.detailPanel.classList.add('hidden'), 300);
  dom.portfolioPopover.classList.add('hidden');
  state.selectedAsset = null;
  // Destroy chart to free memory
  if (_chartInstance) { _chartInstance.destroy(); _chartInstance = null; }
}

function _renderPopoverPortfolios() {
  const portfolios = Portfolio.getPortfolios();
  const assetId = state.selectedAsset?.id;

  dom.popoverPortfolioList.innerHTML = portfolios.map(p => {
    const inPortfolio = assetId && Portfolio.getAssetIds(p).includes(assetId);
    return `<button class="dropdown-item" data-popover-portfolio="${p.id}" style="${inPortfolio ? 'color:var(--green)' : ''}">
      ${inPortfolio ? '&#10003; ' : ''}${p.name}
    </button>`;
  }).join('');

  dom.popoverPortfolioList.onclick = (e) => {
    const item = e.target.closest('[data-popover-portfolio]');
    if (!item || !assetId) return;
    const pid = item.dataset.popoverPortfolio;
    const added = Portfolio.toggleAssetInPortfolio(pid, assetId);
    const pName = Portfolio.getPortfolios().find(p => p.id === pid)?.name;
    _toast(added ? `Added to "${pName}"` : `Removed from "${pName}"`, 'success');
    _renderPopoverPortfolios();
    _renderPortfolioDropdown();
    if (state.activePortfolioId) _applyFilters();
  };
}


// ─── Settings Modal ───

function _wireSettingsModal() {
  dom.settingsBtn.addEventListener('click', () => _openModal(dom.settingsModal));
  dom.settingsClose.addEventListener('click', () => _closeModal(dom.settingsModal));
  dom.apiPromptBtn.addEventListener('click', () => _openModal(dom.settingsModal));
  dom.mobileSettingsBtn?.addEventListener('click', () => {
    _closeMobileMenu();
    _openModal(dom.settingsModal);
  });

  dom.settingsSave.addEventListener('click', () => {
    const key = dom.fmpKeyInput.value.trim();
    if (key) {
      localStorage.setItem(STORAGE.FMP_KEY, key);
    } else {
      localStorage.removeItem(STORAGE.FMP_KEY);
    }

    // Save refresh interval
    const activeRefresh = dom.settingsModal.querySelector('[data-refresh].active');
    if (activeRefresh) {
      state.refreshInterval = activeRefresh.dataset.refresh === 'off' ? 0 : parseInt(activeRefresh.dataset.refresh);
    }
    _saveSettings();

    _closeModal(dom.settingsModal);
    _toast('Settings saved', 'success');
    _fetchAndRender();
  });

  // Load saved key
  dom.fmpKeyInput.value = localStorage.getItem(STORAGE.FMP_KEY) || '';
}

function _wireRefreshPills() {
  dom.settingsModal.querySelectorAll('[data-refresh]').forEach(pill => {
    pill.addEventListener('click', () => {
      dom.settingsModal.querySelectorAll('[data-refresh]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
    });
  });

  // Theme switcher
  const themeGrid = document.getElementById('theme-grid');
  if (themeGrid) {
    themeGrid.querySelectorAll('.theme-swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        themeGrid.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        _applyTheme(swatch.dataset.theme);
      });
    });
  }

  // Currency switcher
  const currencyPills = document.getElementById('currency-pills');
  if (currencyPills) {
    currencyPills.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        currencyPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currency = pill.dataset.currency;
        localStorage.setItem('innov8-bubbles-currency', pill.dataset.currency);
        _saveSettings();
        _fetchAndRender(); // re-fetch with new currency
      });
    });
  }

  // Color scheme switcher
  const colorPills = document.getElementById('color-scheme-pills');
  if (colorPills) {
    colorPills.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        colorPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.colorScheme = pill.dataset.colors;
        setColorScheme(pill.dataset.colors);
        _saveSettings();
        _applyFilters(); // re-render bubbles with new colors
      });
    });
  }
}

function _applyTheme(theme) {
  document.body.classList.remove('theme-dark', 'theme-slate', 'theme-light');
  if (theme && theme !== 'midnight') {
    document.body.classList.add('theme-' + theme);
  }
  state.theme = theme || 'midnight';
}


// ─── Portfolio Modal ───

function _wirePortfolioModal() {
  dom.portfolioModalClose.addEventListener('click', () => _closeModal(dom.portfolioModal));

  dom.createPortfolioBtn.addEventListener('click', () => {
    const name = dom.newPortfolioInput.value.trim();
    if (!name) return;
    Portfolio.createPortfolio(name);
    dom.newPortfolioInput.value = '';
    _renderPortfolioManager();
    _renderPortfolioDropdown();
    _toast(`Portfolio "${name}" created`, 'success');
  });

  dom.newPortfolioInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') dom.createPortfolioBtn.click();
  });
}

function _openPortfolioModal() {
  _renderPortfolioManager();
  _openModal(dom.portfolioModal);
}

function _renderPortfolioManager() {
  const portfolios = Portfolio.getPortfolios();
  dom.portfolioManagerList.innerHTML = portfolios.map(p => `
    <div class="portfolio-manager-item" data-pid="${p.id}">
      <span class="portfolio-name">${p.name}</span>
      <span class="portfolio-count">${Portfolio.getAssetIds(p).length} assets</span>
      <button class="btn btn-danger btn-sm" data-delete="${p.id}" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
      </button>
    </div>
  `).join('') || '<p style="color:var(--muted);font-family:var(--font-mono);font-size:0.85rem;text-align:center;padding:var(--space-lg)">No portfolios yet</p>';

  // Delete handlers
  dom.portfolioManagerList.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delete;
      Portfolio.deletePortfolio(id);
      if (state.activePortfolioId === id) {
        state.activePortfolioId = null;
        _applyFilters();
      }
      _renderPortfolioManager();
      _renderPortfolioDropdown();
      _toast('Portfolio deleted', 'success');
    });
  });
}


// ─── Mobile Menu ───

function _wireMobileMenu() {
  dom.hamburgerBtn.addEventListener('click', () => {
    dom.mobileMenu.classList.add('open');
  });
  dom.mobileMenuClose.addEventListener('click', _closeMobileMenu);
}

function _closeMobileMenu() {
  dom.mobileMenu.classList.remove('open');
}


// ─── Modal Helpers ───

function _openModal(modal) {
  modal.classList.remove('hidden');
}

function _closeModal(modal) {
  modal.classList.add('hidden');
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});


// ─── Resize ───

function _wireResize() {
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      engine.resize();
    }, 100);
  });
}


// ─── Auto Refresh ───

let _refreshBarTimer = null;
let _refreshBarStart = 0;

function _startAutoRefresh() {
  if (state.refreshTimer) clearInterval(state.refreshTimer);
  if (_refreshBarTimer) cancelAnimationFrame(_refreshBarTimer);

  if (state.refreshInterval > 0) {
    const intervalMs = state.refreshInterval * 1000;
    _refreshBarStart = Date.now();

    // Data refresh
    state.refreshTimer = setInterval(() => {
      _fetchAndRender(false);
      _refreshBarStart = Date.now(); // reset bar
    }, intervalMs);

    // Animate the progress bar with requestAnimationFrame
    function _tickBar() {
      const elapsed = Date.now() - _refreshBarStart;
      const pct = Math.min((elapsed / intervalMs) * 100, 100);
      dom.refreshBarFill.style.transition = 'none';
      dom.refreshBarFill.style.width = pct + '%';
      if (pct >= 100) {
        // Reset for next cycle
        dom.refreshBarFill.style.width = '0%';
        _refreshBarStart = Date.now();
      }
      _refreshBarTimer = requestAnimationFrame(_tickBar);
    }
    dom.refreshBarFill.style.width = '0%';
    _refreshBarTimer = requestAnimationFrame(_tickBar);
  } else {
    // Refresh off — hide bar
    dom.refreshBarFill.style.width = '0%';
  }
}


// ─── UI State Helpers ───

function _showLoading(show) {
  dom.loading.classList.toggle('hidden', !show);
}

function _hideStates() {
  dom.sampleBadge.classList.add('hidden');
  dom.emptyState.classList.add('hidden');
  dom.apiPrompt.classList.add('hidden');
}

function _showApiPrompt(show) {
  dom.apiPrompt.classList.toggle('hidden', !show);
}


// ─── Toast ───

function _toast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  dom.toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'all 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}


// ─── Settings Persistence ───

function _loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE.SETTINGS);
    if (raw) {
      const s = JSON.parse(raw);
      state.refreshInterval = s.refreshInterval || 60;

      if (s.theme) {
        state.theme = s.theme;
        _applyTheme(s.theme);
        const themeGrid = document.getElementById('theme-grid');
        if (themeGrid) {
          themeGrid.querySelectorAll('.theme-swatch').forEach(sw => {
            sw.classList.toggle('active', sw.dataset.theme === s.theme);
          });
        }
      }

      if (s.currency) {
        state.currency = s.currency;
        const currencyPills = document.getElementById('currency-pills');
        if (currencyPills) {
          currencyPills.querySelectorAll('.pill').forEach(p => {
            p.classList.toggle('active', p.dataset.currency === s.currency);
          });
        }
      }

      if (s.colorScheme) {
        state.colorScheme = s.colorScheme;
        setColorScheme(s.colorScheme);
        const colorPills = document.getElementById('color-scheme-pills');
        if (colorPills) {
          colorPills.querySelectorAll('.pill').forEach(p => {
            p.classList.toggle('active', p.dataset.colors === s.colorScheme);
          });
        }
      }
    }
  } catch (e) { /* ignore */ }
}

function _saveSettings() {
  localStorage.setItem(STORAGE.SETTINGS, JSON.stringify({
    refreshInterval: state.refreshInterval,
    theme: state.theme,
    currency: state.currency,
    colorScheme: state.colorScheme,
  }));
}


// ─── Property Sub-Filter ───

function _wirePropertyFilter() {
  dom.propertyFilterPills.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn || !btn.dataset.pf) return;
    state.propertyFilter = btn.dataset.pf;
    dom.propertyFilterPills.querySelectorAll('.pill').forEach(p =>
      p.classList.toggle('active', p.dataset.pf === state.propertyFilter)
    );
    _applyFilters();
  });
}

function _updatePropertyFilterVisibility() {
  const show = state.assetClass === 'assets' || state.assetClass === 'finance';
  dom.propertyFilterBar.classList.toggle('hidden', !show);
  document.body.classList.toggle('property-filter-active', show);

  // Reset to 'all' when leaving property tab
  if (!show && state.propertyFilter !== 'all') {
    state.propertyFilter = 'all';
    dom.propertyFilterPills.querySelectorAll('.pill').forEach(p =>
      p.classList.toggle('active', p.dataset.pf === 'all')
    );
  }
}

function _updatePropertyFilterCount() {
  if (state.assetClass !== 'assets' && state.assetClass !== 'finance') return;
  const total = state.allAssets.length;
  const custom = state.allAssets.filter(a => a._isCustom).length;
  const regional = total - custom;
  const shown = state.filteredAssets.length;

  let label = '';
  if (state.assetClass === 'finance') {
    // Finance tab has no regional data
    label = `${shown} financial asset${shown !== 1 ? 's' : ''}`;
  } else if (state.propertyFilter === 'all') {
    label = `${shown} assets (${custom} mine, ${regional} regional)`;
  } else if (state.propertyFilter === 'mine') {
    label = `${shown} of ${custom} custom assets`;
  } else {
    label = `${shown} of ${regional} regional averages`;
  }
  dom.propertyFilterCount.textContent = label;
}


// ─── Custom Asset Modal ───

let _editingCustomAssetId = null;
let _selectedCaType = 'property';

function _wireCustomAssetModal() {
  // Open modal from "+" buttons
  const openAdd = () => {
    _selectedCaType = state.assetClass === 'finance' ? 'pension' : 'property';
    _openCustomAssetForAdd();
  };
  if (dom.addCustomAssetBtn) dom.addCustomAssetBtn.addEventListener('click', openAdd);
  if (dom.mobileAddCustomAssetBtn) dom.mobileAddCustomAssetBtn.addEventListener('click', openAdd);

  // Close modal
  dom.customAssetClose.addEventListener('click', () => _closeModal(dom.customAssetModal));
  dom.caCancelBtn.addEventListener('click', () => _closeModal(dom.customAssetModal));

  // Type pill selection
  dom.caTypePills.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn || !btn.dataset.caType) return;
    dom.caTypePills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    _selectedCaType = btn.dataset.caType;
    _updateCaTypeFields();
  });

  // Pension projection — recalculate on any pension input change
  [dom.caPensionEmployee, dom.caPensionEmployer, dom.caPensionGrowth, dom.caPensionRetirementAge, dom.caCurrentValue, dom.caPurchaseDate].forEach(el => {
    el.addEventListener('input', () => {
      if (_selectedCaType === 'pension') _calcPensionProjection();
    });
  });

  // Auto-estimate button
  dom.caAutoValue.addEventListener('click', async () => {
    const postcode = dom.caPostcode.value.trim();
    if (!postcode) {
      dom.caValuationStatus.textContent = 'Please enter a postcode first';
      dom.caValuationStatus.className = 'form-help error';
      return;
    }
    dom.caValuationStatus.textContent = 'Fetching Land Registry data...';
    dom.caValuationStatus.className = 'form-help';
    dom.caAutoValue.disabled = true;

    try {
      const result = await CustomAssets.fetchLandRegistryValuation(postcode);
      if (result) {
        dom.caCurrentValue.value = result.estimatedValue;
        dom.caValuationStatus.textContent = `Estimated from ${result.transactionCount} recent transactions`;
        dom.caValuationStatus.className = 'form-help success';
      } else {
        dom.caValuationStatus.textContent = 'No data found for this postcode — enter value manually';
        dom.caValuationStatus.className = 'form-help error';
      }
    } catch (e) {
      dom.caValuationStatus.textContent = 'Auto-valuation unavailable — enter value manually';
      dom.caValuationStatus.className = 'form-help error';
    }
    dom.caAutoValue.disabled = false;
  });

  // Save button
  dom.caSaveBtn.addEventListener('click', () => {
    const name = dom.caName.value.trim();
    const currentValue = parseFloat(dom.caCurrentValue.value);

    if (!name) {
      _toast('Please enter an asset name', 'error');
      return;
    }
    if (!currentValue || currentValue <= 0) {
      _toast('Please enter a current value', 'error');
      return;
    }

    const asset = {
      id: _editingCustomAssetId || undefined,
      name,
      type: _selectedCaType,
      subtype: dom.caSubtype.value,
      location: _selectedCaType === 'pension' ? '' : dom.caLocation.value.trim(),
      postcode: dom.caPostcode.value.trim(),
      bedrooms: dom.caBedrooms.value ? parseInt(dom.caBedrooms.value) : null,
      purchasePrice: parseFloat(dom.caPurchasePrice.value) || 0,
      purchaseDate: dom.caPurchaseDate.value || '',
      currentValue,
      autoValuation: false,
      notes: dom.caNotes.value.trim(),
      // Pension-specific fields
      pensionProvider: _selectedCaType === 'pension' ? dom.caPensionProvider.value : '',
      pensionEmployeeContrib: _selectedCaType === 'pension' ? (parseFloat(dom.caPensionEmployee.value) || 0) : 0,
      pensionEmployerContrib: _selectedCaType === 'pension' ? (parseFloat(dom.caPensionEmployer.value) || 0) : 0,
      pensionGrowthRate: _selectedCaType === 'pension' ? (parseFloat(dom.caPensionGrowth.value) || 5) : 0,
      pensionRetirementAge: _selectedCaType === 'pension' ? (parseInt(dom.caPensionRetirementAge.value) || 67) : 0,
      savingsGrowthRate: _selectedCaType === 'savings' ? (parseFloat(dom.caSavingsGrowth.value) || 0) : 0,
    };

    CustomAssets.saveCustomAsset(asset);
    invalidateCache('assets'); invalidateCache('finance');
    _closeModal(dom.customAssetModal);
    _toast(_editingCustomAssetId ? 'Asset updated' : 'Asset added', 'success');
    _fetchAndRender(false);
  });

  // Delete button
  dom.caDeleteBtn.addEventListener('click', () => {
    if (!_editingCustomAssetId) return;
    if (!confirm('Delete this asset? This cannot be undone.')) return;

    CustomAssets.deleteCustomAsset(_editingCustomAssetId);
    invalidateCache('assets'); invalidateCache('finance');
    _closeModal(dom.customAssetModal);
    _toast('Asset deleted', 'success');
    _fetchAndRender(false);
  });

  // Portfolio button — add/remove from first portfolio (or create one)
  dom.caPortfolioBtn.addEventListener('click', () => {
    if (!_editingCustomAssetId) return;
    const portfolios = Portfolio.getPortfolios();
    if (portfolios.length === 0) {
      const p = Portfolio.createPortfolio('Favourites');
      Portfolio.addAsset(p.id, _editingCustomAssetId);
      _toast('Added to Favourites', 'success');
    } else {
      const added = Portfolio.toggleAssetInPortfolio(portfolios[0].id, _editingCustomAssetId);
      _toast(added ? 'Added to ' + portfolios[0].name : 'Removed from ' + portfolios[0].name, 'success');
    }
    _updateCaPortfolioBtn();
    _renderPortfolioDropdown();
  });
}

function _updateCaPortfolioBtn() {
  if (!_editingCustomAssetId) {
    dom.caPortfolioBtn.style.display = 'none';
    return;
  }
  dom.caPortfolioBtn.style.display = 'inline-flex';
  const portfolios = Portfolio.getPortfolios();
  const inAny = portfolios.some(p => Portfolio.getAssetIds(p).includes(_editingCustomAssetId));
  dom.caPortfolioBtn.classList.toggle('btn-portfolio-active', inAny);
  dom.caPortfolioBtn.title = inAny ? 'Remove from portfolio' : 'Add to portfolio';
}

function _updateCaTypeFields() {
  const isProperty = _selectedCaType === 'property';
  const isPension = _selectedCaType === 'pension';
  const isSavings = _selectedCaType === 'savings';
  const isFinanceType = isPension || isSavings;

  // Show/hide type-specific fields
  dom.caPropertyFields.classList.toggle('hidden', !isProperty);
  dom.caPensionFields.classList.toggle('hidden', !isPension);
  dom.caSavingsGrowthGroup.classList.toggle('hidden', !isSavings);
  dom.caLocationGroup.style.display = isFinanceType ? 'none' : '';

  // Relabel shared fields for finance context
  dom.caPurchasePriceLabel.textContent = isPension ? 'Total Contributed' : isSavings ? 'Total Deposited' : 'Purchase Price';
  dom.caCurrentValueLabel.textContent = isFinanceType ? 'Current Value' : 'Current Value';
  dom.caPurchaseDateLabel.textContent = isFinanceType ? 'Start Date' : 'Purchase Date';

  // Populate pension provider dropdown
  if (isPension && dom.caPensionProvider.options.length <= 1) {
    dom.caPensionProvider.innerHTML = PENSION_PROVIDERS.map(p =>
      `<option value="${p}">${p}</option>`
    ).join('');
  }

  // Update subtype dropdown
  const types = CUSTOM_ASSET_TYPES[_selectedCaType] || CUSTOM_ASSET_TYPES.other;
  dom.caSubtype.innerHTML = types.subtypes.map(s =>
    `<option value="${s}">${s}</option>`
  ).join('');

  // Clear projection when switching away from pension
  if (!isPension) dom.caPensionProjection.innerHTML = '';
}

function _calcPensionProjection() {
  const currentPot = parseFloat(dom.caCurrentValue.value) || 0;
  const monthlyEmployee = parseFloat(dom.caPensionEmployee.value) || 0;
  const monthlyEmployer = parseFloat(dom.caPensionEmployer.value) || 0;
  const growthRate = parseFloat(dom.caPensionGrowth.value) || 5;
  const retirementAge = parseInt(dom.caPensionRetirementAge.value) || 67;

  // Estimate current age from purchase date (pension start)
  const startDate = dom.caPurchaseDate.value;
  let yearsToRetirement = 30; // default
  if (startDate) {
    // Rough: assume they started at ~25-30, use years since start + remaining
    const startYear = new Date(startDate).getFullYear();
    const now = new Date().getFullYear();
    const yearsSinceStart = now - startYear;
    // Assume average start age 25
    const estCurrentAge = 25 + yearsSinceStart;
    yearsToRetirement = Math.max(1, retirementAge - estCurrentAge);
  }

  const monthlyTotal = monthlyEmployee + monthlyEmployer;
  const monthlyRate = growthRate / 100 / 12;
  const months = yearsToRetirement * 12;

  // Future value = currentPot * (1 + r)^n + monthly * [((1+r)^n - 1) / r]
  let projected;
  if (monthlyRate > 0) {
    projected = currentPot * Math.pow(1 + monthlyRate, months) +
      monthlyTotal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  } else {
    projected = currentPot + monthlyTotal * months;
  }

  const totalContributions = (parseFloat(dom.caPurchasePrice.value) || 0) + monthlyTotal * months;
  const sym = document.querySelector('[data-currency].active')?.textContent?.charAt(0) || '£';

  dom.caPensionProjection.innerHTML = `
    <div class="proj-row"><span class="proj-label">Projected pot at ${retirementAge}</span><span class="proj-value">${sym}${Math.round(projected).toLocaleString()}</span></div>
    <div class="proj-row"><span class="proj-label">Years to retirement</span><span>${yearsToRetirement}</span></div>
    <div class="proj-row"><span class="proj-label">Monthly total</span><span>${sym}${monthlyTotal.toLocaleString()}/mo</span></div>
    <div class="proj-row"><span class="proj-label">Growth assumption</span><span>${growthRate}% p.a.</span></div>
  `;
}

function _openCustomAssetForAdd() {
  _editingCustomAssetId = null;
  dom.customAssetTitle.textContent = 'Add Asset';
  dom.caDeleteBtn.style.display = 'none';
  dom.caPortfolioBtn.style.display = 'none';

  // Reset form
  dom.caName.value = '';
  dom.caSubtype.value = '';
  dom.caPostcode.value = '';
  dom.caBedrooms.value = '';
  dom.caPurchasePrice.value = '';
  dom.caCurrentValue.value = '';
  dom.caPurchaseDate.value = '';
  dom.caLocation.value = '';
  dom.caNotes.value = '';
  dom.caValuationStatus.textContent = '';
  // Reset pension fields
  dom.caPensionProvider.value = '';
  dom.caPensionEmployee.value = '';
  dom.caPensionEmployer.value = '';
  dom.caPensionGrowth.value = '5';
  dom.caPensionRetirementAge.value = '67';
  dom.caPensionProjection.innerHTML = '';
  dom.caSavingsGrowth.value = '';

  // Set type based on active tab
  _selectedCaType = state.assetClass === 'finance' ? 'pension' : 'property';
  dom.caTypePills.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.caType === _selectedCaType);
  });
  _updateCaTypeFields();

  _openModal(dom.customAssetModal);
}

function _openCustomAssetForEdit(assetId) {
  const asset = CustomAssets.getCustomAsset(assetId);
  if (!asset) return;

  _editingCustomAssetId = assetId;
  dom.customAssetTitle.textContent = 'Edit Asset';
  dom.caDeleteBtn.style.display = 'block';
  _updateCaPortfolioBtn();

  // Populate form
  dom.caName.value = asset.name || '';
  dom.caLocation.value = asset.location || '';
  dom.caPostcode.value = asset.postcode || '';
  dom.caBedrooms.value = asset.bedrooms || '';
  dom.caPurchasePrice.value = asset.purchasePrice || '';
  dom.caCurrentValue.value = asset.currentValue || '';
  dom.caPurchaseDate.value = asset.purchaseDate || '';
  dom.caNotes.value = asset.notes || '';
  dom.caValuationStatus.textContent = '';
  // Populate pension fields
  dom.caPensionProvider.value = asset.pensionProvider || '';
  dom.caPensionEmployee.value = asset.pensionEmployeeContrib || '';
  dom.caPensionEmployer.value = asset.pensionEmployerContrib || '';
  dom.caPensionGrowth.value = asset.pensionGrowthRate || '5';
  dom.caPensionRetirementAge.value = asset.pensionRetirementAge || '67';
  dom.caPensionProjection.innerHTML = '';
  dom.caSavingsGrowth.value = asset.savingsGrowthRate || '';

  // Set type pill
  _selectedCaType = asset.type || 'property';
  dom.caTypePills.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active', p.dataset.caType === _selectedCaType);
  });
  _updateCaTypeFields();

  // Set subtype after dropdown is populated
  dom.caSubtype.value = asset.subtype || '';

  // Run pension projection if editing a pension
  if (asset.type === 'pension') _calcPensionProjection();

  _openModal(dom.customAssetModal);
}


// ─── View Toggle (Bubble / Table) ───

function _wireViewToggle() {
  dom.viewBubbles.addEventListener('click', () => _setViewMode('bubble'));
  dom.viewTable.addEventListener('click', () => _setViewMode('table'));

  // Table header sort
  dom.assetTable.querySelector('thead').addEventListener('click', (e) => {
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const col = th.dataset.sort;
    if (state.sortBy === col) {
      state.sortDir = state.sortDir === 'desc' ? 'asc' : 'desc';
    } else {
      state.sortBy = col;
      state.sortDir = col === 'name' ? 'asc' : 'desc';
    }
    _renderTable();
  });
}

function _setViewMode(mode) {
  state.viewMode = mode;
  dom.viewBubbles.classList.toggle('active', mode === 'bubble');
  dom.viewTable.classList.toggle('active', mode === 'table');

  // Show/hide views
  dom.canvas.style.display = mode === 'bubble' ? 'block' : 'none';
  document.querySelector('.hero-glow').style.display = mode === 'bubble' ? 'block' : 'none';
  dom.tableView.classList.toggle('hidden', mode !== 'table');

  // Render
  if (mode === 'table') {
    _renderTable();
  } else {
    engine.resize();
    engine.setBubbles(state.filteredAssets, state.period);
  }
}

function _renderTable() {
  const assets = _getSortedAssets();
  const activePeriod = state.period; // e.g. '1h', '24h', '7d', '30d', '1y'

  // Map period key to the data field name
  const periodToField = { '1h': 'change1h', '24h': 'change24h', '7d': 'change7d', '30d': 'change30d', '1y': 'change1y' };
  const activeField = periodToField[activePeriod] || 'change24h';

  // Update sort indicators and active period highlight in header
  dom.assetTable.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sorted', 'asc', 'desc', 'col-active');
    if (th.dataset.sort === state.sortBy) {
      th.classList.add('sorted', state.sortDir);
    }
    if (th.dataset.sort === activeField) {
      th.classList.add('col-active');
    }
  });

  // Toggle holdings columns visibility
  dom.assetTable.classList.toggle('portfolio-active', !!state.activePortfolioId);

  // Helper: format change with arrow
  const fmtChange = (val, field) => {
    if (val == null || isNaN(val)) return '<span class="table-change table-change-neutral">—</span>';
    const cls = val >= 0 ? 'table-change-pos' : 'table-change-neg';
    const arrow = val >= 0 ? '&#9650;' : '&#9660;';
    const pct = Math.abs(val).toFixed(2);
    return `<span class="table-change ${cls}"><span class="table-arrow">${arrow}</span>${pct}%</span>`;
  };

  // Check which assets are in the active portfolio (for star)
  const activePortfolio = Portfolio.getActivePortfolio();
  const starredIds = new Set(activePortfolio ? Portfolio.getAssetIds(activePortfolio) : []);

  // Helper: mark the active period column cell
  const activeClass = (field) => field === activeField ? 'col-active-cell' : '';

  dom.assetTableBody.innerHTML = assets.map((a, i) => {
    const logo = getLogoUrl(a);
    const starred = starredIds.has(a.id);

    return `<tr data-asset-id="${a.id}">
      <td class="table-star ${starred ? 'active' : ''}" data-star="${a.id}">&#9734;</td>
      <td class="col-rank">${i + 1}</td>
      <td class="col-name">
        <div class="table-name-cell">
          ${logo ? `<img class="table-logo" src="${logo}" alt="" loading="lazy" onerror="this.style.display='none'">` : '<div class="table-logo"></div>'}
          <div class="table-name-text">
            <span class="table-fullname">${a.name}${a._isCustom ? '<span class="ca-badge">MY</span>' : ''}</span>
            <span class="table-symbol">${a._isCustom ? (a._typeIcon || '') + ' ' + a.symbol : a.symbol}</span>
          </div>
        </div>
      </td>
      <td class="table-price">${formatPrice(a.price)}</td>
      <td class="col-holdings">${a._holdingsQty ? a._holdingsQty.toLocaleString('en-US', {maximumFractionDigits: 4}) : '—'}</td>
      <td class="col-holdings">${a._holdingsValue ? formatPrice(a._holdingsValue) : '—'}</td>
      <td class="col-holdings col-holdings-pl ${(a._holdingsPL || 0) >= 0 ? 'table-change-pos' : 'table-change-neg'}">${a._holdingsPL != null && a._holdingsQty ? (a._holdingsPL >= 0 ? '+' : '') + formatPrice(a._holdingsPL) : '—'}</td>
      <td class="${activeClass('change1h')}">${fmtChange(a.change1h, 'change1h')}</td>
      <td class="${activeClass('change24h')}">${fmtChange(a.change24h, 'change24h')}</td>
      <td class="${activeClass('change7d')}">${fmtChange(a.change7d, 'change7d')}</td>
      <td class="col-hide-mobile ${activeClass('change30d')}">${fmtChange(a.change30d, 'change30d')}</td>
      <td class="col-hide-mobile ${activeClass('change1y')}">${fmtChange(a.change1y, 'change1y')}</td>
      <td class="table-mcap">${formatLargeNumber(a.marketCap)}</td>
      <td class="table-volume col-hide-mobile">${formatLargeNumber(a.volume24h)}</td>
    </tr>`;
  }).join('');

  // Star click → show holdings form or remove
  dom.assetTableBody.querySelectorAll('.table-star').forEach(star => {
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      const assetId = star.dataset.star;
      const asset = state.filteredAssets.find(a => a.id === assetId);
      const portfolios = Portfolio.getPortfolios();

      // If already in first portfolio, remove
      if (portfolios.length > 0 && Portfolio.isAssetInPortfolio(portfolios[0].id, assetId)) {
        Portfolio.removeAssetCompletely(portfolios[0].id, assetId);
        _toast('Removed from ' + portfolios[0].name, 'success');
        _renderPortfolioDropdown();
        _renderTable();
        return;
      }

      // Otherwise show holdings form
      _showHoldingsForm(assetId, asset, star);
    });
  });

  // Row click → detail panel
  dom.assetTableBody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', () => {
      const asset = state.filteredAssets.find(a => a.id === row.dataset.assetId);
      if (asset) _showDetail(asset);
    });
  });
}

function _getSortedAssets() {
  const assets = [...state.filteredAssets];
  const { sortDir } = state;
  let sortBy = state.sortBy;
  const dir = sortDir === 'asc' ? 1 : -1;

  // Map holdings sort keys to enriched properties
  const holdingsMap = { holdingsQty: '_holdingsQty', holdingsValue: '_holdingsValue', holdingsPL: '_holdingsPL' };
  if (holdingsMap[sortBy]) sortBy = holdingsMap[sortBy];

  assets.sort((a, b) => {
    let va = a[sortBy];
    let vb = b[sortBy];

    // Handle nulls
    if (va == null) va = sortDir === 'asc' ? Infinity : -Infinity;
    if (vb == null) vb = sortDir === 'asc' ? Infinity : -Infinity;

    // String comparison for name
    if (sortBy === 'name') {
      return dir * String(va).localeCompare(String(vb));
    }

    return dir * (va - vb);
  });

  return assets;
}


// ─── Footer Stats ───

// ─── Holdings Form Popover ───

function _wireHoldingsForm() {
  const form = $('#holdings-form-popover');
  if (!form) return;

  $('#holdings-form-close').addEventListener('click', () => _hideHoldingsForm());
  $('#holdings-form-save').addEventListener('click', () => _submitHoldingsForm(false));
  $('#holdings-form-track').addEventListener('click', () => _submitHoldingsForm(true));

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!form.classList.contains('hidden') && !form.contains(e.target) && !e.target.closest('.table-star') && !e.target.closest('#add-to-portfolio-btn')) {
      _hideHoldingsForm();
    }
  });
}

let _holdingsFormAssetId = null;

function _showHoldingsForm(assetId, asset, anchor) {
  const form = $('#holdings-form-popover');
  if (!form) return;

  _holdingsFormAssetId = assetId;

  // Set asset display
  const assetEl = $('#holdings-form-asset');
  if (assetEl) assetEl.textContent = asset ? `${asset.symbol} — ${asset.name}` : assetId;

  // Populate portfolio dropdown
  const select = $('#holdings-form-portfolio');
  let portfolios = Portfolio.getPortfolios();
  if (portfolios.length === 0) {
    // Auto-create
    Portfolio.createPortfolio('Favourites');
    portfolios = Portfolio.getPortfolios();
  }
  select.innerHTML = portfolios.map(p =>
    `<option value="${p.id}">${p.name}</option>`
  ).join('');

  // Pre-fill fields
  $('#holdings-qty').value = '';
  $('#holdings-price').value = asset ? asset.price : '';
  $('#holdings-date').value = new Date().toISOString().split('T')[0];

  // Position the form near the anchor
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    const formW = 300;
    let left = rect.right + 8;
    let top = rect.top - 40;
    // Keep on screen
    if (left + formW > window.innerWidth - 16) left = rect.left - formW - 8;
    if (top < 80) top = 80;
    if (top + 320 > window.innerHeight) top = window.innerHeight - 340;
    // On mobile, let CSS handle as bottom sheet
    if (window.innerWidth < 768) {
      form.style.left = '';
      form.style.right = '';
      form.style.top = '';
    } else {
      form.style.left = left + 'px';
      form.style.top = top + 'px';
    }
  }

  form.classList.remove('hidden');
  $('#holdings-qty').focus();
}

function _hideHoldingsForm() {
  const form = $('#holdings-form-popover');
  if (form) form.classList.add('hidden');
  _holdingsFormAssetId = null;
}

function _submitHoldingsForm(justTrack) {
  if (!_holdingsFormAssetId) return;

  const portfolioId = $('#holdings-form-portfolio').value;
  if (!portfolioId) return;

  const qty = justTrack ? 0 : (parseFloat($('#holdings-qty').value) || 0);
  const price = justTrack ? 0 : (parseFloat($('#holdings-price').value) || 0);
  const date = justTrack ? '' : ($('#holdings-date').value || '');

  Portfolio.addHolding(portfolioId, {
    assetId: _holdingsFormAssetId,
    quantity: qty,
    purchasePrice: price,
    purchaseDate: date,
  });

  const pName = Portfolio.getPortfolios().find(p => p.id === portfolioId)?.name || 'Portfolio';
  _toast(justTrack ? `Tracking in ${pName}` : `Added holding to ${pName}`, 'success');

  _hideHoldingsForm();
  _renderPortfolioDropdown();
  if (state.viewMode === 'table') _renderTable();
}


// ─── Net Worth FAB + Panel ───

function _wireNetWorthPanel() {
  const fab = $('#networth-fab');
  const panel = $('#networth-panel');
  const closeBtn = $('#networth-close');
  if (!fab || !panel) return;

  fab.addEventListener('click', () => {
    const isOpen = !panel.classList.contains('hidden');
    if (isOpen) {
      panel.classList.add('hidden');
    } else {
      _updateNetWorthPanel();
      panel.classList.remove('hidden');
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
  }

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('hidden') && !panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) {
      panel.classList.add('hidden');
    }
  });
}

function _updateNetWorthPanel() {
  const sym = document.querySelector('[data-currency].active')?.textContent?.charAt(0) || '£';
  const fmtVal = (v) => sym + Math.abs(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });

  let grandTotal = 0;
  let grandCost = 0;
  const rows = [];

  // ── 1. Portfolio holdings (crypto, stocks, indices etc at live prices) ──
  const portfolios = Portfolio.getPortfolios();
  // Build price map from all loaded assets
  const priceMap = {};
  const nameMap = {};
  (state.allAssets || []).forEach(a => { priceMap[a.id] = a.price; nameMap[a.id] = a.symbol || a.name; });
  // Also include custom assets prices
  CustomAssets.getCustomAssetsNormalized().forEach(a => { priceMap[a.id] = a.price; nameMap[a.id] = a.symbol || a.name; });

  for (const p of portfolios) {
    const summary = Portfolio.getPortfolioSummary(p, priceMap);
    if (summary.totalValue > 0 || summary.totalCost > 0) {
      grandTotal += summary.totalValue;
      grandCost += summary.totalCost;
      const isPos = summary.totalPL >= 0;
      rows.push(`<div class="nw-row">
        <div class="nw-row-label"><span class="nw-row-icon">📊</span> ${p.name} (${summary.assetSummaries.length})</div>
        <div class="nw-row-value">${fmtVal(summary.totalValue)}<span class="nw-row-change ${isPos ? 'pos' : 'neg'}">${isPos ? '+' : '-'}${Math.abs(summary.totalPLPercent).toFixed(1)}%</span></div>
      </div>`);
    }
  }

  // ── 2. Custom assets (property, pensions, savings, vehicles etc) ──
  const customAssets = CustomAssets.loadCustomAssets();
  const typeMap = {};
  // Track custom asset IDs already in portfolios to avoid double-counting
  const portfolioAssetIds = new Set();
  for (const p of portfolios) {
    for (const h of (p.holdings || [])) portfolioAssetIds.add(h.assetId);
  }

  for (const a of customAssets) {
    // Skip if this custom asset is already counted via portfolio holdings
    if (portfolioAssetIds.has(a.id)) continue;

    const val = a.currentValue || 0;
    const purchase = a.purchasePrice || 0;
    grandTotal += val;
    grandCost += purchase;

    const typeInfo = CUSTOM_ASSET_TYPES[a.type] || CUSTOM_ASSET_TYPES.other;
    const key = a.type || 'other';
    if (!typeMap[key]) {
      typeMap[key] = { label: typeInfo.label, icon: typeInfo.icon, value: 0, purchase: 0, count: 0 };
    }
    typeMap[key].value += val;
    typeMap[key].purchase += purchase;
    typeMap[key].count++;
  }

  // Add custom asset type rows
  for (const [key, t] of Object.entries(typeMap).sort((a, b) => b[1].value - a[1].value)) {
    const gain = t.value - t.purchase;
    const gainPct = t.purchase > 0 ? ((gain / t.purchase) * 100).toFixed(1) : '0.0';
    const isPos = gain >= 0;
    rows.push(`<div class="nw-row">
      <div class="nw-row-label"><span class="nw-row-icon">${t.icon}</span> ${t.label} (${t.count})</div>
      <div class="nw-row-value">${fmtVal(t.value)}<span class="nw-row-change ${isPos ? 'pos' : 'neg'}">${isPos ? '+' : '-'}${Math.abs(parseFloat(gainPct)).toFixed(1)}%</span></div>
    </div>`);
  }

  // ── Render ──
  const totalEl = $('#networth-total');
  const changeEl = $('#networth-change');
  const breakdownEl = $('#networth-breakdown');

  if (totalEl) totalEl.textContent = fmtVal(grandTotal);

  if (changeEl) {
    const gain = grandTotal - grandCost;
    const gainPct = grandCost > 0 ? ((gain / grandCost) * 100).toFixed(1) : '0.0';
    const isPos = gain >= 0;
    changeEl.innerHTML = `<span style="color:var(--${isPos ? 'green' : 'red'})">${isPos ? '+' : '-'}${fmtVal(Math.abs(gain))} (${isPos ? '+' : ''}${gainPct}%)</span> total gain/loss`;
  }

  if (breakdownEl) {
    if (rows.length === 0) {
      breakdownEl.innerHTML = '<p style="text-align:center;color:var(--muted);font-size:0.75rem;padding:16px 0">No holdings or assets yet.<br>Star assets + add holdings, or use Assets/Finance tabs.</p>';
    } else {
      breakdownEl.innerHTML = rows.join('');
    }
  }
}


function _updateFooterStats() {
  const assets = state.allAssets;
  if (!assets.length) return;

  const count = assets.length;
  const totalMcap = assets.reduce((sum, a) => sum + (a.marketCap || 0), 0);
  const totalVolume = assets.reduce((sum, a) => sum + (a.volume24h || 0), 0);

  // BTC dominance
  const btc = assets.find(a => a.symbol === 'BTC' || a.id === 'bitcoin');
  const btcDom = btc && totalMcap > 0 ? ((btc.marketCap / totalMcap) * 100).toFixed(1) + '%' : '—';

  const $count = document.getElementById('stats-count');
  const $mcap = document.getElementById('stats-mcap');
  const $volume = document.getElementById('stats-volume');
  const $btcDom = document.getElementById('stats-btc-dom');

  if ($count) $count.textContent = count;
  if ($mcap) $mcap.textContent = formatLargeNumber(totalMcap);
  if ($volume) $volume.textContent = formatLargeNumber(totalVolume);
  if ($btcDom) $btcDom.textContent = btcDom;
}


// ─── Share Button ───

function _wireShareButton() {
  const btn = document.getElementById('share-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const url = window.location.href;
    const title = 'Innov8 Bubbles — ' + (state.assetClass === 'all' ? 'All Assets' : state.assetClass);

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e) { /* user cancelled */ }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        _toast('Link copied to clipboard', 'success');
      } catch (e) {
        _toast('Could not copy link', 'error');
      }
    }
  });
}


// ─── Keyboard Shortcuts ───

function _wireKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    // Ignore if modal is open
    if (document.querySelector('.modal-overlay:not(.hidden)')) return;

    switch (e.key) {
      case '1': _switchAssetClass('all'); break;
      case '2': _switchAssetClass('crypto'); break;
      case '3': _switchAssetClass('indices'); break;
      case '4': _switchAssetClass('stocks'); break;
      case '5': _switchAssetClass('commodities'); break;
      case '6': _switchAssetClass('realestate'); break;
      case 'b': case 'B': _setViewMode('bubble'); break;
      case 't': case 'T': _setViewMode('table'); break;
      case '/': e.preventDefault(); dom.searchInput.focus(); break;
      case 'Escape': _closeDetail(); break;
    }
  });
}

function _switchAssetClass(cls) {
  state.assetClass = cls;
  _syncPills('class', cls);
  _closeDetail();
  _fetchAndRender();
}


// ─── Security: Input Sanitisation ───

function _sanitize(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


// ─── Performance: Background Throttle ───

function _wireVisibilityThrottle() {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Slow down to ~10fps when tab is hidden
      if (engine) engine.stop();
    } else {
      // Resume full speed
      if (engine) engine.start();
    }
  });
}


// ─── Auth Modal ───

function _wireAuthModal() {
  dom.signinBtn.addEventListener('click', () => {
    _showAuthTab('signin');
    _openModal(dom.authModal);
  });

  dom.authClose.addEventListener('click', () => _closeModal(dom.authModal));

  // Tab switching
  dom.authModal.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _showAuthTab(tab.dataset.authTab);
    });
  });

  // Google sign-in
  dom.googleSigninBtn.addEventListener('click', async () => {
    try {
      _hideAuthError();
      await signInWithGoogle();
      _closeModal(dom.authModal);
      _toast('Signed in with Google', 'success');
    } catch (e) {
      _showAuthError(e.message);
    }
  });

  // Email sign-in
  dom.signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#signin-email').value.trim();
    const pass = $('#signin-password').value;
    try {
      _hideAuthError();
      await signInWithEmail(email, pass);
      _closeModal(dom.authModal);
      _toast('Signed in successfully', 'success');
    } catch (e) {
      _showAuthError(_friendlyAuthError(e.code));
    }
  });

  // Email sign-up
  dom.signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('#signup-name').value.trim();
    const email = $('#signup-email').value.trim();
    const pass = $('#signup-password').value;
    const confirm = $('#signup-confirm').value;

    if (pass !== confirm) {
      _showAuthError('Passwords do not match');
      return;
    }

    try {
      _hideAuthError();
      await signUpWithEmail(email, pass, name);
      _closeModal(dom.authModal);
      _toast('Account created!', 'success');
    } catch (e) {
      _showAuthError(_friendlyAuthError(e.code));
    }
  });
}

function _showAuthTab(tab) {
  dom.authModal.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.authTab === tab));
  dom.signinForm.classList.toggle('hidden', tab !== 'signin');
  dom.signupForm.classList.toggle('hidden', tab !== 'signup');
  dom.authModalTitle.textContent = tab === 'signin' ? 'Sign In' : 'Sign Up';
  _hideAuthError();
}

function _showAuthError(msg) {
  dom.authError.textContent = msg;
  dom.authError.classList.remove('hidden');
}

function _hideAuthError() {
  dom.authError.classList.add('hidden');
}

function _friendlyAuthError(code) {
  const map = {
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/invalid-email': 'Invalid email address',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
  };
  return map[code] || 'Authentication failed. Please try again.';
}


// ─── User Menu ───

function _wireUserMenu() {
  dom.userAvatarBtn.addEventListener('click', () => {
    dom.userMenu.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!dom.userMenu.contains(e.target)) {
      dom.userMenu.classList.remove('open');
    }
  });

  dom.userManagePortfolios.addEventListener('click', () => {
    dom.userMenu.classList.remove('open');
    _openPortfolioModal();
  });

  dom.userPlaceAd.addEventListener('click', () => {
    dom.userMenu.classList.remove('open');
    if (!isSignedIn()) {
      _toast('Please sign in to place an ad', 'error');
      _openModal(dom.authModal);
      return;
    }
    _openAdModal();
  });

  dom.userSignout.addEventListener('click', async () => {
    dom.userMenu.classList.remove('open');
    try {
      await firebaseSignOut();
      Portfolio.setLocalMode();
      _toast('Signed out', 'success');
    } catch (e) {
      _toast('Sign out failed', 'error');
    }
  });
}

function _handleAuthStateChange(user) {
  if (user) {
    // Signed in
    dom.signinBtn.classList.add('hidden');
    dom.userMenu.classList.remove('hidden');
    dom.userAvatar.textContent = getUserInitial();
    dom.userMenuName.textContent = user.displayName || '';
    dom.userMenuEmail.textContent = user.email || '';

    // Sync portfolios to cloud
    const localPortfolios = Portfolio.getPortfolios();
    syncLocalPortfoliosToCloud(localPortfolios).then(() => {
      return loadPortfoliosFromCloud();
    }).then(cloudPortfolios => {
      if (cloudPortfolios) {
        Portfolio.setCloudMode(user.uid, cloudPortfolios);
        state.activePortfolioId = Portfolio.getActivePortfolioId();
        _renderPortfolioDropdown();
        _applyFilters();
      }
    }).catch(e => {
      console.warn('[app] Portfolio cloud sync failed:', e.message);
    });

    // Sync custom assets to cloud
    const localCustomAssets = CustomAssets.loadCustomAssets();
    syncLocalCustomAssetsToCloud(localCustomAssets).then(() => {
      return loadCustomAssetsFromCloud();
    }).then(cloudCustomAssets => {
      if (cloudCustomAssets) {
        CustomAssets.setCloudMode(user.uid, cloudCustomAssets);
        invalidateCache('assets'); invalidateCache('finance');
        _fetchAndRender(false);
      }
    }).catch(e => {
      console.warn('[app] Custom assets cloud sync failed:', e.message);
    });
  } else {
    // Signed out
    dom.signinBtn.classList.remove('hidden');
    dom.userMenu.classList.add('hidden');
    dom.userMenu.classList.remove('open');
    Portfolio.setLocalMode();
    CustomAssets.setLocalMode();
    _renderPortfolioDropdown();
  }
}


// ─── Ad Placement Modal ───

let _adState = { step: 1, durationIndex: 0 };

function _wireAdModal() {
  dom.adClose.addEventListener('click', () => _closeModal(dom.adModal));

  // Step 1 → 2
  $('#ad-next-1').addEventListener('click', () => {
    if (!dom.adName.value.trim() || !dom.adText.value.trim()) {
      _toast('Please fill in the ad name and description', 'error');
      return;
    }
    _adGoToStep(2);
  });

  // Step 2 → 3
  $('#ad-next-2').addEventListener('click', () => _adGoToStep(3));
  $('#ad-back-2').addEventListener('click', () => _adGoToStep(1));
  $('#ad-back-3').addEventListener('click', () => _adGoToStep(2));

  // Pay button
  dom.adPayBtn.addEventListener('click', async () => {
    dom.adPayBtn.disabled = true;
    dom.adPayBtn.textContent = 'Uploading...';
    try {
      // Upload logo first if provided
      let logoUrl = null;
      if (_adState.logoFile) {
        logoUrl = await uploadAdLogo(_adState.logoFile);
      }
      const adData = _getAdFormData();
      adData.logoUrl = logoUrl;
      dom.adPayBtn.textContent = 'Redirecting to payment...';
      await submitAndPay(adData, _adState.durationIndex);
      _closeModal(dom.adModal);
      _toast('Ad submitted successfully!', 'success');
      _initTicker();
    } catch (e) {
      _toast(e.message || 'Payment failed', 'error');
    } finally {
      dom.adPayBtn.disabled = false;
      dom.adPayBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Pay & Submit';
    }
  });
}

function _openAdModal() {
  _adState.step = 1;
  _adState.durationIndex = 0;
  _adState.logoFile = null;
  _adState.logoUrl = null;

  // Reset form
  dom.adBadgeSelect.value = 'new-drop';
  dom.adName.value = '';
  dom.adText.value = '';
  dom.adUrl.value = '';

  // Reset logo upload
  const logoPreview = document.getElementById('ad-logo-preview');
  const logoInput = document.getElementById('ad-logo-input');
  logoPreview.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="24" height="24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg><span>Click to upload</span>';
  logoPreview.classList.remove('has-image');
  logoInput.value = '';

  // Wire logo upload click
  document.getElementById('ad-logo-upload').onclick = () => logoInput.click();
  logoInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) { _toast('Logo must be under 200KB', 'error'); return; }
    _adState.logoFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      logoPreview.innerHTML = `<img src="${ev.target.result}" alt="Logo preview">`;
      logoPreview.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  };

  // Render duration cards
  dom.adDurationGrid.innerHTML = STRIPE_CONFIG.prices.map((p, i) =>
    `<div class="ad-duration-card ${i === 0 ? 'selected' : ''}" data-duration="${i}">
      <span class="duration-days">${p.label}</span>
      <span class="duration-price">${p.price}</span>
    </div>`
  ).join('');

  // Duration card click
  dom.adDurationGrid.querySelectorAll('.ad-duration-card').forEach(card => {
    card.addEventListener('click', () => {
      dom.adDurationGrid.querySelectorAll('.ad-duration-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      _adState.durationIndex = parseInt(card.dataset.duration);
    });
  });

  _adGoToStep(1);
  _openModal(dom.adModal);
}

function _adGoToStep(step) {
  _adState.step = step;

  // Update step indicators
  dom.adModal.querySelectorAll('.ad-step').forEach(s => {
    const sn = parseInt(s.dataset.step);
    s.classList.toggle('active', sn === step);
    s.classList.toggle('done', sn < step);
  });

  // Show/hide step content
  for (let i = 1; i <= 3; i++) {
    const el = $(`#ad-step-${i}`);
    if (el) el.classList.toggle('hidden', i !== step);
  }

  // Step 3: render preview
  if (step === 3) {
    const adData = _getAdFormData();
    dom.adPreviewStrip.innerHTML = generateAdPreviewHTML(adData);
    const dur = STRIPE_CONFIG.prices[_adState.durationIndex];
    dom.adSummary.innerHTML = `<strong>${dur.label}</strong> — ${dur.price} — Your ad will run for ${dur.days} days`;
  }
}

function _getAdFormData() {
  const badgeValue = dom.adBadgeSelect.value;
  const badge = AD_BADGE_TYPES.find(b => b.value === badgeValue) || AD_BADGE_TYPES[0];
  return {
    badge: badge.value,
    badgeText: badge.badgeText,
    name: dom.adName.value.trim(),
    text: dom.adText.value.trim(),
    url: dom.adUrl.value.trim() || '#',
  };
}
