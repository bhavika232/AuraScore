import { createContext, useContext, useState, useEffect } from "react";

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
    // Mock auth — swap with real API call
    await new Promise(r => setTimeout(r, 900));
    if (!email || !password) throw new Error("Invalid credentials");
    const u = { id: "usr_001", email, name: email.split("@")[0], avatar: null, joinedAt: new Date().toISOString() };
    setUser(u);
    localStorage.setItem("aura_user", JSON.stringify(u));
    return u;
  };

  const signup = async (name, email, password) => {
    await new Promise(r => setTimeout(r, 900));
    if (!name || !email || !password) throw new Error("All fields required");
    const u = { id: "usr_" + Date.now(), email, name, avatar: null, joinedAt: new Date().toISOString() };
    setUser(u);
    localStorage.setItem("aura_user", JSON.stringify(u));
    return u;
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
