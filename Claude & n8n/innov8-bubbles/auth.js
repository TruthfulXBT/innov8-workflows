/* ============================================================
   auth.js — Firebase Auth + Firestore wrapper
   ============================================================ */

import { FIREBASE_CONFIG, STORAGE } from './config.js';

// ─── State ───
let _app = null;
let _auth = null;
let _db = null;
let _currentUser = null;
let _authCallbacks = [];

// ─── Init ───

export function initFirebase() {
  // Firebase SDK is loaded via CDN <script> tags in index.html
  // They expose firebase global
  if (typeof firebase === 'undefined') {
    console.warn('[auth] Firebase SDK not loaded — running in offline mode');
    return false;
  }

  try {
    // Check if already initialized
    if (firebase.apps.length === 0) {
      _app = firebase.initializeApp(FIREBASE_CONFIG);
    } else {
      _app = firebase.apps[0];
    }
    _auth = firebase.auth();
    _db = firebase.firestore();

    // Listen for auth state changes
    _auth.onAuthStateChanged((user) => {
      _currentUser = user;
      if (user) {
        localStorage.setItem(STORAGE.AUTH_USER, JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }));
      } else {
        localStorage.removeItem(STORAGE.AUTH_USER);
      }
      _authCallbacks.forEach(cb => cb(user));
    });

    return true;
  } catch (e) {
    console.error('[auth] Firebase init failed:', e.message);
    return false;
  }
}

// ─── Auth Methods ───

export async function signInWithGoogle() {
  if (!_auth) throw new Error('Firebase not initialized');
  const provider = new firebase.auth.GoogleAuthProvider();
  return _auth.signInWithPopup(provider);
}

export async function signInWithEmail(email, password) {
  if (!_auth) throw new Error('Firebase not initialized');
  return _auth.signInWithEmailAndPassword(email, password);
}

export async function signUpWithEmail(email, password, displayName) {
  if (!_auth) throw new Error('Firebase not initialized');
  const cred = await _auth.createUserWithEmailAndPassword(email, password);
  if (displayName && cred.user) {
    await cred.user.updateProfile({ displayName });
  }
  return cred;
}

export async function signOut() {
  if (!_auth) return;
  return _auth.signOut();
}

export function onAuthChange(callback) {
  _authCallbacks.push(callback);
  // Fire immediately with current state
  if (_currentUser !== undefined) {
    callback(_currentUser);
  }
}

export function getCurrentUser() {
  return _currentUser;
}

export function isSignedIn() {
  return !!_currentUser;
}

// ─── Firestore: Portfolio Sync ───

export async function loadPortfoliosFromCloud() {
  if (!_db || !_currentUser) return null;

  try {
    const snap = await _db.collection('users').doc(_currentUser.uid)
      .collection('portfolios').orderBy('createdAt', 'asc').get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('[auth] loadPortfolios error:', e.message);
    return null;
  }
}

export async function savePortfolioToCloud(portfolio) {
  if (!_db || !_currentUser) return;

  try {
    await _db.collection('users').doc(_currentUser.uid)
      .collection('portfolios').doc(portfolio.id).set({
        name: portfolio.name,
        assetIds: portfolio.assetIds,
        createdAt: portfolio.createdAt || Date.now(),
      }, { merge: true });
  } catch (e) {
    console.error('[auth] savePortfolio error:', e.message);
  }
}

export async function deletePortfolioFromCloud(portfolioId) {
  if (!_db || !_currentUser) return;

  try {
    await _db.collection('users').doc(_currentUser.uid)
      .collection('portfolios').doc(portfolioId).delete();
  } catch (e) {
    console.error('[auth] deletePortfolio error:', e.message);
  }
}

export async function syncLocalPortfoliosToCloud(localPortfolios) {
  if (!_db || !_currentUser || !localPortfolios.length) return;

  // Load existing cloud portfolios
  const cloudPortfolios = await loadPortfoliosFromCloud();
  const cloudIds = new Set((cloudPortfolios || []).map(p => p.id));

  // Upload any local portfolios that don't exist in cloud
  for (const p of localPortfolios) {
    if (!cloudIds.has(p.id)) {
      await savePortfolioToCloud(p);
    }
  }
}

// ─── Firestore: Custom Assets ───

export async function loadCustomAssetsFromCloud() {
  if (!_db || !_currentUser) return null;

  try {
    const snap = await _db.collection('users').doc(_currentUser.uid)
      .collection('custom_assets').orderBy('createdAt', 'asc').get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error('[auth] loadCustomAssets error:', e.message);
    return null;
  }
}

