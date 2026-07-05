import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, saveToken, clearToken, getToken } from "./api";

type User = {
  id: string;
  full_name: string;
  username: string;
  roll_number: string;
  college_id: string;
  course_id: string;
  semester: number;
  role: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = await getToken();
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const r = await api.get("/auth/me");
      setUser(r.data);
    } catch {
      await clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = async (username: string, password: string) => {
    const r = await api.post("/auth/login", { username, password });
    await saveToken(r.data.access_token);
    setUser(r.data.user);
  };

  const register = async (payload: any) => {
    const r = await api.post("/auth/register", payload);
    await saveToken(r.data.access_token);
    setUser(r.data.user);
  };

  const logout = async () => {
    await clearToken();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
