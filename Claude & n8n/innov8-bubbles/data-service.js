/* ============================================================
   data-service.js — API fetching, normalization, caching
   ============================================================ */

import { API, CACHE_TTL, STORAGE, SAMPLE_DATA, CUSTOM_ASSET_TYPES } from './config.js';
import { getCustomAssetsNormalized } from './custom-assets.js';
import { fetchApprovedSponsored } from './auth.js';

// ─── Sponsored Bubbles Cache ───
let _sponsoredCache = { data: [], timestamp: 0 };
const SPONSORED_TTL = 300_000; // 5 min

export async function getSponsoredBubbles() {
  if (Date.now() - _sponsoredCache.timestamp < SPONSORED_TTL && _sponsoredCache.data.length > 0) {
    return _sponsoredCache.data;
  }
  try {
    const approved = await fetchApprovedSponsored();
    const bubbles = approved.map(s => ({
      id: 'sp_' + s.id,
      symbol: (s.symbol || s.name || '').replace('$', '').slice(0, 6).toUpperCase(),
      name: s.name || '',
      assetClass: 'crypto', // show on crypto tab primarily
      price: s.price || 0,
      marketCap: s.price ? s.price * 1e9 : 1e9, // give them decent bubble size
      volume24h: 0,
      change1h: s.change24h || 0,
      change24h: s.change24h || 0,
      change7d: s.change24h || 0,
      change30d: s.change24h || 0,
      change1y: s.change24h || 0,
      image: s.logoUrl || '',
      _isSponsored: true,
      _sponsoredUrl: s.url || '#',
      _sponsoredBadge: s.badge || 'new-drop',
      _sponsoredDescription: s.description || '',
    }));
    _sponsoredCache = { data: bubbles, timestamp: Date.now() };
    return bubbles;
  } catch (e) {
    console.warn('[data-service] Failed to fetch sponsored:', e.message);
    return _sponsoredCache.data;
  }
}

// ─── Cache ───
const cache = new Map(); // key → { data, timestamp }
const inflight = new Map(); // key → Promise

function getCacheKey(assetClass) {
  return assetClass;
}

function isCacheValid(key, assetClass) {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < (CACHE_TTL[assetClass] || 300_000);
}

// ─── Public API ───

export async function fetchAssets(assetClass) {
  // "all" fetches every class in parallel and merges
  if (assetClass === 'all') {
    return _fetchAll();
  }

  const key = getCacheKey(assetClass);

  // Return cached if valid
  if (isCacheValid(key, assetClass)) {
    return { data: cache.get(key).data, isSample: false };
  }

  // Deduplicate in-flight requests
  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = _doFetch(assetClass, key);
  inflight.set(key, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    inflight.delete(key);
  }
}

async function _fetchAll() {
  const classes = ['crypto', 'indices', 'stocks', 'commodities', 'realestate', 'assets', 'finance'];
  const hasFmpKey = !!localStorage.getItem(STORAGE.FMP_KEY);

  // Only fetch classes we have keys for (crypto, assets, finance don't need FMP key)
  const toFetch = classes.filter(c => c === 'crypto' || c === 'assets' || c === 'finance' || hasFmpKey);

  const results = await Promise.allSettled(
    toFetch.map(c => fetchAssets(c))
  );

  let allData = [];
  let anySample = false;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allData = allData.concat(result.value.data);
      if (result.value.isSample) anySample = true;
    }
  }

  // If we got no FMP data, add sample data for those classes
  // Note: don't add property — it's already included via the 'assets' class fetch above
  if (!hasFmpKey) {
    allData = allData.concat(
      SAMPLE_DATA.indices || [],
      SAMPLE_DATA.stocks || [],
      SAMPLE_DATA.commodities || [],
      SAMPLE_DATA.realestate || []
    );
    anySample = true;
  }

  return { data: allData, isSample: anySample };
}

// ─── Internal Fetch Logic ───

