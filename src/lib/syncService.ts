import { UserProfile, Sale, ProductPreset, AppSettings } from '../types';
import { 
  isFirebaseConfigured, 
  getFirebaseAuth,
  loginWithEmail as fbLogin, 
  registerWithEmail as fbRegister, 
  logoutUser as fbLogout,
  syncSaleToCloud as fbSyncSale,
  deleteSaleFromCloud as fbDeleteSale,
  syncSettingsToCloud as fbSyncSettings,
  syncPresetToCloud as fbSyncPreset,
  deletePresetFromCloud as fbDeletePreset,
  uploadLocalDataToCloud as fbUploadAll
} from './firebase';

const TOKEN_KEY = 'profit_flow_auth_token_v1';
const USER_KEY = 'profit_flow_cached_user_v1';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCachedUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setSession(user: UserProfile | null, token?: string | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else if (token === null) {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Check session on app mount
export async function checkCurrentSession(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        setSession(data.user);
        return data.user;
      }
    } else {
      setSession(null, null);
    }
  } catch (e) {
    console.warn('Session check failed (offline or server starting):', e);
    return getCachedUser();
  }
  return null;
}

export function isUsingFirebaseAuth(): boolean {
  return isFirebaseConfigured() && !!getFirebaseAuth()?.currentUser;
}

// Built-in Cloud Sync Backend Helpers
export async function registerBuiltinCloud(
  email: string,
  pass: string,
  displayName?: string
): Promise<UserProfile> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass, displayName })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al registrar la cuenta');
  }

  setSession(data.user, data.token);
  return data.user;
}

export async function loginBuiltinCloud(
  email: string,
  pass: string
): Promise<UserProfile> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Error al iniciar sesión');
  }

  setSession(data.user, data.token);
  return data.user;
}

// User Registration
export async function registerAccount(
  email: string, 
  pass: string, 
  displayName?: string,
  forceBuiltinCloud: boolean = false
): Promise<UserProfile> {
  // If user explicitly configured Firebase and not forcing built-in cloud, try Firebase
  if (isFirebaseConfigured() && !forceBuiltinCloud) {
    try {
      return await fbRegister(email, pass, displayName);
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/configuration-not-found' || fbErr.message?.includes('configuration-not-found') || fbErr.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Auth method not enabled in console, using built-in cloud sync:', fbErr);
        const user = await registerBuiltinCloud(email, pass, displayName);
        (user as any).isFallbackCloud = true;
        (user as any).firebaseError = fbErr.message || 'auth/configuration-not-found';
        return user;
      }
      throw fbErr;
    }
  }

  return await registerBuiltinCloud(email, pass, displayName);
}

// User Login
export async function loginAccount(
  email: string, 
  pass: string,
  forceBuiltinCloud: boolean = false
): Promise<UserProfile> {
  // If user explicitly configured Firebase and not forcing built-in cloud, try Firebase
  if (isFirebaseConfigured() && !forceBuiltinCloud) {
    try {
      return await fbLogin(email, pass);
    } catch (fbErr: any) {
      if (fbErr.code === 'auth/configuration-not-found' || fbErr.message?.includes('configuration-not-found') || fbErr.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Auth method not enabled in console, trying built-in cloud sync:', fbErr);
        const user = await loginBuiltinCloud(email, pass);
        (user as any).isFallbackCloud = true;
        (user as any).firebaseError = fbErr.message || 'auth/configuration-not-found';
        return user;
      }
      throw fbErr;
    }
  }

  return await loginBuiltinCloud(email, pass);
}

// Logout
export async function logoutAccount(): Promise<void> {
  if (isFirebaseConfigured()) {
    try {
      await fbLogout();
    } catch (e) {
      console.warn('Firebase logout skipped:', e);
    }
  }
  setSession(null, null);
}

// Cloud Data Sync Operations
export async function fetchCloudData(): Promise<{
  sales: Sale[];
  presets: ProductPreset[];
  settings: AppSettings | null;
} | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/sync/pull', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Error fetching cloud data:', e);
  }
  return null;
}

export async function uploadFullCloudData(
  uid: string,
  sales: Sale[],
  presets: ProductPreset[],
  settings: AppSettings
): Promise<void> {
  if (isUsingFirebaseAuth()) {
    await fbUploadAll(uid, sales, presets, settings);
    return;
  }

  const token = getStoredToken();
  if (!token) return;

  const res = await fetch('/api/sync/push', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ sales, presets, settings })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Error al sincronizar datos');
  }
}

export async function syncSingleSaleToCloud(uid: string, sale: Sale): Promise<void> {
  if (isUsingFirebaseAuth()) {
    await fbSyncSale(uid, sale);
    return;
  }

  const token = getStoredToken();
  if (!token) return;

  try {
    await fetch('/api/sync/sale', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(sale)
    });
  } catch (e) {
    console.warn('Error syncing sale to cloud:', e);
  }
}

export async function deleteSingleSaleFromCloud(uid: string, saleId: string): Promise<void> {
  if (isUsingFirebaseAuth()) {
    await fbDeleteSale(uid, saleId);
    return;
  }

  const token = getStoredToken();
  if (!token) return;

  try {
    await fetch(`/api/sync/sale/${encodeURIComponent(saleId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (e) {
    console.warn('Error deleting sale from cloud:', e);
  }
}

export async function syncPresetToCloud(uid: string, preset: ProductPreset): Promise<void> {
  if (isUsingFirebaseAuth()) {
    await fbSyncPreset(uid, preset);
    return;
  }
  // If connected via cloud API, update presets in store
  const data = await fetchCloudData();
  if (data) {
    const presets = data.presets || [];
    const idx = presets.findIndex((p: any) => p.id === preset.id);
    if (idx >= 0) {
      presets[idx] = preset;
    } else {
      presets.push(preset);
    }
    await uploadFullCloudData(uid, data.sales || [], presets, data.settings || ({} as any));
  }
}

export async function deletePresetFromCloud(uid: string, presetId: string): Promise<void> {
  if (isUsingFirebaseAuth()) {
    await fbDeletePreset(uid, presetId);
    return;
  }
  const data = await fetchCloudData();
  if (data) {
    const presets = (data.presets || []).filter((p: any) => p.id !== presetId);
    await uploadFullCloudData(uid, data.sales || [], presets, data.settings || ({} as any));
  }
}

export async function syncSettingsToCloud(uid: string, settings: AppSettings): Promise<void> {
  if (isUsingFirebaseAuth()) {
    await fbSyncSettings(uid, settings);
    return;
  }
  const data = await fetchCloudData();
  if (data) {
    await uploadFullCloudData(uid, data.sales || [], data.presets || [], settings);
  }
}
