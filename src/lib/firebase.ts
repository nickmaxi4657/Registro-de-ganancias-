import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { Sale, ProductPreset, AppSettings, UserProfile, FirebaseConfig } from '../types';

const STORAGE_KEY_CONFIG = 'ganancias_custom_firebase_config';

// Retrieve saved config or default environment configuration
export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved firebase config:', e);
  }

  // Fallback to environment variables if provided
  const envApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
  const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;
  const envAppId = (import.meta as any).env?.VITE_FIREBASE_APP_ID;

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: `${envProjectId}.firebasestorage.app`,
      appId: envAppId || '1:123456789:web:abcdef'
    };
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig | null) {
  if (config) {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } else {
    localStorage.removeItem(STORAGE_KEY_CONFIG);
  }
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function initializeFirebaseServices(config?: FirebaseConfig | null) {
  const targetConfig = config || getSavedFirebaseConfig();
  if (!targetConfig || !targetConfig.apiKey || !targetConfig.projectId) {
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    return { app: null, auth: null, db: null };
  }

  try {
    const existing = getApps();
    if (existing.length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(targetConfig);
    }
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    appInstance = null;
    authInstance = null;
    dbInstance = null;
  }

  return { app: appInstance, auth: authInstance, db: dbInstance };
}

// Initial setup call
initializeFirebaseServices();

export function isFirebaseConfigured(): boolean {
  return !!authInstance && !!dbInstance;
}

export function getFirebaseAuth(): Auth | null {
  if (!authInstance) {
    initializeFirebaseServices();
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore | null {
  if (!dbInstance) {
    initializeFirebaseServices();
  }
  return dbInstance;
}

// Auth operations
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase no está configurado. Configura tu proyecto Firebase en los ajustes.');
  }
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return mapFirebaseUser(cred.user);
}

export async function registerWithEmail(email: string, pass: string, name?: string): Promise<UserProfile> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase no está configurado. Configura tu proyecto Firebase en los ajustes.');
  }
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && cred.user) {
    try {
      await updateProfile(cred.user, { displayName: name });
    } catch {}
  }
  return mapFirebaseUser(cred.user);
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase no está configurado.');
  }
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return mapFirebaseUser(cred.user);
}

export async function logoutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    await fbSignOut(auth);
  }
}

export function mapFirebaseUser(user: User): UserProfile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario'),
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous
  };
}

// Real-time Firestore Sync Listeners
export function subscribeToUserSales(
  uid: string,
  onUpdate: (sales: Sale[]) => void,
  onError?: (err: Error) => void
): () => void {
  const db = getFirebaseDb();
  if (!db) {
    return () => {};
  }

  const salesCol = collection(db, 'users', uid, 'sales');
  return onSnapshot(
    salesCol,
    (snapshot) => {
      const sales: Sale[] = [];
      snapshot.forEach((docSnap) => {
        sales.push({ ...docSnap.data(), id: docSnap.id } as Sale);
      });
      // Sort by date descending
      sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(sales);
    },
    (err) => {
      console.error('Error syncing sales from Firestore:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToUserSettings(
  uid: string,
  onUpdate: (settings: AppSettings) => void
): () => void {
  const db = getFirebaseDb();
  if (!db) return () => {};

  const docRef = doc(db, 'users', uid, 'config', 'settings');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as AppSettings);
    }
  });
}

export function subscribeToUserPresets(
  uid: string,
  onUpdate: (presets: ProductPreset[]) => void
): () => void {
  const db = getFirebaseDb();
  if (!db) return () => {};

  const presetsCol = collection(db, 'users', uid, 'presets');
  return onSnapshot(presetsCol, (snapshot) => {
    const presets: ProductPreset[] = [];
    snapshot.forEach((docSnap) => {
      presets.push({ ...docSnap.data(), id: docSnap.id } as ProductPreset);
    });
    onUpdate(presets);
  });
}

// Mutation helpers to write to Cloud Firestore
export async function syncSaleToCloud(uid: string, sale: Sale): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'sales', sale.id);
  await setDoc(docRef, sale);
}

export async function deleteSaleFromCloud(uid: string, saleId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'sales', saleId);
  await deleteDoc(docRef);
}

export async function syncSettingsToCloud(uid: string, settings: AppSettings): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'config', 'settings');
  await setDoc(docRef, settings);
}

export async function syncPresetToCloud(uid: string, preset: ProductPreset): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'presets', preset.id);
  await setDoc(docRef, preset);
}

export async function deletePresetFromCloud(uid: string, presetId: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, 'users', uid, 'presets', presetId);
  await deleteDoc(docRef);
}

// Batch upload local items to cloud upon first login
export async function uploadLocalDataToCloud(
  uid: string,
  sales: Sale[],
  presets: ProductPreset[],
  settings: AppSettings
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const batch = writeBatch(db);

  // Settings
  const settingsRef = doc(db, 'users', uid, 'config', 'settings');
  batch.set(settingsRef, settings);

  // Sales
  sales.forEach((s) => {
    const sRef = doc(db, 'users', uid, 'sales', s.id);
    batch.set(sRef, s);
  });

  // Presets
  presets.forEach((p) => {
    const pRef = doc(db, 'users', uid, 'presets', p.id);
    batch.set(pRef, p);
  });

  await batch.commit();
}
