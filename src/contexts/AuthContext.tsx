import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  user_id: number;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'active' | 'blocked';
}

interface ProfileData {
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
}

interface WalletData {
  form_balance: number;
  total_forms_added: number;
  total_forms_used: number;
}

interface AuthContextType {
  user: UserData | null;
  profile: ProfileData | null;
  wallet: WalletData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('autofill_user');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setUser(data.user);
        setProfile(data.profile);
        setWallet(data.wallet);
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.functions.invoke('auth', {
      body: { action: 'login', email, password },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);

    setUser(data.user);
    setProfile(data.profile);
    setWallet(data.wallet);
    localStorage.setItem('autofill_user', JSON.stringify(data));
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.functions.invoke('auth', {
      body: { action: 'register', email, password, name },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);

    // Auto-login after register
    await login(email, password);
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    setWallet(null);
    localStorage.removeItem('autofill_user');
  };

  const refreshWallet = async () => {
    if (!user) return;
    const { data } = await supabase.functions.invoke('wallet', {
      body: { action: 'get_balance', user_id: user.user_id },
    });
    if (data?.wallet) {
      setWallet(data.wallet);
      const stored = localStorage.getItem('autofill_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.wallet = data.wallet;
        localStorage.setItem('autofill_user', JSON.stringify(parsed));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, wallet, isLoading, login, register, logout, refreshWallet }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