export async function saveCustomAssetToCloud(asset) {
  if (!_db || !_currentUser) return;

  try {
    await _db.collection('users').doc(_currentUser.uid)
      .collection('custom_assets').doc(asset.id).set({
        name: asset.name,
        type: asset.type,
        subtype: asset.subtype || '',
        location: asset.location || '',
        postcode: asset.postcode || '',
        bedrooms: asset.bedrooms || null,
        purchasePrice: asset.purchasePrice || 0,
        purchaseDate: asset.purchaseDate || '',
        currentValue: asset.currentValue || 0,
        autoValuation: asset.autoValuation || false,
        notes: asset.notes || '',
        pensionProvider: asset.pensionProvider || '',
        pensionEmployeeContrib: asset.pensionEmployeeContrib || 0,
        pensionEmployerContrib: asset.pensionEmployerContrib || 0,
        pensionGrowthRate: asset.pensionGrowthRate || 0,
        pensionRetirementAge: asset.pensionRetirementAge || 0,
        savingsGrowthRate: asset.savingsGrowthRate || 0,
        createdAt: asset.createdAt || Date.now(),
        updatedAt: asset.updatedAt || Date.now(),
      }, { merge: true });
  } catch (e) {
    console.error('[auth] saveCustomAsset error:', e.message);
  }
}

export async function deleteCustomAssetFromCloud(assetId) {
  if (!_db || !_currentUser) return;

  try {
    await _db.collection('users').doc(_currentUser.uid)
      .collection('custom_assets').doc(assetId).delete();
  } catch (e) {
    console.error('[auth] deleteCustomAsset error:', e.message);
  }
}

export async function syncLocalCustomAssetsToCloud(localAssets) {
  if (!_db || !_currentUser || !localAssets.length) return;

  const cloudAssets = await loadCustomAssetsFromCloud();
  const cloudIds = new Set((cloudAssets || []).map(a => a.id));

  for (const a of localAssets) {
    if (!cloudIds.has(a.id)) {
      await saveCustomAssetToCloud(a);
    }
  }
}

// ─── Firestore: Ads ───

export async function submitAdToFirestore(adData) {
  if (!_db || !_currentUser) throw new Error('Must be signed in');

  const docRef = await _db.collection('ad_submissions').add({
    ...adData,
    submittedBy: _currentUser.uid,
    submitterEmail: _currentUser.email,
    status: 'pending_payment',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

export async function markAdAsPaid(adId) {
  if (!_db) return;

  await _db.collection('ad_submissions').doc(adId).update({
    status: 'approved',
    paidAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export async function fetchApprovedAds() {
  if (!_db) return [];

  try {
    const now = new Date();
    const snap = await _db.collection('ad_submissions')
      .where('status', '==', 'approved')
      .orderBy('paidAt', 'desc')
      .limit(20)
      .get();

    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(ad => {
        // Filter out expired ads
        if (ad.expiresAt) {
          const expires = ad.expiresAt.toDate ? ad.expiresAt.toDate() : new Date(ad.expiresAt);
          return expires > now;
        }
        return true;
      });
  } catch (e) {
    console.error('[auth] fetchApprovedAds error:', e.message);
    return [];
  }
}

// ─── Firestore: Sponsored Bubbles ───

export async function submitSponsoredToFirestore(data) {
  if (!_db || !_currentUser) throw new Error('Must be signed in');

  const docRef = await _db.collection('sponsored_submissions').add({
    ...data,
    submittedBy: _currentUser.uid,
    submitterEmail: _currentUser.email,
    status: 'pending_payment',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
}

export async function markSponsoredAsPaid(id) {
  if (!_db) return;
  await _db.collection('sponsored_submissions').doc(id).update({
    status: 'approved',
    paidAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export async function fetchApprovedSponsored() {
  if (!_db) return [];

  try {
    const now = new Date();
    const snap = await _db.collection('sponsored_submissions')
      .where('status', '==', 'approved')
      .orderBy('paidAt', 'desc')
      .limit(10)
      .get();

    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(s => {
        if (s.expiresAt) {
          const expires = s.expiresAt.toDate ? s.expiresAt.toDate() : new Date(s.expiresAt);
          return expires > now;
        }
        return true;
      });
  } catch (e) {
    console.error('[auth] fetchApprovedSponsored error:', e.message);
    return [];
  }
}

// ─── Firebase Storage: Logo Upload ───

export async function uploadAdLogo(file) {
  if (!_currentUser) throw new Error('Must be signed in');
  if (!file) return null;

  // Validate file
  if (file.size > 200 * 1024) throw new Error('Logo must be under 200KB');
  if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
    throw new Error('Logo must be PNG, JPG, SVG or WebP');
  }

  const storage = firebase.storage();
  const ext = file.name.split('.').pop();
  const path = `ad-logos/${_currentUser.uid}/${Date.now()}.${ext}`;
  const ref = storage.ref(path);

  await ref.put(file);
  const url = await ref.getDownloadURL();
  return url;
}

// ─── Helpers ───

export function getUserInitial() {
  if (!_currentUser) return '?';
  if (_currentUser.displayName) return _currentUser.displayName.charAt(0).toUpperCase();
  if (_currentUser.email) return _currentUser.email.charAt(0).toUpperCase();
  return '?';
}

export function getUserDisplayName() {
  if (!_currentUser) return '';
  return _currentUser.displayName || _currentUser.email || '';
}
