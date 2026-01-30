// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// ✅ FIX: Export AuthProvider as default
export default function AuthProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(() => {
    return localStorage.getItem("loggedIn") === "true";
  });

  const [email, setEmail] = useState(() => {
    return localStorage.getItem("email") || "";
  });

  useEffect(() => {
    localStorage.setItem("loggedIn", loggedIn);
  }, [loggedIn]);

  useEffect(() => {
    localStorage.setItem("email", email);
  }, [email]);

  const login = (userEmail) => {
    setEmail(userEmail);
    setLoggedIn(true);
  };

  const logout = async () => {
    try {
      const { authAPI } = await import("../utils/api");
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setEmail("");
      setLoggedIn(false);
      // Clear all auth-related localStorage
      localStorage.removeItem("loggedIn");
      localStorage.removeItem("email");
    }
  };

  return (
    <AuthContext.Provider value={{ loggedIn, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ FIX: Export useAuth as named export (after the component)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
