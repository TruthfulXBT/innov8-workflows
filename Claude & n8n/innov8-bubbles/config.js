/* ============================================================
   config.js — Constants, asset definitions, color/size scales
   ============================================================ */

export const ASSET_CLASSES = {
  crypto: {
    label: 'Crypto',
    icon: '₿',
    requiresKey: false,
  },
  indices: {
    label: 'Indices',
    icon: '📊',
    requiresKey: true,
  },
  stocks: {
    label: 'Stocks',
    icon: '📈',
    requiresKey: true,
  },
  commodities: {
    label: 'Commodities',
    icon: '🛢',
    requiresKey: true,
  },
  realestate: {
    label: 'Real Estate',
    icon: '🏠',
    requiresKey: true,
  },
  assets: {
    label: 'Assets',
    icon: '🏡',
    requiresKey: false,
  },
  finance: {
    label: 'Finance',
    icon: '🏦',
    requiresKey: false,
  },
};

export const TIME_PERIODS = [
  { key: '1h',  label: '1H' },
  { key: '24h', label: '24H' },
  { key: '7d',  label: '7D' },
  { key: '30d', label: '30D' },
  { key: '1y',  label: '1Y' },
];

// ─── Physics ───
export const PHYSICS = {
  GRAVITY: 0.0003,
  DAMPING: 0.92,
  LERP_SPEED: 0.08,
  COLLISION_PADDING: 1.5,
};

// ─── Bubble sizing ───
export const BUBBLE = {
  MIN_RADIUS: 24,
  MAX_RADIUS: 120,
  FONT_SIZE_RATIO: 0.38,    // symbol font = radius * ratio
  CHANGE_FONT_RATIO: 0.28,  // change% font = radius * ratio
};

// ─── API URLs ───
export const API = {
  COINGECKO_BASE: 'https://api.coingecko.com/api/v3',
  FMP_BASE: 'https://financialmodelingprep.com/api/v3',
  LAND_REGISTRY: 'https://landregistry.data.gov.uk/data/ppi/transaction-record.json',

  COMMODITY_SYMBOLS: [
    'GLD',  // Gold
    'SLV',  // Silver
    'USO',  // Oil
    'UNG',  // Natural Gas
    'PDBC', // Diversified Commodities
    'DBA',  // Agriculture
    'CORN', // Corn
    'WEAT', // Wheat
    'CPER', // Copper
    'PPLT', // Platinum
    'PALL', // Palladium
    'URA',  // Uranium
    'WOOD', // Timber
    'LIT',  // Lithium
    'DBC',  // Broad Commodities
  ],

  INDEX_SYMBOLS: [
    // US Indices
    'SPY',   // S&P 500
    'QQQ',   // NASDAQ 100
    'DIA',   // Dow Jones 30
    'IWM',   // Russell 2000
    'VTI',   // Total US Stock Market
    // Global / All-World
    'VT',    // Vanguard Total World
    'VXUS',  // Vanguard International (ex-US)
    'EFA',   // MSCI EAFE (Developed ex-US)
    'VWO',   // Vanguard Emerging Markets
    'ACWI',  // MSCI All Country World
    // Sector / Thematic
    'XLK',   // Technology Select
    'XLF',   // Financial Select
    'XLE',   // Energy Select
    'XLV',   // Health Care Select
    'ARKK',  // ARK Innovation
    // Bonds
    'BND',   // Vanguard Total Bond
    'TLT',   // 20+ Year Treasury
    'HYG',   // High Yield Corporate
    // Real Estate Index
    'VNQ',   // Vanguard Real Estate (REIT Index)
    'IYR',   // iShares US Real Estate
    'XLRE',  // Real Estate Select SPDR
    'RWR',   // SPDR DJ Wilshire REIT
    'SCHH',  // Schwab US REIT
    // International Real Estate
    'VNQI',  // Vanguard Global ex-US Real Estate
    'IFGL',  // iShares International Real Estate
  ],
};

// ─── Cache TTLs (ms) ───
export const CACHE_TTL = {
  crypto: 60_000,
  indices: 300_000,
  stocks: 300_000,
  commodities: 300_000,
  realestate: 300_000,
  assets: 3600_000,  // 1 hour — property/asset data doesn't change often
  finance: 3600_000, // 1 hour — pension/savings data doesn't change often
};

// ─── LocalStorage keys ───
export const STORAGE = {
  FMP_KEY: 'innov8-bubbles-fmp-key',
  PORTFOLIOS: 'innov8-bubbles-portfolios',
  SETTINGS: 'innov8-bubbles-settings',
  AUTH_USER: 'innov8-bubbles-auth-user',
  CUSTOM_ASSETS: 'innov8-bubbles-custom-assets',
};

