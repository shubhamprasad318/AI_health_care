import React, { Suspense, lazy } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";

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
const VirtualDoctor = lazy(() => import("./pages/VirtualDoctor"));
const Medications = lazy(() => import("./pages/Medications"));
const SymptomTimeline = lazy(() => import("./pages/SymptomTimeline"));
const HealthReport = lazy(() => import("./pages/HealthReport"));
const FamilyProfiles = lazy(() => import("./pages/FamilyProfiles"));
const DoctorDirectory = lazy(() => import("./pages/DoctorDirectory"));
const AppointmentCalendar = lazy(() => import("./pages/AppointmentCalendar"));
const Gamification = lazy(() => import("./pages/Gamification"));
const ExportData = lazy(() => import("./pages/ExportData"));
const TwoFactorSettings = lazy(() => import("./pages/TwoFactorSettings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// Error Boundary for lazy-loaded routes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Route error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-5">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">An unexpected error occurred while loading this page.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-gradient-to-r from-btn2 to-btn1 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-btn2/25 transition-all duration-300"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-btn2/30 dark:border-btn2/20 border-t-btn2 mx-auto"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-10 h-10 bg-gradient-to-br from-btn2 to-btn1 rounded-full animate-pulse shadow-lg shadow-btn2/25"></div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-semibold text-lg animate-pulse">Loading...</p>
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
    <div key={location.pathname} className="animate-fadeIn min-h-screen">
      {children}
    </div>
  );
}

function App() {
  const { loggedIn } = useAuth();
  const { isDark } = useTheme();

  return (
    <>
      <NavBar />
      
      <ErrorBoundary>
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

            <Route
              path="/virtual-doctor"
              element={
                <ProtectedRoute>
                  <VirtualDoctor />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medications"
              element={
                <ProtectedRoute>
                  <Medications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/timeline"
              element={
                <ProtectedRoute>
                  <SymptomTimeline />
                </ProtectedRoute>
              }
            />

            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <HealthReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/family"
              element={
                <ProtectedRoute>
                  <FamilyProfiles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctors"
              element={
                <ProtectedRoute>
                  <DoctorDirectory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <AppointmentCalendar />
                </ProtectedRoute>
              }
            />

            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <Gamification />
                </ProtectedRoute>
              }
            />

            <Route
              path="/export"
              element={
                <ProtectedRoute>
                  <ExportData />
                </ProtectedRoute>
              }
            />

            <Route
              path="/security"
              element={
                <ProtectedRoute>
                  <TwoFactorSettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </Suspense>
      </ErrorBoundary>

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
        theme={isDark ? "dark" : "light"}
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
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-5">
      <div className="text-center animate-scaleIn">
        <div className="text-9xl font-extrabold bg-gradient-to-r from-btn2 to-btn1 bg-clip-text text-transparent mb-4 animate-bounce-slow">
          404
        </div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
          Oops! The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="inline-block bg-gradient-to-r from-btn2 to-btn1 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-btn2/25 transition-all duration-300 hover:scale-105"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}

export default App;