async function _doFetch(assetClass, cacheKey) {
  try {
    let data;
    switch (assetClass) {
      case 'crypto':
        data = await _fetchCrypto();
        break;
      case 'indices':
        data = await _fetchIndices();
        break;
      case 'stocks':
        data = await _fetchStocks();
        break;
      case 'commodities':
        data = await _fetchCommodities();
        break;
      case 'realestate':
        data = await _fetchRealEstate();
        break;
      case 'assets': {
        // Assets tab: regional property data + custom assets (property, vehicle, watch, art, business, other)
        const sampleProperty = SAMPLE_DATA.property || [];
        const assetCustom = getCustomAssetsNormalized().filter(a => {
          const typeInfo = CUSTOM_ASSET_TYPES[a._type];
          return !typeInfo || typeInfo.tab === 'assets';
        });
        return { data: [...sampleProperty, ...assetCustom], isSample: assetCustom.length === 0 };
      }
      case 'finance': {
        // Finance tab: pensions + savings (no sample data, purely user-added)
        const financeCustom = getCustomAssetsNormalized().filter(a => {
          const typeInfo = CUSTOM_ASSET_TYPES[a._type];
          return typeInfo && typeInfo.tab === 'finance';
        });
        return { data: financeCustom, isSample: false };
      }
      default:
        throw new Error('Unknown asset class: ' + assetClass);
    }

    if (data && data.length > 0) {
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return { data, isSample: false };
    }

    throw new Error('No data returned');
  } catch (err) {
    console.warn(`[data-service] ${assetClass} fetch failed:`, err.message);

    // Try cached (even if expired)
    const stale = cache.get(cacheKey);
    if (stale) {
      return { data: stale.data, isSample: false };
    }

    // Fallback to sample data
    const sample = SAMPLE_DATA[assetClass] || [];
    return { data: sample, isSample: true };
  }
}


// ─── Crypto (CoinGecko) ───

async function _fetchCrypto() {
  const currency = localStorage.getItem('innov8-bubbles-currency') || 'usd';
  const url = `${API.COINGECKO_BASE}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d,1y`;

  const res = await _fetchWithTimeout(url, 8000);
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const json = await res.json();

  return json.map(c => ({
    id: c.id,
    symbol: (c.symbol || '').toUpperCase(),
    name: c.name,
    assetClass: 'crypto',
    price: c.current_price,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
    change1h: c.price_change_percentage_1h_in_currency,
    change24h: c.price_change_percentage_24h_in_currency,
    change7d: c.price_change_percentage_7d_in_currency,
    change30d: c.price_change_percentage_30d_in_currency,
    change1y: c.price_change_percentage_1y_in_currency,
    image: c.image || '',
  }));
}


// ─── Stocks (FMP) ───

async function _fetchStocks() {
  const apiKey = _getFmpKey();
  if (!apiKey) throw new Error('No FMP API key');

  // Get top stocks by market cap
  const screenerUrl = `${API.FMP_BASE}/stock-screener?marketCapMoreThan=50000000000&limit=100&apikey=${apiKey}`;
  const screenerRes = await _fetchWithTimeout(screenerUrl, 8000);
  if (!screenerRes.ok) throw new Error(`FMP screener ${screenerRes.status}`);
  const screenerJson = await screenerRes.json();

  if (!Array.isArray(screenerJson) || screenerJson.length === 0) {
    throw new Error('FMP screener returned empty');
  }

  // Get quotes for these symbols
  const symbols = screenerJson.map(s => s.symbol).slice(0, 80).join(',');
  const quoteUrl = `${API.FMP_BASE}/quote/${symbols}?apikey=${apiKey}`;
  const quoteRes = await _fetchWithTimeout(quoteUrl, 8000);
  if (!quoteRes.ok) throw new Error(`FMP quote ${quoteRes.status}`);
  const quotes = await quoteRes.json();

  return (Array.isArray(quotes) ? quotes : []).map(q => _normalizeFmpQuote(q, 'stocks'));
}


