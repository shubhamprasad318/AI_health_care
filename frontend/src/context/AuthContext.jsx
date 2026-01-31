// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api";  


const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ CHECK JWT TOKEN ON APP LOAD
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Verify token with backend
      const response = await authAPI.checkAuth();
      
      if (response.success) {
        setLoggedIn(true);
        setUser(response.data?.user);
        setEmail(response.data?.user?.email || localStorage.getItem("email") || "");
      } else {
        // Token invalid, clear everything
        clearAuth();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    // ✅ SAVE TOKEN TO LOCALSTORAGE
    if (token) {
      localStorage.setItem("token", token);
    }
    
    // Save user data
    const userEmail = userData?.email || userData;
    setEmail(userEmail);
    setUser(userData);
    setLoggedIn(true);
    
    // Backward compatibility
    localStorage.setItem("email", userEmail);
    localStorage.setItem("loggedIn", "true");
    
    console.log("✅ User logged in:", userEmail);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
    }
  };

  const clearAuth = () => {
    // ✅ CLEAR TOKEN AND ALL AUTH DATA
    localStorage.removeItem("token");
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("email");
    setEmail("");
    setUser(null);
    setLoggedIn(false);
    console.log("✅ Auth cleared");
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-10 h-10 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 font-semibold text-lg animate-pulse">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ loggedIn, email, user, login, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

