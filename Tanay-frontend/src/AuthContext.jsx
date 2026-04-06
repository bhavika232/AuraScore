import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("aura_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";
      const res = await axios.post(`${API_URL}/api/login`, { email, password });
      const u = res.data.user;
      setUser(u);
      localStorage.setItem("aura_user", JSON.stringify(u));
      return u;
    } catch (err) {
      throw new Error(err.response?.data?.error || "Login failed");
    }
  };

  const signup = async (name, email, password) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";
      const res = await axios.post(`${API_URL}/api/signup`, { name, email, password });
      const u = res.data.user;
      setUser(u);
      localStorage.setItem("aura_user", JSON.stringify(u));
      return u;
    } catch (err) {
      throw new Error(err.response?.data?.error || "Signup failed");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("aura_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