// ─── Indices (FMP - ETFs tracking major indices) ───

async function _fetchIndices() {
  const apiKey = _getFmpKey();
  if (!apiKey) throw new Error('No FMP API key');

  const symbols = API.INDEX_SYMBOLS.join(',');
  const url = `${API.FMP_BASE}/quote/${symbols}?apikey=${apiKey}`;
  const res = await _fetchWithTimeout(url, 8000);
  if (!res.ok) throw new Error(`FMP indices ${res.status}`);
  const json = await res.json();

  return (Array.isArray(json) ? json : []).map(q => _normalizeFmpQuote(q, 'indices'));
}


// ─── Commodities (FMP - ETFs) ───

async function _fetchCommodities() {
  const apiKey = _getFmpKey();
  if (!apiKey) throw new Error('No FMP API key');

  const symbols = API.COMMODITY_SYMBOLS.join(',');
  const url = `${API.FMP_BASE}/quote/${symbols}?apikey=${apiKey}`;
  const res = await _fetchWithTimeout(url, 8000);
  if (!res.ok) throw new Error(`FMP commodities ${res.status}`);
  const json = await res.json();

  return (Array.isArray(json) ? json : []).map(q => _normalizeFmpQuote(q, 'commodities'));
}


// ─── Real Estate (FMP - REITs) ───

async function _fetchRealEstate() {
  const apiKey = _getFmpKey();
  if (!apiKey) throw new Error('No FMP API key');

  const screenerUrl = `${API.FMP_BASE}/stock-screener?sector=Real+Estate&marketCapMoreThan=5000000000&limit=50&apikey=${apiKey}`;
  const screenerRes = await _fetchWithTimeout(screenerUrl, 8000);
  if (!screenerRes.ok) throw new Error(`FMP RE screener ${screenerRes.status}`);
  const screenerJson = await screenerRes.json();

  if (!Array.isArray(screenerJson) || screenerJson.length === 0) {
    throw new Error('FMP RE screener returned empty');
  }

  const symbols = screenerJson.map(s => s.symbol).slice(0, 40).join(',');
  const quoteUrl = `${API.FMP_BASE}/quote/${symbols}?apikey=${apiKey}`;
  const quoteRes = await _fetchWithTimeout(quoteUrl, 8000);
  if (!quoteRes.ok) throw new Error(`FMP RE quote ${quoteRes.status}`);
  const quotes = await quoteRes.json();

  return (Array.isArray(quotes) ? quotes : []).map(q => _normalizeFmpQuote(q, 'realestate'));
}


// ─── FMP Quote Normalizer ───

function _normalizeFmpQuote(q, assetClass) {
  // FMP provides changesPercentage (24h), yearHigh/yearLow but not all periods
  // We estimate 1h as a fraction, and use what we have
  const change24h = q.changesPercentage || 0;
  const apiKey = _getFmpKey();

  return {
    id: q.symbol,
    symbol: q.symbol,
    name: q.name || q.symbol,
    assetClass,
    price: q.price,
    marketCap: q.marketCap,
    volume24h: q.volume || q.avgVolume,
    change1h: change24h != null ? +(change24h / 6).toFixed(2) : null,
    change24h: change24h,
    change7d: change24h != null ? +(change24h * 2.5).toFixed(2) : null,
    change30d: change24h != null ? +(change24h * 5).toFixed(2) : null,
    change1y: q.yearHigh && q.yearLow && q.price
      ? +(((q.price - q.yearLow) / q.yearLow) * 100).toFixed(2)
      : null,
    image: apiKey ? `${API.FMP_BASE}/image-stock/${q.symbol}.png?apikey=${apiKey}` : '',
  };
}


// ─── Helpers ───

function _getFmpKey() {
  return localStorage.getItem(STORAGE.FMP_KEY) || '';
}

async function _fetchWithTimeout(url, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── Cache Invalidation (used by custom assets) ───

export function invalidateCache(assetClass) {
  cache.delete(getCacheKey(assetClass));
}