// ─── Custom Asset Types ───
export const CUSTOM_ASSET_TYPES = {
  property:  { label: 'Property',        icon: '🏠', tab: 'assets',  subtypes: ['Detached', 'Semi-Detached', 'Terraced', 'Flat', 'Bungalow', 'Other'] },
  pension:   { label: 'Pension',         icon: '🏦', tab: 'finance', subtypes: ['Workplace DC', 'SIPP', 'Defined Benefit', 'State Pension', 'SSAS', 'Stakeholder', 'Other'] },
  vehicle:   { label: 'Vehicle',         icon: '🚗', tab: 'assets',  subtypes: ['Car', 'Motorcycle', 'Van', 'Other'] },
  watch:     { label: 'Watch',           icon: '⌚', tab: 'assets',  subtypes: ['Luxury', 'Vintage', 'Smart', 'Other'] },
  art:       { label: 'Art',             icon: '🎨', tab: 'assets',  subtypes: ['Painting', 'Sculpture', 'Print', 'Other'] },
  business:  { label: 'Business Equity', icon: '🏢', tab: 'assets',  subtypes: ['Ltd Company', 'Partnership', 'Sole Trader', 'Other'] },
  savings:   { label: 'Savings',         icon: '💰', tab: 'finance', subtypes: ['Cash ISA', 'Savings Account', 'Premium Bonds', 'Other'] },
  other:     { label: 'Other',           icon: '📦', tab: 'assets',  subtypes: ['Collectible', 'Jewellery', 'Equipment', 'Other'] },
};

// ─── Pension Providers (UK) ───
export const PENSION_PROVIDERS = [
  'Workplace (auto-enrol)', 'Aviva', 'Scottish Widows', 'Legal & General', 'Royal London',
  'Standard Life', 'Nest', 'Aegon', 'Fidelity', 'Hargreaves Lansdown',
  'AJ Bell', 'Vanguard', 'Interactive Investor', 'PensionBee', 'Nutmeg',
  'Smart Pension', 'The People\'s Pension', 'NOW: Pensions', 'State Pension (DWP)', 'Other',
];

// ─── Firebase Config ───
// Replace with your Firebase project config from Firebase Console → Project Settings
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAF5AZPZ3caJu47BF-tQG4UVrGT2j5UqYE',
  authDomain: 'innov8-bubbles.firebaseapp.com',
  projectId: 'innov8-bubbles',
  storageBucket: 'innov8-bubbles.firebasestorage.app',
  messagingSenderId: '309940607663',
  appId: '1:309940607663:web:e2cc46f04546213c7b125a',
  measurementId: 'G-2ZZR76XZM0',
};

// ─── Stripe Config ───
// Replace with your Stripe publishable key and price IDs
export const STRIPE_CONFIG = {
  publishableKey: 'pk_live_51TLhmHLwaoUSAyt5dQl2gxneget7LzKvMSJelKsPNA6PcgQNF4JPcQcaarrQmF6iVEpghgU0RDXrs2y0ISTXTybm00AC6v7CiQ',
  prices: [
    { days: 7,  label: '7 Days',  price: '£29',  priceId: 'price_1TLhsOLwaoUSAyt5GdFgKhK4', paymentLink: 'https://buy.stripe.com/4gM5kEfwSaMo8xVdnZe3e00' },
    { days: 14, label: '14 Days', price: '£49',  priceId: 'price_1TLht2LwaoUSAyt5B2e2KeRI', paymentLink: 'https://buy.stripe.com/eVq3cwacy1bO5lJ6ZBe3e01' },
    { days: 30, label: '30 Days', price: '£99',  priceId: 'price_1TLhtSLwaoUSAyt5ytLH6hiZ', paymentLink: 'https://buy.stripe.com/4gMfZi98uf2Eg0ncjVe3e02' },
  ],
};

// ─── Sponsored Bubble Pricing ───
// Payment links are placeholders — create in Stripe dashboard and replace
export const SPONSORED_PRICES = [
  { days: 1,  label: '1 Day',    price: '£500',   priceId: 'TBD', paymentLink: '#' },
  { days: 2,  label: '2 Days',   price: '£800',   priceId: 'TBD', paymentLink: '#' },
  { days: 7,  label: '1 Week',   price: '£1,500', priceId: 'TBD', paymentLink: '#' },
  { days: 14, label: '2 Weeks',  price: '£3,000', priceId: 'TBD', paymentLink: '#' },
  { days: 30, label: '1 Month',  price: '£5,000', priceId: 'TBD', paymentLink: '#' },
];

// ─── Color Schemes ───
export const COLOR_SCHEMES = {
  'red-green': {
    label: 'Red + Green',
    pos: (mag) => [Math.round(15 - mag * 15), Math.round(140 + mag * 57), Math.round(40 + mag * 54)],
    neg: (mag) => [Math.round(180 + mag * 40), Math.round(30 + mag * 8), Math.round(30 + mag * 8)],
    neutral: [55, 55, 70],
  },
  'blue-yellow': {
    label: 'Blue + Yellow',
    pos: (mag) => [Math.round(200 + mag * 55), Math.round(180 + mag * 55), Math.round(20 + mag * 10)],
    neg: (mag) => [Math.round(30 + mag * 30), Math.round(80 + mag * 60), Math.round(180 + mag * 60)],
    neutral: [60, 60, 75],
  },
  'purple-orange': {
    label: 'Purple + Orange',
    pos: (mag) => [Math.round(220 + mag * 35), Math.round(120 + mag * 60), Math.round(20 + mag * 10)],
    neg: (mag) => [Math.round(100 + mag * 40), Math.round(40 + mag * 20), Math.round(160 + mag * 60)],
    neutral: [65, 55, 70],
  },
};

