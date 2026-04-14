/* ============================================================
   ads.js — Ad placement + Sponsored bubbles + Stripe Checkout
   ============================================================ */

import { STRIPE_CONFIG, AD_BADGE_TYPES, SPONSORED_PRICES } from './config.js';
import { submitAdToFirestore, markAdAsPaid, submitSponsoredToFirestore, markSponsoredAsPaid, isSignedIn } from './auth.js';

let _stripe = null;

// ─── Init ───

export function initStripe() {
  if (typeof Stripe === 'undefined') {
    console.warn('[ads] Stripe SDK not loaded');
    return false;
  }
  try {
    _stripe = Stripe(STRIPE_CONFIG.publishableKey);
    return true;
  } catch (e) {
    console.error('[ads] Stripe init failed:', e.message);
    return false;
  }
}

// ─── Ticker Ad Submission Flow ───

export async function submitAndPay(adData, durationIndex) {
  if (!isSignedIn()) throw new Error('You must be signed in to place an ad');

  const duration = STRIPE_CONFIG.prices[durationIndex];
  if (!duration) throw new Error('Invalid duration selected');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + duration.days);

  const adId = await submitAdToFirestore({
    badge: adData.badge,
    badgeText: adData.badgeText,
    name: adData.name,
    text: adData.text,
    url: adData.url,
    logoUrl: adData.logoUrl || null,
    duration: duration.days,
    priceLabel: duration.price,
    expiresAt: expiresAt.toISOString(),
  });

  if (duration.paymentLink && duration.paymentLink !== '#') {
    localStorage.setItem('innov8-bubbles-pending-ad', adId);
    window.location.href = duration.paymentLink;
  } else {
    throw new Error('Payment system unavailable. Please try again later.');
  }

  return adId;
}

// ─── Sponsored Bubble Submission Flow ───

export async function submitAndPaySponsored(sponsoredData, durationIndex) {
  if (!isSignedIn()) throw new Error('You must be signed in to promote a launch');

  const duration = SPONSORED_PRICES[durationIndex];
  if (!duration) throw new Error('Invalid duration selected');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + duration.days);

  const id = await submitSponsoredToFirestore({
    name: sponsoredData.name,
    symbol: sponsoredData.symbol,
    description: sponsoredData.description,
    url: sponsoredData.url,
    logoUrl: sponsoredData.logoUrl || null,
    badge: sponsoredData.badge,
    badgeText: sponsoredData.badgeText,
    price: sponsoredData.price || 0,
    change24h: sponsoredData.change24h || 0,
    duration: duration.days,
    priceLabel: duration.price,
    expiresAt: expiresAt.toISOString(),
  });

  if (duration.paymentLink && duration.paymentLink !== '#') {
    localStorage.setItem('innov8-bubbles-pending-sponsored', id);
    window.location.href = duration.paymentLink;
  } else {
    // Placeholder: auto-approve for testing until Stripe links are set up
    await markSponsoredAsPaid(id);
    return id;
  }

  return id;
}

// ─── Check for payment success on page load ───

export async function checkPaymentReturn() {
  const params = new URLSearchParams(window.location.search);

  // Check ticker ad payment
  if (params.get('ad_paid')) {
    const pendingAdId = localStorage.getItem('innov8-bubbles-pending-ad');
    if (pendingAdId) {
      try {
        await markAdAsPaid(pendingAdId);
        localStorage.removeItem('innov8-bubbles-pending-ad');
      } catch (e) {
        console.warn('[ads] Could not mark ad as paid:', e.message);
      }
    }
    window.history.replaceState({}, '', window.location.pathname);
    return pendingAdId;
  }

  // Check sponsored bubble payment
  if (params.get('sponsored_paid')) {
    const pendingId = localStorage.getItem('innov8-bubbles-pending-sponsored');
    if (pendingId) {
      try {
        await markSponsoredAsPaid(pendingId);
        localStorage.removeItem('innov8-bubbles-pending-sponsored');
      } catch (e) {
        console.warn('[ads] Could not mark sponsored as paid:', e.message);
      }
    }
    window.history.replaceState({}, '', window.location.pathname);
    return pendingId;
  }

  return null;
}

// ─── Ad Preview ───

export function generateAdPreviewHTML(adData) {
  const badge = AD_BADGE_TYPES.find(b => b.value === adData.badge) || AD_BADGE_TYPES[0];
  const logoHtml = adData.logoUrl ? `<img class="ticker-ad-logo" src="${adData.logoUrl}" alt="">` : '';
  return `<a class="ticker-item" href="${adData.url || '#'}" target="_blank" rel="noopener">
    <span class="ticker-badge ${badge.value}">${badge.badgeText}</span>
    ${logoHtml}
    <span class="ticker-name">${adData.name || '$TOKEN'}</span>
    <span>${adData.text || 'Your ad description here'}</span>
  </a>`;
}

// ─── Sponsored Strip Preview ───

export function generateSponsoredItemHTML(data) {
  const badge = AD_BADGE_TYPES.find(b => b.value === data.badge) || AD_BADGE_TYPES[0];
  const logoHtml = data.logoUrl ? `<img class="sponsored-logo" src="${data.logoUrl}" alt="">` : `<span class="sponsored-logo-placeholder">${(data.symbol || '?')[0]}</span>`;
  const changeClass = (data.change24h || 0) >= 0 ? 'sponsored-change-pos' : 'sponsored-change-neg';
  const changeText = data.change24h != null ? ((data.change24h >= 0 ? '+' : '') + Number(data.change24h).toFixed(1) + '%') : '';

  return `<a class="sponsored-item" href="${data.url || '#'}" target="_blank" rel="noopener">
    ${logoHtml}
    <span class="sponsored-badge ${badge.value}">${badge.badgeText}</span>
    <span class="sponsored-name">${data.symbol || data.name || '$TOKEN'}</span>
    <span class="sponsored-desc">${data.name || ''}</span>
    ${changeText ? `<span class="sponsored-change ${changeClass}">${changeText}</span>` : ''}
  </a>`;
}
