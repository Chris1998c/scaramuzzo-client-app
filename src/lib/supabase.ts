import 'react-native-url-polyfill/auto';

import { createClient, processLock, type AuthError } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { config } from '@/lib/config';

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const webStorageAdapter = {
  getItem: (key: string) => {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return Promise.resolve(localStorage.getItem(key));
  },
  setItem: (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }

    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }

    return Promise.resolve();
  },
};

const isNative = Platform.OS !== 'web';

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: isNative ? secureStoreAdapter : webStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    ...(isNative ? { lock: processLock } : {}),
  },
});

/** Errori refresh che indicano sessione non recuperabile (logout silenzioso). */
export function isInvalidAuthSessionError(error: AuthError): boolean {
  const message = error.message.toLowerCase();

  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('refresh_token') ||
    (error.status === 400 && message.includes('session'))
  );
}
