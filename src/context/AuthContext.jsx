// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
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

  const login = (email) => {
    setEmail(email);
    setLoggedIn(true);
  };

  const logout = () => {
    setEmail("");
    setLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ loggedIn, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
