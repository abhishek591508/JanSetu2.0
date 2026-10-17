import { createContext, useContext, useEffect, useState } from "react";
import { getMe, login, logout, signup } from "../api";

const AuthContext = createContext(null);//create a context for authentication and provide the value to the children

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        logout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogin(email, password) {
    await login(email, password);
    const data = await getMe();
    setUser(data.user);
  }

  async function handleSignup(name, email, password) {
    await signup(name, email, password);
  }

  function handleLogout() {
    logout();
    setUser(null);
  }

  const value = { user, loading, handleLogin, handleSignup, handleLogout };

  return (
      <AuthContext.Provider value={value}>
          {children}
      </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}