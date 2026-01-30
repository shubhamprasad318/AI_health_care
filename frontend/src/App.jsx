import React, { Suspense, lazy } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./context/AuthContext";

// ✅ LAZY LOAD PAGES FOR BETTER PERFORMANCE
const HomePage = lazy(() => import("./pages/HomePage"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Chatbot = lazy(() => import("./components/Chatbox"));
const PredictDisease = lazy(() => import("./pages/PredictDisease"));
const Appointments = lazy(() => import("./pages/Appointments"));
const Articles = lazy(() => import("./pages/Articles"));
const Profile = lazy(() => import("./pages/Profile"));
const HealthTools = lazy(() => import("./pages/HealthTools"));
const HealthDashboard = lazy(() => import("./pages/HealthDashboard"));
const PredictionHistoryPage = lazy(() => import("./pages/PredictionHistoryPage"));

// ✅ LOADING COMPONENT
function PageLoader() {
  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-btn2 border-t-transparent mx-auto"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-10 h-10 bg-btn2 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-gray-600 font-semibold text-lg animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

// ✅ PROTECTED ROUTE COMPONENT
function ProtectedRoute({ children }) {
  const { loggedIn } = useAuth();
  return loggedIn ? children : <Navigate to="/login" replace />;
}

// ✅ PUBLIC ROUTE COMPONENT (Redirects if logged in)
function PublicRoute({ children }) {
  const { loggedIn } = useAuth();
  return !loggedIn ? children : <Navigate to="/dashboard" replace />;
}

// ✅ PAGE TRANSITION WRAPPER
function PageTransition({ children }) {
  const location = useLocation();
  
  return (
    <div key={location.pathname} className="animate-fadeIn">
      {children}
    </div>
  );
}

function App() {
  const { loggedIn } = useAuth();

  return (
    <>
      <NavBar />
      
      <Suspense fallback={<PageLoader />}>
        <Chatbot />
        
        <PageTransition>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <HealthDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/predict"
              element={
                <ProtectedRoute>
                  <PredictDisease />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/book"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/article"
              element={
                <ProtectedRoute>
                  <Articles />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/tools"
              element={
                <ProtectedRoute>
                  <HealthTools />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <PredictionHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </Suspense>

      {/* ✅ ENHANCED TOAST CONTAINER */}
      <ToastContainer 
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
        transition={Slide}
        style={{ zIndex: 9999 }}
      />
    </>
  );
}

// ✅ 404 NOT FOUND PAGE
function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-5">
      <div className="text-center animate-scaleIn">
        <div className="text-9xl font-extrabold text-btn2 mb-4 animate-bounce-slow">
          404
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Oops! The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="inline-block bg-gradient-to-r from-btn2 to-sky-500 text-white px-8 py-4 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}

// ✅ IMPORT SLIDE TRANSITION
import { Slide } from "react-toastify";

export default App;
