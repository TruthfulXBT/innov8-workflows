/* ============================================================
   portfolio.js — Holdings-based portfolio tracker
   Tracks individual buy lots with quantity, price, date
   LocalStorage primary + Firestore cloud sync
   ============================================================ */

import { STORAGE } from './config.js';
import { savePortfolioToCloud, deletePortfolioFromCloud } from './auth.js';

// ─── Cloud mode state ───
let _cloudMode = false;
let _cloudUid = null;

// ─── Internal ───

function _load() {
  let state;
  try {
    const raw = localStorage.getItem(STORAGE.PORTFOLIOS);
    state = raw ? JSON.parse(raw) : { portfolios: [], activePortfolioId: null };
  } catch (e) {
    state = { portfolios: [], activePortfolioId: null };
  }
  // Migrate old watchlist format → holdings format
  _migrateIfNeeded(state);
  return state;
}

function _save(state) {
  localStorage.setItem(STORAGE.PORTFOLIOS, JSON.stringify(state));
}

function _uuid() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function _holdingId() {
  return 'h_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// ─── Migration: assetIds[] → holdings[] ───

function _migrateIfNeeded(state) {
  let migrated = false;
  for (const p of state.portfolios) {
    if (Array.isArray(p.assetIds) && !Array.isArray(p.holdings)) {
      // Convert each assetId string to a zero-quantity holding
      p.holdings = p.assetIds.map(assetId => ({
        id: _holdingId(),
        assetId,
        quantity: 0,
        purchasePrice: 0,
        purchaseDate: '',
      }));
      delete p.assetIds;
      migrated = true;
    }
    // Ensure holdings array exists
    if (!Array.isArray(p.holdings)) {
      p.holdings = [];
      migrated = true;
    }
  }
  if (migrated) _save(state);
}

// ─── Cloud Mode Control ───

export function setCloudMode(uid, cloudPortfolios) {
  _cloudMode = true;
  _cloudUid = uid;

  if (cloudPortfolios) {
    const state = _load();
    state.portfolios = cloudPortfolios;
    _save(state);
  }
}

export function setLocalMode() {
  _cloudMode = false;
  _cloudUid = null;
}

export function isCloudMode() {
  return _cloudMode;
}

// ─── Cloud Sync Helper ───

function _syncToCloud(portfolio) {
  if (_cloudMode) {
    savePortfolioToCloud(portfolio).catch(e => {
      console.warn('[portfolio] cloud sync failed:', e.message);
    });
  }
}

function _deleteFromCloud(portfolioId) {
  if (_cloudMode) {
    deletePortfolioFromCloud(portfolioId).catch(e => {
      console.warn('[portfolio] cloud delete failed:', e.message);
    });
  }
}

// ─── Public API: Portfolio CRUD ───

export function getPortfolios() {
  return _load().portfolios;
}

export function getActivePortfolioId() {
  return _load().activePortfolioId;
}

export function getActivePortfolio() {
  const state = _load();
  if (!state.activePortfolioId) return null;
  return state.portfolios.find(p => p.id === state.activePortfolioId) || null;
}

export function setActivePortfolio(id) {
  const state = _load();
  state.activePortfolioId = id || null;
  _save(state);
}

export function createPortfolio(name) {
  const state = _load();
  const portfolio = {
    id: _uuid(),
    name: name.trim() || 'My Portfolio',
    holdings: [],
    createdAt: Date.now(),
  };
  state.portfolios.push(portfolio);
  _save(state);
  _syncToCloud(portfolio);
  return portfolio;
}

export function deletePortfolio(id) {
  const state = _load();
  state.portfolios = state.portfolios.filter(p => p.id !== id);
  if (state.activePortfolioId === id) state.activePortfolioId = null;
  _save(state);
  _deleteFromCloud(id);
}

export function renamePortfolio(id, name) {
  const state = _load();
  const p = state.portfolios.find(p => p.id === id);
  if (p) {
    p.name = name.trim();
    _save(state);
    _syncToCloud(p);
  }
}

// ─── Backward Compatibility: getAssetIds ───

export function getAssetIds(portfolio) {
  if (!portfolio) return [];
  // New format: derive from holdings
  if (Array.isArray(portfolio.holdings)) {
    return [...new Set(portfolio.holdings.map(h => h.assetId))];
  }
  // Old format fallback (shouldn't happen after migration)
  if (Array.isArray(portfolio.assetIds)) return portfolio.assetIds;
  return [];
}

// ─── Holdings CRUD ───

export function addHolding(portfolioId, { assetId, quantity, purchasePrice, purchaseDate }) {
  const state = _load();
  const p = state.portfolios.find(p => p.id === portfolioId);
  if (!p) return null;

  const holding = {
    id: _holdingId(),
    assetId,
    quantity: quantity || 0,
    purchasePrice: purchasePrice || 0,
    purchaseDate: purchaseDate || '',
  };
  p.holdings.push(holding);
  _save(state);
  _syncToCloud(p);
  return holding;
}

export function removeHolding(portfolioId, holdingId) {
  const state = _load();
  const p = state.portfolios.find(p => p.id === portfolioId);
  if (!p) return;
  p.holdings = p.holdings.filter(h => h.id !== holdingId);
  _save(state);
  _syncToCloud(p);
}

export function updateHolding(portfolioId, holdingId, updates) {
  const state = _load();
  const p = state.portfolios.find(p => p.id === portfolioId);
  if (!p) return;
  const h = p.holdings.find(h => h.id === holdingId);
  if (!h) return;
  if (updates.quantity != null) h.quantity = updates.quantity;
  if (updates.purchasePrice != null) h.purchasePrice = updates.purchasePrice;
  if (updates.purchaseDate != null) h.purchaseDate = updates.purchaseDate;
  _save(state);
  _syncToCloud(p);
}

export function getHoldingsForAsset(portfolioId, assetId) {
  const state = _load();
  const p = state.portfolios.find(p => p.id === portfolioId);
  if (!p) return [];
  return p.holdings.filter(h => h.assetId === assetId);
}

export function removeAssetCompletely(portfolioId, assetId) {
  const state = _load();
  const p = state.portfolios.find(p => p.id === portfolioId);
  if (!p) return;
  p.holdings = p.holdings.filter(h => h.assetId !== assetId);
  _save(state);
  _syncToCloud(p);
}

export function isAssetInPortfolio(portfolioId, assetId) {
  const state = _load();
  const p = state.portfolios.find(p => p.id === portfolioId);
  return p ? p.holdings.some(h => h.assetId === assetId) : false;
}

// ─── Portfolio Summary / P&L Calculator ───

export function getPortfolioSummary(portfolio, priceMap) {
  if (!portfolio || !portfolio.holdings) return { totalValue: 0, totalCost: 0, totalPL: 0, totalPLPercent: 0, assetSummaries: [] };

  // Group holdings by assetId
  const groups = {};
  for (const h of portfolio.holdings) {
    if (!groups[h.assetId]) groups[h.assetId] = [];
    groups[h.assetId].push(h);
  }

  const assetSummaries = [];
  let totalValue = 0;
  let totalCost = 0;

  for (const [assetId, lots] of Object.entries(groups)) {
    const totalQty = lots.reduce((sum, h) => sum + (h.quantity || 0), 0);
    const lotCost = lots.reduce((sum, h) => sum + (h.quantity || 0) * (h.purchasePrice || 0), 0);
    const avgCost = totalQty > 0 ? lotCost / totalQty : 0;
    const currentPrice = (priceMap && priceMap[assetId]) || 0;
    const value = totalQty * currentPrice;
    const pl = value - lotCost;
    const plPercent = lotCost > 0 ? (pl / lotCost) * 100 : 0;

    assetSummaries.push({ assetId, totalQty, avgCost, lotCost, currentPrice, value, pl, plPercent, lots });
    totalValue += value;
    totalCost += lotCost;
  }

  const totalPL = totalValue - totalCost;
  const totalPLPercent = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  return { totalValue, totalCost, totalPL, totalPLPercent, assetSummaries };
}

// ─── Legacy Compatibility (deprecated — use addHolding/removeAssetCompletely) ───

export function addAsset(portfolioId, assetId) {
  return addHolding(portfolioId, { assetId, quantity: 0, purchasePrice: 0, purchaseDate: '' });
}

export function removeAsset(portfolioId, assetId) {
  return removeAssetCompletely(portfolioId, assetId);
}

export function toggleAssetInPortfolio(portfolioId, assetId) {
  if (isAssetInPortfolio(portfolioId, assetId)) {
    removeAssetCompletely(portfolioId, assetId);
    return false;
  } else {
    addHolding(portfolioId, { assetId, quantity: 0, purchasePrice: 0, purchaseDate: '' });
    return true;
  }
}
