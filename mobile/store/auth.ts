import { create } from 'zustand';
import { clearToken, getToken, requestOtp, signInWithGoogle, verifyOtp } from '../services/api';

type AuthState = {
  token: string | null;
  phone: string;
  loading: boolean;
  hydrated: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  setPhone: (phone: string) => void;
  sendOtp: () => Promise<void>;
  verify: (code: string) => Promise<void>;
  googleSignIn: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  phone: '+251',
  loading: false,
  hydrated: false,
  error: null,
  hydrate: async () => {
    const token = await getToken();
    set({ token, hydrated: true });
  },
  setPhone: (phone) => set({ phone, error: null }),
  sendOtp: async () => {
    set({ loading: true, error: null });
    try {
      await requestOtp(get().phone);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unable to send OTP' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  verify: async (code) => {
    set({ loading: true, error: null });
    try {
      const result = await verifyOtp(get().phone, code);
      set({ token: result.token });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Invalid code' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  googleSignIn: async (idToken) => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithGoogle(idToken);
      set({ token: result.token });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Google sign-in failed' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  logout: async () => {
    await clearToken();
    set({ token: null, phone: '+251', error: null });
  }
}));