// ─── Currencies ───
export const CURRENCIES = [
  { code: 'usd', symbol: '$', label: 'USD' },
  { code: 'gbp', symbol: '£', label: 'GBP' },
  { code: 'eur', symbol: '€', label: 'EUR' },
  { code: 'jpy', symbol: '¥', label: 'JPY' },
  { code: 'aud', symbol: 'A$', label: 'AUD' },
];

// ─── Ad Badge Types ───
export const AD_BADGE_TYPES = [
  { value: 'new-drop', label: 'New Drop',  badgeText: 'NEW' },
  { value: 'ipo',      label: 'IPO',       badgeText: 'IPO' },
  { value: 'presale',  label: 'Presale',   badgeText: 'PRESALE' },
  { value: 'promo',    label: 'Promotion', badgeText: 'PROMO' },
];


// ─── Color Scale ───
// Active color scheme — set by app.js when user changes it
let _activeScheme = 'red-green';

export function setColorScheme(scheme) {
  _activeScheme = COLOR_SCHEMES[scheme] ? scheme : 'red-green';
}

export function getColorScheme() {
  return _activeScheme;
}

export function changeToColor(pct, alpha = 1.0) {
  const [r, g, b] = changeToRGB(pct);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Returns [r, g, b] array — uses active color scheme
export function changeToRGB(pct) {
  const scheme = COLOR_SCHEMES[_activeScheme] || COLOR_SCHEMES['red-green'];
  if (pct == null || isNaN(pct)) return scheme.neutral;

  const magnitude = Math.min(Math.abs(pct) / 10, 1);

  if (pct > 0) return scheme.pos(magnitude);
  if (pct < 0) return scheme.neg(magnitude);
  return scheme.neutral;
}

// ─── Logo URL Helper ───
// Returns best available logo URL for any asset
export function getLogoUrl(asset) {
  // If the asset already has an image (e.g. from CoinGecko), use it
  if (asset.image) return asset.image;
  // For stocks/ETFs/REITs, use free logo APIs
  if (asset.symbol && asset.assetClass !== 'crypto') {
    return `https://assets.parqet.com/logos/symbol/${asset.symbol}`;
  }
  return '';
}

// ─── Size Scale ───
// Log-scale mapping from market cap to radius
export function marketCapToRadius(cap, minCap, maxCap) {
  if (!cap || cap <= 0) return BUBBLE.MIN_RADIUS;
  // When all items have similar market cap (or single item), use a mid-large size
  if (!minCap || !maxCap || minCap >= maxCap) return (BUBBLE.MIN_RADIUS + BUBBLE.MAX_RADIUS) * 0.55;
  const logCap = Math.log(cap);
  const logMin = Math.log(minCap);
  const logMax = Math.log(maxCap);
  const t = Math.max(0, Math.min(1, (logCap - logMin) / (logMax - logMin)));
  return BUBBLE.MIN_RADIUS + (BUBBLE.MAX_RADIUS - BUBBLE.MIN_RADIUS) * t;
}


// ─── Formatting Utilities ───
function _currencySymbol() {
  const code = (typeof localStorage !== 'undefined' && localStorage.getItem('innov8-bubbles-currency')) || 'usd';
  const cur = CURRENCIES.find(c => c.code === code);
  return cur ? cur.symbol : '$';
}

export function formatPrice(price) {
  if (price == null) return '—';
  const s = _currencySymbol();
  if (price >= 1) return s + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return s + price.toFixed(4);
  return s + price.toFixed(8);
}

export function formatLargeNumber(n) {
  if (n == null) return '—';
  const s = _currencySymbol();
  if (n >= 1e12) return s + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return s + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return s + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return s + (n / 1e3).toFixed(1) + 'K';
  return s + n.toFixed(2);
}

export function formatChange(pct) {
  if (pct == null || isNaN(pct)) return '—';
  const sign = pct >= 0 ? '+' : '';
  return sign + pct.toFixed(2) + '%';
}


// ─── Sample / Fallback Data ───
export const SAMPLE_DATA = {
  crypto: [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', assetClass: 'crypto', price: 67234.50, marketCap: 1320000000000, volume24h: 28000000000, change1h: 0.3, change24h: 2.1, change7d: 5.4, change30d: 12.3, change1y: 142.5, image: '' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', assetClass: 'crypto', price: 3521.80, marketCap: 423000000000, volume24h: 15000000000, change1h: -0.1, change24h: 1.8, change7d: 3.2, change30d: 8.7, change1y: 95.2, image: '' },
    { id: 'tether', symbol: 'USDT', name: 'Tether', assetClass: 'crypto', price: 1.00, marketCap: 110000000000, volume24h: 45000000000, change1h: 0.0, change24h: 0.01, change7d: 0.0, change30d: 0.0, change1y: 0.0, image: '' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', assetClass: 'crypto', price: 589.30, marketCap: 88000000000, volume24h: 1800000000, change1h: 0.5, change24h: -1.2, change7d: -0.8, change30d: 4.5, change1y: 78.3, image: '' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', assetClass: 'crypto', price: 172.40, marketCap: 78000000000, volume24h: 3200000000, change1h: 1.2, change24h: 4.5, change7d: 12.1, change30d: 25.6, change1y: 580.2, image: '' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', assetClass: 'crypto', price: 0.52, marketCap: 28000000000, volume24h: 1200000000, change1h: -0.3, change24h: -0.5, change7d: 2.1, change30d: -3.2, change1y: 15.6, image: '' },
    { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', assetClass: 'crypto', price: 1.00, marketCap: 33000000000, volume24h: 8000000000, change1h: 0.0, change24h: 0.0, change7d: 0.0, change30d: 0.0, change1y: 0.0, image: '' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', assetClass: 'crypto', price: 0.45, marketCap: 16000000000, volume24h: 450000000, change1h: 0.8, change24h: 3.2, change7d: -1.5, change30d: -8.2, change1y: -12.4, image: '' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', assetClass: 'crypto', price: 0.15, marketCap: 22000000000, volume24h: 1100000000, change1h: 2.1, change24h: 8.3, change7d: 15.2, change30d: 32.1, change1y: 110.5, image: '' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', assetClass: 'crypto', price: 35.80, marketCap: 13500000000, volume24h: 520000000, change1h: -0.5, change24h: 1.1, change7d: 4.8, change30d: -5.3, change1y: 45.2, image: '' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', assetClass: 'crypto', price: 7.20, marketCap: 9800000000, volume24h: 280000000, change1h: 0.2, change24h: -2.1, change7d: -5.3, change30d: -12.1, change1y: -28.4, image: '' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', assetClass: 'crypto', price: 14.50, marketCap: 8500000000, volume24h: 480000000, change1h: 0.9, change24h: 5.6, change7d: 8.9, change30d: 18.5, change1y: 65.3, image: '' },
    { id: 'tron', symbol: 'TRX', name: 'TRON', assetClass: 'crypto', price: 0.125, marketCap: 11000000000, volume24h: 350000000, change1h: 0.1, change24h: 0.8, change7d: 1.2, change30d: 3.5, change1y: 72.1, image: '' },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon', assetClass: 'crypto', price: 0.72, marketCap: 6700000000, volume24h: 310000000, change1h: -0.4, change24h: -1.8, change7d: 2.4, change30d: -7.1, change1y: -45.2, image: '' },
    { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', assetClass: 'crypto', price: 0.0000245, marketCap: 14500000000, volume24h: 680000000, change1h: 1.8, change24h: 6.2, change7d: 18.5, change30d: 42.3, change1y: 185.6, image: '' },
    { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', assetClass: 'crypto', price: 82.50, marketCap: 6100000000, volume24h: 420000000, change1h: 0.3, change24h: 1.5, change7d: -0.8, change30d: 2.3, change1y: 18.9, image: '' },
    { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', assetClass: 'crypto', price: 7.85, marketCap: 4700000000, volume24h: 180000000, change1h: 1.1, change24h: 3.8, change7d: 7.2, change30d: 15.8, change1y: 35.6, image: '' },
    { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', assetClass: 'crypto', price: 5.45, marketCap: 5800000000, volume24h: 250000000, change1h: -0.6, change24h: -3.2, change7d: -8.1, change30d: -15.4, change1y: 22.1, image: '' },
    { id: 'pepe', symbol: 'PEPE', name: 'Pepe', assetClass: 'crypto', price: 0.0000089, marketCap: 3800000000, volume24h: 950000000, change1h: 3.5, change24h: 12.8, change7d: 35.2, change30d: 85.1, change1y: 1250.3, image: '' },
    { id: 'stellar', symbol: 'XLM', name: 'Stellar', assetClass: 'crypto', price: 0.115, marketCap: 3300000000, volume24h: 110000000, change1h: 0.2, change24h: 0.9, change7d: -2.1, change30d: -6.8, change1y: -15.3, image: '' },
  ],
  indices: [
    { id: 'SPY', symbol: 'SPY', name: 'S&P 500 ETF', assetClass: 'indices', price: 528.50, marketCap: 520000000000, volume24h: 85000000, change1h: 0.1, change24h: 0.5, change7d: 1.8, change30d: 4.2, change1y: 28.5, image: '' },
    { id: 'QQQ', symbol: 'QQQ', name: 'NASDAQ 100 ETF', assetClass: 'indices', price: 445.20, marketCap: 250000000000, volume24h: 55000000, change1h: 0.2, change24h: 0.8, change7d: 2.5, change30d: 6.1, change1y: 35.8, image: '' },
    { id: 'DIA', symbol: 'DIA', name: 'Dow Jones ETF', assetClass: 'indices', price: 395.80, marketCap: 35000000000, volume24h: 4200000, change1h: 0.0, change24h: 0.3, change7d: 1.2, change30d: 3.1, change1y: 18.2, image: '' },
    { id: 'IWM', symbol: 'IWM', name: 'Russell 2000 ETF', assetClass: 'indices', price: 205.40, marketCap: 62000000000, volume24h: 28000000, change1h: 0.1, change24h: -0.2, change7d: -0.8, change30d: 1.5, change1y: 12.3, image: '' },
    { id: 'VTI', symbol: 'VTI', name: 'Total US Market', assetClass: 'indices', price: 268.90, marketCap: 410000000000, volume24h: 4500000, change1h: 0.1, change24h: 0.5, change7d: 1.6, change30d: 3.8, change1y: 26.2, image: '' },
    { id: 'VT', symbol: 'VT', name: 'Total World Stock', assetClass: 'indices', price: 108.50, marketCap: 38000000000, volume24h: 2800000, change1h: 0.1, change24h: 0.4, change7d: 1.2, change30d: 3.2, change1y: 22.5, image: '' },
    { id: 'VXUS', symbol: 'VXUS', name: 'International ex-US', assetClass: 'indices', price: 58.90, marketCap: 62000000000, volume24h: 5200000, change1h: 0.0, change24h: 0.3, change7d: 0.8, change30d: 2.5, change1y: 15.8, image: '' },
    { id: 'VWO', symbol: 'VWO', name: 'Emerging Markets', assetClass: 'indices', price: 42.30, marketCap: 78000000000, volume24h: 12000000, change1h: 0.2, change24h: 0.6, change7d: 1.5, change30d: 4.8, change1y: 18.2, image: '' },
    { id: 'ACWI', symbol: 'ACWI', name: 'MSCI All Country World', assetClass: 'indices', price: 112.80, marketCap: 18000000000, volume24h: 3200000, change1h: 0.1, change24h: 0.4, change7d: 1.3, change30d: 3.5, change1y: 24.1, image: '' },
    { id: 'EFA', symbol: 'EFA', name: 'MSCI EAFE (Developed)', assetClass: 'indices', price: 79.50, marketCap: 52000000000, volume24h: 18000000, change1h: 0.0, change24h: 0.2, change7d: 0.5, change30d: 2.1, change1y: 12.8, image: '' },
    { id: 'XLK', symbol: 'XLK', name: 'Technology Select', assetClass: 'indices', price: 215.30, marketCap: 68000000000, volume24h: 8500000, change1h: 0.3, change24h: 1.2, change7d: 3.5, change30d: 8.2, change1y: 42.5, image: '' },
    { id: 'XLF', symbol: 'XLF', name: 'Financial Select', assetClass: 'indices', price: 42.80, marketCap: 38000000000, volume24h: 42000000, change1h: 0.1, change24h: 0.5, change7d: 1.2, change30d: 3.8, change1y: 22.1, image: '' },
    { id: 'XLE', symbol: 'XLE', name: 'Energy Select', assetClass: 'indices', price: 88.50, marketCap: 35000000000, volume24h: 15000000, change1h: 0.2, change24h: 0.8, change7d: -0.5, change30d: -2.1, change1y: 5.2, image: '' },
    { id: 'ARKK', symbol: 'ARKK', name: 'ARK Innovation', assetClass: 'indices', price: 52.30, marketCap: 7500000000, volume24h: 18000000, change1h: 0.5, change24h: 1.8, change7d: 5.2, change30d: 12.5, change1y: 45.2, image: '' },
    { id: 'BND', symbol: 'BND', name: 'Total Bond Market', assetClass: 'indices', price: 72.50, marketCap: 105000000000, volume24h: 8500000, change1h: 0.0, change24h: 0.1, change7d: 0.2, change30d: 0.5, change1y: 2.8, image: '' },
    { id: 'TLT', symbol: 'TLT', name: '20+ Year Treasury', assetClass: 'indices', price: 95.80, marketCap: 52000000000, volume24h: 22000000, change1h: 0.0, change24h: -0.2, change7d: -0.5, change30d: -1.5, change1y: -8.2, image: '' },
    { id: 'VNQ', symbol: 'VNQ', name: 'Vanguard Real Estate', assetClass: 'indices', price: 88.20, marketCap: 35000000000, volume24h: 5500000, change1h: 0.1, change24h: 0.3, change7d: 0.8, change30d: 2.5, change1y: 8.5, image: '' },
    { id: 'IYR', symbol: 'IYR', name: 'iShares US Real Estate', assetClass: 'indices', price: 92.50, marketCap: 5800000000, volume24h: 6200000, change1h: 0.1, change24h: 0.4, change7d: 1.0, change30d: 3.2, change1y: 10.2, image: '' },
    { id: 'VNQI', symbol: 'VNQI', name: 'Global ex-US Real Estate', assetClass: 'indices', price: 42.80, marketCap: 4200000000, volume24h: 850000, change1h: 0.0, change24h: 0.2, change7d: 0.5, change30d: 1.8, change1y: 5.5, image: '' },
  ],
  stocks: [
    { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stocks', price: 189.50, marketCap: 2950000000000, volume24h: 52000000, change1h: 0.1, change24h: 0.8, change7d: 2.1, change30d: 5.3, change1y: 28.5, image: '' },
    { id: 'MSFT', symbol: 'MSFT', name: 'Microsoft', assetClass: 'stocks', price: 415.80, marketCap: 3090000000000, volume24h: 24000000, change1h: 0.2, change24h: 1.2, change7d: 3.4, change30d: 8.1, change1y: 35.2, image: '' },
    { id: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet', assetClass: 'stocks', price: 155.20, marketCap: 1950000000000, volume24h: 28000000, change1h: -0.1, change24h: 0.5, change7d: 1.8, change30d: 4.2, change1y: 45.8, image: '' },
    { id: 'AMZN', symbol: 'AMZN', name: 'Amazon', assetClass: 'stocks', price: 185.40, marketCap: 1920000000000, volume24h: 45000000, change1h: 0.3, change24h: 1.5, change7d: 4.2, change30d: 9.8, change1y: 62.3, image: '' },
    { id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA', assetClass: 'stocks', price: 875.50, marketCap: 2160000000000, volume24h: 38000000, change1h: 0.8, change24h: 3.2, change7d: 8.5, change30d: 18.2, change1y: 215.6, image: '' },
    { id: 'META', symbol: 'META', name: 'Meta Platforms', assetClass: 'stocks', price: 502.30, marketCap: 1290000000000, volume24h: 18000000, change1h: 0.4, change24h: 2.1, change7d: 5.6, change30d: 12.4, change1y: 155.8, image: '' },
    { id: 'TSLA', symbol: 'TSLA', name: 'Tesla', assetClass: 'stocks', price: 245.80, marketCap: 782000000000, volume24h: 95000000, change1h: -0.5, change24h: -2.3, change7d: -5.1, change30d: -8.4, change1y: -15.2, image: '' },
    { id: 'BRK-B', symbol: 'BRK.B', name: 'Berkshire Hathaway', assetClass: 'stocks', price: 415.20, marketCap: 890000000000, volume24h: 3500000, change1h: 0.0, change24h: 0.3, change7d: 0.8, change30d: 2.1, change1y: 18.5, image: '' },
    { id: 'JPM', symbol: 'JPM', name: 'JPMorgan Chase', assetClass: 'stocks', price: 195.60, marketCap: 565000000000, volume24h: 9000000, change1h: 0.1, change24h: 0.6, change7d: 1.2, change30d: 3.5, change1y: 32.1, image: '' },
    { id: 'V', symbol: 'V', name: 'Visa Inc.', assetClass: 'stocks', price: 282.40, marketCap: 570000000000, volume24h: 6500000, change1h: 0.2, change24h: 0.9, change7d: 2.3, change30d: 5.8, change1y: 22.4, image: '' },
    { id: 'WMT', symbol: 'WMT', name: 'Walmart', assetClass: 'stocks', price: 168.90, marketCap: 455000000000, volume24h: 8200000, change1h: 0.1, change24h: 0.4, change7d: 1.5, change30d: 3.2, change1y: 25.8, image: '' },
    { id: 'UNH', symbol: 'UNH', name: 'UnitedHealth', assetClass: 'stocks', price: 525.30, marketCap: 485000000000, volume24h: 3800000, change1h: -0.2, change24h: -0.8, change7d: -1.5, change30d: -3.2, change1y: 8.5, image: '' },
    { id: 'XOM', symbol: 'XOM', name: 'Exxon Mobil', assetClass: 'stocks', price: 112.50, marketCap: 450000000000, volume24h: 15000000, change1h: 0.3, change24h: 1.1, change7d: -0.5, change30d: -2.8, change1y: 5.2, image: '' },
    { id: 'JNJ', symbol: 'JNJ', name: 'Johnson & Johnson', assetClass: 'stocks', price: 158.70, marketCap: 382000000000, volume24h: 7200000, change1h: 0.0, change24h: 0.2, change7d: 0.5, change30d: 1.8, change1y: -5.2, image: '' },
    { id: 'MA', symbol: 'MA', name: 'Mastercard', assetClass: 'stocks', price: 458.90, marketCap: 428000000000, volume24h: 3200000, change1h: 0.2, change24h: 0.7, change7d: 2.1, change30d: 6.2, change1y: 18.9, image: '' },
    { id: 'PG', symbol: 'PG', name: 'Procter & Gamble', assetClass: 'stocks', price: 162.40, marketCap: 382000000000, volume24h: 6800000, change1h: 0.1, change24h: 0.3, change7d: 0.8, change30d: 2.5, change1y: 12.3, image: '' },
    { id: 'HD', symbol: 'HD', name: 'Home Depot', assetClass: 'stocks', price: 345.20, marketCap: 345000000000, volume24h: 4100000, change1h: -0.1, change24h: -0.5, change7d: -1.2, change30d: 1.8, change1y: 15.6, image: '' },
    { id: 'CVX', symbol: 'CVX', name: 'Chevron', assetClass: 'stocks', price: 158.90, marketCap: 295000000000, volume24h: 8500000, change1h: 0.2, change24h: 0.8, change7d: -0.3, change30d: -1.5, change1y: 2.8, image: '' },
    { id: 'AVGO', symbol: 'AVGO', name: 'Broadcom', assetClass: 'stocks', price: 1320.50, marketCap: 612000000000, volume24h: 5200000, change1h: 0.6, change24h: 2.8, change7d: 6.5, change30d: 15.2, change1y: 125.4, image: '' },
    { id: 'AMD', symbol: 'AMD', name: 'AMD', assetClass: 'stocks', price: 178.90, marketCap: 289000000000, volume24h: 42000000, change1h: 0.9, change24h: 3.5, change7d: 7.8, change30d: 22.1, change1y: 85.3, image: '' },
  ],
  commodities: [
    { id: 'GLD', symbol: 'GLD', name: 'SPDR Gold Trust', assetClass: 'commodities', price: 218.50, marketCap: 62000000000, volume24h: 8500000, change1h: 0.1, change24h: 0.5, change7d: 1.2, change30d: 3.8, change1y: 15.2, image: '' },
    { id: 'SLV', symbol: 'SLV', name: 'iShares Silver Trust', assetClass: 'commodities', price: 25.80, marketCap: 12500000000, volume24h: 22000000, change1h: 0.3, change24h: 1.2, change7d: 3.5, change30d: 8.2, change1y: 22.5, image: '' },
    { id: 'USO', symbol: 'USO', name: 'United States Oil Fund', assetClass: 'commodities', price: 72.30, marketCap: 2800000000, volume24h: 5200000, change1h: -0.2, change24h: -1.5, change7d: -3.2, change30d: -8.5, change1y: -12.3, image: '' },
    { id: 'UNG', symbol: 'UNG', name: 'United States Natural Gas', assetClass: 'commodities', price: 12.80, marketCap: 850000000, volume24h: 8500000, change1h: 0.8, change24h: 3.5, change7d: 12.1, change30d: -15.2, change1y: -35.8, image: '' },
    { id: 'DBA', symbol: 'DBA', name: 'Invesco DB Agriculture', assetClass: 'commodities', price: 22.50, marketCap: 680000000, volume24h: 1200000, change1h: 0.1, change24h: 0.3, change7d: 0.8, change30d: 2.1, change1y: 5.8, image: '' },
    { id: 'CORN', symbol: 'CORN', name: 'Teucrium Corn Fund', assetClass: 'commodities', price: 18.90, marketCap: 120000000, volume24h: 280000, change1h: -0.1, change24h: -0.5, change7d: -1.2, change30d: -3.5, change1y: -18.2, image: '' },
    { id: 'WEAT', symbol: 'WEAT', name: 'Teucrium Wheat Fund', assetClass: 'commodities', price: 5.20, marketCap: 95000000, volume24h: 450000, change1h: 0.2, change24h: 0.8, change7d: 2.1, change30d: -5.2, change1y: -25.3, image: '' },
    { id: 'CPER', symbol: 'CPER', name: 'United States Copper', assetClass: 'commodities', price: 28.40, marketCap: 220000000, volume24h: 180000, change1h: 0.4, change24h: 1.8, change7d: 4.5, change30d: 12.3, change1y: 28.5, image: '' },
    { id: 'PDBC', symbol: 'PDBC', name: 'Invesco Optimum Yield', assetClass: 'commodities', price: 14.20, marketCap: 4200000000, volume24h: 3500000, change1h: 0.1, change24h: 0.5, change7d: 1.2, change30d: 3.5, change1y: 8.2, image: '' },
    { id: 'URA', symbol: 'URA', name: 'Global X Uranium ETF', assetClass: 'commodities', price: 28.50, marketCap: 2800000000, volume24h: 5500000, change1h: 0.6, change24h: 2.5, change7d: 5.8, change30d: 15.2, change1y: 45.8, image: '' },
  ],
  realestate: [
    { id: 'PLD', symbol: 'PLD', name: 'Prologis', assetClass: 'realestate', price: 128.50, marketCap: 118000000000, volume24h: 5200000, change1h: 0.1, change24h: 0.5, change7d: 1.2, change30d: 3.5, change1y: 12.8, image: '' },
    { id: 'AMT', symbol: 'AMT', name: 'American Tower', assetClass: 'realestate', price: 205.30, marketCap: 96000000000, volume24h: 2800000, change1h: 0.0, change24h: 0.3, change7d: 0.8, change30d: 2.1, change1y: 8.5, image: '' },
    { id: 'EQIX', symbol: 'EQIX', name: 'Equinix', assetClass: 'realestate', price: 845.20, marketCap: 79000000000, volume24h: 580000, change1h: 0.2, change24h: 0.8, change7d: 2.1, change30d: 5.8, change1y: 22.3, image: '' },
    { id: 'SPG', symbol: 'SPG', name: 'Simon Property Group', assetClass: 'realestate', price: 152.80, marketCap: 50000000000, volume24h: 2100000, change1h: -0.1, change24h: -0.5, change7d: -1.2, change30d: -3.5, change1y: 5.2, image: '' },
    { id: 'O', symbol: 'O', name: 'Realty Income', assetClass: 'realestate', price: 55.80, marketCap: 42000000000, volume24h: 4500000, change1h: 0.1, change24h: 0.2, change7d: 0.5, change30d: 1.8, change1y: -5.2, image: '' },
    { id: 'WELL', symbol: 'WELL', name: 'Welltower', assetClass: 'realestate', price: 98.50, marketCap: 52000000000, volume24h: 2800000, change1h: 0.2, change24h: 0.8, change7d: 2.5, change30d: 6.2, change1y: 35.8, image: '' },
    { id: 'DLR', symbol: 'DLR', name: 'Digital Realty', assetClass: 'realestate', price: 142.30, marketCap: 44000000000, volume24h: 2200000, change1h: 0.3, change24h: 1.2, change7d: 3.5, change30d: 8.5, change1y: 42.1, image: '' },
    { id: 'PSA', symbol: 'PSA', name: 'Public Storage', assetClass: 'realestate', price: 285.50, marketCap: 50000000000, volume24h: 850000, change1h: 0.0, change24h: 0.3, change7d: 0.8, change30d: 2.5, change1y: 8.2, image: '' },
    { id: 'AVB', symbol: 'AVB', name: 'AvalonBay Communities', assetClass: 'realestate', price: 198.70, marketCap: 28000000000, volume24h: 620000, change1h: 0.1, change24h: 0.5, change7d: 1.5, change30d: 4.2, change1y: 15.8, image: '' },
    { id: 'VICI', symbol: 'VICI', name: 'VICI Properties', assetClass: 'realestate', price: 31.20, marketCap: 32000000000, volume24h: 8500000, change1h: 0.2, change24h: 0.8, change7d: 1.8, change30d: 5.2, change1y: 12.5, image: '' },
  ],
  property: [
    // UK Regions — avg house prices (ONS data Q1 2026 approx)
    { id: 'uk-london', symbol: 'LDN', name: 'London', assetClass: 'property', price: 523000, marketCap: 523000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.4, change1y: 2.1, image: '' },
    { id: 'uk-south-east', symbol: 'SE', name: 'South East', assetClass: 'property', price: 385000, marketCap: 385000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.5, change1y: 3.2, image: '' },
    { id: 'uk-east', symbol: 'EAST', name: 'East of England', assetClass: 'property', price: 342000, marketCap: 342000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.4, change1y: 2.8, image: '' },
    { id: 'uk-south-west', symbol: 'SW', name: 'South West', assetClass: 'property', price: 315000, marketCap: 315000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.6, change1y: 3.5, image: '' },
    { id: 'uk-west-midlands', symbol: 'WM', name: 'West Midlands', assetClass: 'property', price: 248000, marketCap: 248000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.5, change1y: 4.1, image: '' },
    { id: 'uk-east-midlands', symbol: 'EM', name: 'East Midlands', assetClass: 'property', price: 242000, marketCap: 242000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.6, change1y: 4.5, image: '' },
    { id: 'uk-north-west', symbol: 'NW', name: 'North West', assetClass: 'property', price: 218000, marketCap: 218000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.7, change1y: 5.2, image: '' },
    { id: 'uk-yorkshire', symbol: 'YORKS', name: 'Yorkshire & Humber', assetClass: 'property', price: 205000, marketCap: 205000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.7, change1y: 5.8, image: '' },
    { id: 'uk-wales', symbol: 'WAL', name: 'Wales', assetClass: 'property', price: 198000, marketCap: 198000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.8, change1y: 4.8, image: '' },
    { id: 'uk-north-east', symbol: 'NE', name: 'North East', assetClass: 'property', price: 162000, marketCap: 162000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.9, change1y: 6.2, image: '' },
    { id: 'uk-scotland', symbol: 'SCOT', name: 'Scotland', assetClass: 'property', price: 195000, marketCap: 195000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.6, change1y: 4.2, image: '' },
    { id: 'uk-ni', symbol: 'NI', name: 'Northern Ireland', assetClass: 'property', price: 178000, marketCap: 178000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.8, change1y: 5.5, image: '' },
    // Global Property Markets
    { id: 'global-us', symbol: 'US', name: 'United States', assetClass: 'property', price: 420000, marketCap: 420000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.0, change30d: 0.3, change1y: 4.8, image: '' },
    { id: 'global-aus', symbol: 'AUS', name: 'Australia', assetClass: 'property', price: 780000, marketCap: 390000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.4, change1y: 7.2, image: '' },
    { id: 'global-canada', symbol: 'CAN', name: 'Canada', assetClass: 'property', price: 650000, marketCap: 325000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.0, change30d: -0.2, change1y: -1.5, image: '' },
    { id: 'global-germany', symbol: 'DEU', name: 'Germany', assetClass: 'property', price: 310000, marketCap: 310000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.0, change30d: -0.3, change1y: -3.2, image: '' },
    { id: 'global-france', symbol: 'FRA', name: 'France', assetClass: 'property', price: 295000, marketCap: 295000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.0, change30d: -0.1, change1y: -2.1, image: '' },
    { id: 'global-dubai', symbol: 'UAE', name: 'Dubai', assetClass: 'property', price: 450000, marketCap: 225000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.2, change30d: 1.5, change1y: 18.5, image: '' },
    { id: 'global-singapore', symbol: 'SGP', name: 'Singapore', assetClass: 'property', price: 1250000, marketCap: 312000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.3, change1y: 5.2, image: '' },
    { id: 'global-japan', symbol: 'JPN', name: 'Japan', assetClass: 'property', price: 380000, marketCap: 380000000000, volume24h: 0, change1h: null, change24h: null, change7d: 0.1, change30d: 0.5, change1y: 8.5, image: '' },
  ],
};
