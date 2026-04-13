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
};

// ─── LocalStorage keys ───
export const STORAGE = {
  FMP_KEY: 'innov8-bubbles-fmp-key',
  PORTFOLIOS: 'innov8-bubbles-portfolios',
  SETTINGS: 'innov8-bubbles-settings',
  AUTH_USER: 'innov8-bubbles-auth-user',
};

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
    { days: 7,  label: '7 Days',  price: '£29',  priceId: 'price_1TLhsOLwaoUSAyt5GdFgKhK4' },
    { days: 14, label: '14 Days', price: '£49',  priceId: 'price_1TLht2LwaoUSAyt5B2e2KeRI' },
    { days: 30, label: '30 Days', price: '£99',  priceId: 'price_1TLhtSLwaoUSAyt5ytLH6hiZ' },
  ],
};

// ─── Ad Badge Types ───
export const AD_BADGE_TYPES = [
  { value: 'new-drop', label: 'New Drop',  badgeText: 'NEW' },
  { value: 'ipo',      label: 'IPO',       badgeText: 'IPO' },
  { value: 'presale',  label: 'Presale',   badgeText: 'PRESALE' },
  { value: 'promo',    label: 'Promotion', badgeText: 'PROMO' },
];


// ─── Color Scale ───
// CryptoBubbles-style: vibrant, saturated colors that pop on dark backgrounds
export function changeToColor(pct, alpha = 1.0) {
  const [r, g, b] = changeToRGB(pct);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Returns [r, g, b] array — the base bubble color
export function changeToRGB(pct) {
  if (pct == null || isNaN(pct)) return [55, 50, 60]; // dark neutral

  const magnitude = Math.min(Math.abs(pct) / 10, 1); // cap at ±10%

  if (pct > 0) {
    // Vivid green: from muted (#2d6b3f) to bright (#22c55e)
    return [
      Math.round(30 - magnitude * 10),
      Math.round(85 + magnitude * 112),
      Math.round(50 + magnitude * 44),
    ];
  } else if (pct < 0) {
    // Vivid red: from muted (#8b3030) to bright (#dc2626)
    return [
      Math.round(110 + magnitude * 110),
      Math.round(35 + magnitude * 3),
      Math.round(35 + magnitude * 3),
    ];
  }
  return [55, 50, 60];
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
export function formatPrice(price) {
  if (price == null) return '—';
  if (price >= 1) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return '$' + price.toFixed(4);
  return '$' + price.toFixed(8);
}

export function formatLargeNumber(n) {
  if (n == null) return '—';
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(2);
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
};
