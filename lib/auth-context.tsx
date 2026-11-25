"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser;
  login: (email: string, name: string, role: "student" | "teacher" | "admin") => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const DEFAULT_DEMO_USER: AuthUser = {
  id: "usr-aarav",
  name: "Aarav Sharma",
  email: "aarav@gyansetu.edu.in",
  role: "student",
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_DEMO_USER,
  login: () => {},
  logout: () => {},
  isAuthenticated: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(DEFAULT_DEMO_USER);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("gyansetu_user");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const login = (email: string, name: string, role: "student" | "teacher" | "admin") => {
    const newUser: AuthUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: name.trim() || email.split("@")[0],
      email,
      role,
    };
    setUser(newUser);
    try {
      localStorage.setItem("gyansetu_user", JSON.stringify(newUser));
    } catch {
      // ignore
    }
  };

  const logout = () => {
    setUser(DEFAULT_DEMO_USER);
    try {
      localStorage.removeItem("gyansetu_user");
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
