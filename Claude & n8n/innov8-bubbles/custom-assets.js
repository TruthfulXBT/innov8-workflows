/* ============================================================
   custom-assets.js — Custom asset CRUD, normalizer, Land Registry
   ============================================================ */

import { STORAGE, CUSTOM_ASSET_TYPES, API } from './config.js';
import { saveCustomAssetToCloud, deleteCustomAssetFromCloud } from './auth.js';

// ─── Cloud mode state ───
let _cloudMode = false;
let _cloudUid = null;

// ─── Internal ───

function _load() {
  try {
    const raw = localStorage.getItem(STORAGE.CUSTOM_ASSETS);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return [];
}

function _save(assets) {
  localStorage.setItem(STORAGE.CUSTOM_ASSETS, JSON.stringify(assets));
}

function _uuid() {
  return 'ca_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// ─── Cloud Mode Control ───

export function setCloudMode(uid, cloudAssets) {
  _cloudMode = true;
  _cloudUid = uid;

  if (cloudAssets && cloudAssets.length > 0) {
    // Merge: cloud wins, but keep local-only assets
    const cloudIds = new Set(cloudAssets.map(a => a.id));
    const local = _load().filter(a => !cloudIds.has(a.id));
    _save([...cloudAssets, ...local]);
  }
}

export function setLocalMode() {
  _cloudMode = false;
  _cloudUid = null;
}

// ─── Cloud Sync Helper ───

function _syncToCloud(asset) {
  if (_cloudMode) {
    saveCustomAssetToCloud(asset).catch(e => {
      console.warn('[custom-assets] cloud sync failed:', e.message);
    });
  }
}

function _deleteFromCloud(assetId) {
  if (_cloudMode) {
    deleteCustomAssetFromCloud(assetId).catch(e => {
      console.warn('[custom-assets] cloud delete failed:', e.message);
    });
  }
}

// ─── Public CRUD ───

export function loadCustomAssets() {
  return _load();
}

export function getCustomAsset(id) {
  return _load().find(a => a.id === id) || null;
}

export function saveCustomAsset(asset) {
  const assets = _load();
  const now = Date.now();

  if (!asset.id) {
    // Create new
    asset.id = _uuid();
    asset.createdAt = now;
    asset.updatedAt = now;
    assets.push(asset);
  } else {
    // Update existing
    const idx = assets.findIndex(a => a.id === asset.id);
    if (idx >= 0) {
      asset.updatedAt = now;
      asset.createdAt = assets[idx].createdAt;
      assets[idx] = asset;
    } else {
      asset.createdAt = now;
      asset.updatedAt = now;
      assets.push(asset);
    }
  }

  _save(assets);
  _syncToCloud(asset);
  return asset;
}

export function deleteCustomAsset(id) {
  const assets = _load().filter(a => a.id !== id);
  _save(assets);
  _deleteFromCloud(id);
}

// ─── Normalizer — converts custom asset → bubble-compatible shape ───

function _generateSymbol(asset) {
  if (!asset.name) return '???';
  const words = asset.name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
}

function _calcGainLossPercent(asset) {
  if (!asset.purchasePrice || asset.purchasePrice <= 0) return 0;
  return ((asset.currentValue - asset.purchasePrice) / asset.purchasePrice) * 100;
}

export function normalizeCustomAsset(asset) {
  const gainPct = _calcGainLossPercent(asset);
  const typeInfo = CUSTOM_ASSET_TYPES[asset.type] || CUSTOM_ASSET_TYPES.other;

  // For pensions, use annual growth rate as the display metric if available
  const isPension = asset.type === 'pension';
  const displayPct = isPension && asset.pensionGrowthRate ? asset.pensionGrowthRate : gainPct;

  return {
    id: asset.id,
    symbol: _generateSymbol(asset),
    name: asset.name,
    assetClass: typeInfo.tab || 'assets',
    price: asset.currentValue || 0,
    marketCap: asset.currentValue || 0,
    volume24h: isPension ? ((asset.pensionEmployeeContrib || 0) + (asset.pensionEmployerContrib || 0)) * 12 : 0,
    change1h: gainPct,
    change24h: gainPct,
    change7d: gainPct,
    change30d: gainPct,
    change1y: gainPct,
    image: '',
    // Extended fields for custom asset identification
    _isCustom: true,
    _customAssetId: asset.id,
    _purchasePrice: asset.purchasePrice,
    _gainLoss: (asset.currentValue || 0) - (asset.purchasePrice || 0),
    _gainLossPercent: gainPct,
    _type: asset.type,
    _subtype: asset.subtype,
    _location: asset.location,
    _typeIcon: typeInfo.icon,
    _isPension: isPension,
    _isSavings: asset.type === 'savings',
    _pensionProvider: asset.pensionProvider || '',
    _pensionGrowthRate: asset.pensionGrowthRate || 0,
    _savingsGrowthRate: asset.savingsGrowthRate || 0,
  };
}

export function getCustomAssetsNormalized() {
  return _load().map(normalizeCustomAsset);
}

// ─── Land Registry Valuation ───

export async function fetchLandRegistryValuation(postcode) {
  if (!postcode || !postcode.trim()) return null;

  // Extract outcode (first part of UK postcode, e.g. "SW1A" from "SW1A 1AA")
  const clean = postcode.trim().toUpperCase().replace(/\s+/g, ' ');
  // UK postcodes: outcode is everything except last 3 chars
  const outcode = clean.length > 3 ? clean.slice(0, -3).trim() : clean;

  try {
    // Use Land Registry Price Paid Data API
    const url = `${API.LAND_REGISTRY}?propertyAddress.postcode=${encodeURIComponent(clean)}&_pageSize=30&_sort=-transactionDate`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    let res;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      // Try with just outcode
      const fallbackUrl = `${API.LAND_REGISTRY}?propertyAddress.postcode=${encodeURIComponent(outcode)}&_pageSize=30&_sort=-transactionDate`;
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 8000);
      try {
        res = await fetch(fallbackUrl, { signal: controller2.signal });
      } finally {
        clearTimeout(timer2);
      }
      if (!res.ok) return null;
    }

    const json = await res.json();
    const items = json.result?.items;
    if (!items || items.length === 0) return null;

    // Extract prices and calculate median
    const prices = items
      .map(item => item.pricePaid)
      .filter(p => p && p > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) return null;

    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 === 0
      ? (prices[mid - 1] + prices[mid]) / 2
      : prices[mid];

    return {
      estimatedValue: Math.round(median),
      transactionCount: prices.length,
      latestDate: items[0].transactionDate || null,
    };
  } catch (e) {
    console.warn('[custom-assets] Land Registry fetch failed:', e.message);
    return null;
  }
}
