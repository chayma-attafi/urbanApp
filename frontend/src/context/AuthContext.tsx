import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { AuthResponse, Profile, User, api } from "../lib/api";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; first_name: string; last_name: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = (data: AuthResponse) => {
    setUser(data.user);
    setProfile(data.profile);
  };

  const refresh = async () => {
    try {
      applyAuth(await api.me());
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      setProfile,
      refresh,
      login: async (email, password) => applyAuth(await api.login(email, password)),
      register: async (payload) => { await api.register(payload); },
      logout: async () => {
        await api.logout().catch(() => undefined);
        setUser(null);
        setProfile(null);
      }
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
