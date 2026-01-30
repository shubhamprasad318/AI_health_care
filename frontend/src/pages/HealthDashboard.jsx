import React, { useState, useEffect } from "react";
import { FaHeartbeat, FaFileMedical, FaCalendarCheck, FaChartBar, FaUser, FaStethoscope, FaCalendarAlt, FaTrophy, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { healthAPI } from "../utils/api";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

function HealthDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await healthAPI.getDashboard();
      if (data.success) {
        setDashboardData(data.data);
      } else {
        toast.error(data.message || "Failed to load dashboard");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load health dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ GET BMI CATEGORY WITH COLOR
  const getBMIStatus = (bmi) => {
    if (!bmi || bmi === "Not set") return { status: "Not Set", color: "gray", bg: "bg-gray-100", text: "text-gray-600" };
    
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return { status: "Invalid", color: "gray", bg: "bg-gray-100", text: "text-gray-600" };
    
    if (bmiValue < 18.5) return { status: "Underweight", color: "#f59e0b", bg: "bg-orange-100", text: "text-orange-700" };
    if (bmiValue < 25) return { status: "Normal", color: "#10b981", bg: "bg-green-100", text: "text-green-700" };
    if (bmiValue < 30) return { status: "Overweight", color: "#f59e0b", bg: "bg-orange-100", text: "text-orange-700" };
    return { status: "Obese", color: "#ef4444", bg: "bg-red-100", text: "text-red-700" };
  };

  // ✅ GET BLOOD PRESSURE STATUS
  const getBPStatus = (bp) => {
    if (!bp || bp === "Not set") return { status: "Not Set", color: "gray", bg: "bg-gray-100", text: "text-gray-600" };
    
    try {
      const [systolic, diastolic] = bp.split("/").map(v => parseInt(v.trim()));
      
      if (systolic < 120 && diastolic < 80) return { status: "Normal", color: "#10b981", bg: "bg-green-100", text: "text-green-700" };
      if (systolic < 130 && diastolic < 80) return { status: "Elevated", color: "#f59e0b", bg: "bg-orange-100", text: "text-orange-700" };
      if (systolic < 140 || diastolic < 90) return { status: "High (Stage 1)", color: "#ef4444", bg: "bg-red-100", text: "text-red-700" };
      return { status: "High (Stage 2)", color: "#dc2626", bg: "bg-red-200", text: "text-red-800" };
    } catch {
      return { status: "Invalid", color: "gray", bg: "bg-gray-100", text: "text-gray-600" };
    }
  };

  // ✅ GET HEALTH SCORE STATUS
  const getHealthScoreStatus = (score) => {
    if (!score) return { status: "Unknown", color: "gray", icon: "❓" };
    if (score >= 85) return { status: "Excellent", color: "#10b981", icon: "🌟" };
    if (score >= 70) return { status: "Good", color: "#3b82f6", icon: "✅" };
    if (score >= 50) return { status: "Fair", color: "#f59e0b", icon: "⚠️" };
    return { status: "Needs Attention", color: "#ef4444", icon: "🚨" };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-btn2 border-t-transparent mx-auto mb-4"></div>
            <FaHeartbeat className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-btn2 text-2xl animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <p className="text-gray-600 text-lg">No data available</p>
        </div>
      </div>
    );
  }

  const { user_profile, health_metrics, health_score, recent_predictions, upcoming_appointments, statistics } = dashboardData;
  
  const bmiStatus = getBMIStatus(health_metrics?.bmi);
  const bpStatus = getBPStatus(health_metrics?.blood_pressure);
  const scoreStatus = getHealthScoreStatus(health_score?.score);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 font-text py-8">
      <div className="max-w-7xl mx-auto px-5">
        {/* Header */}
        <div className="mb-10 animate-fadeIn">
          <div className="bg-gradient-to-r from-btn2 to-sky-500 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h1 className="text-5xl font-bold mb-3 flex items-center gap-3">
                <FaHeartbeat className="animate-pulse" />
                Health Dashboard
              </h1>
              <p className="text-lg text-white/90">
                Welcome back, <span className="font-semibold">{user_profile?.name || "User"}</span>! Here's your comprehensive health overview.
              </p>
            </div>
          </div>
        </div>

        {/* Health Score Card - FEATURED */}
        {health_score && (
          <div className="mb-8 animate-scaleIn">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Score Circle */}
                <div className="relative">
                  <svg className="w-40 h-40 transform -rotate-90">
                    {/* Background Circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke={scoreStatus.color}
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(health_score.score / 100) * 439.6} 439.6`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-5xl font-extrabold" style={{ color: scoreStatus.color }}>
                      {health_score.score}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">/ 100</p>
                  </div>
                </div>

                {/* Score Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{scoreStatus.icon}</span>
                    <div>
                      <h3 className="text-3xl font-extrabold text-gray-800">{scoreStatus.status}</h3>
                      <p className="text-gray-600 font-medium">Health Score Status</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 text-lg leading-relaxed">
                    {health_score.message}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className={`px-4 py-2 rounded-full ${
                      health_score.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {health_score.score >= 70 ? '✓ Above Average' : '⚠️ Needs Improvement'}
                    </span>
                  </div>
                </div>

                {/* Trophy Icon */}
                <div className="hidden lg:block">
                  <FaTrophy className="text-yellow-500 text-6xl drop-shadow-lg animate-bounce-slow" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group animate-slideUp">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-2 font-medium">Total Predictions</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {statistics?.total_predictions || 0}
                </p>
                {statistics?.predictions_last_30_days > 0 && (
                  <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                    <FaArrowUp className="text-xs" />
                    {statistics.predictions_last_30_days} this month
                  </p>
                )}
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <FaStethoscope className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group animate-slideUp delay-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-2 font-medium">Appointments</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  {statistics?.total_appointments || 0}
                </p>
                {statistics?.appointments_last_30_days > 0 && (
                  <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                    <FaArrowUp className="text-xs" />
                    {statistics.appointments_last_30_days} this month
                  </p>
                )}
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <FaCalendarCheck className="text-green-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group animate-slideUp delay-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-2 font-medium">Health Reports</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  {statistics?.total_files || 0}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <FaFileMedical className="text-purple-600 text-2xl" />
              </div>
            </div>
          </div>

          <div className={`rounded-xl shadow-lg p-6 border-2 hover:shadow-2xl hover:scale-105 transition-all duration-300 group animate-slideUp delay-600 ${bmiStatus.bg}`} style={{ borderColor: bmiStatus.color }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-2 font-medium">BMI</p>
                <p className="text-4xl font-bold" style={{ color: bmiStatus.color }}>
                  {health_metrics?.bmi || "N/A"}
                </p>
                <p className={`text-xs font-bold mt-2 ${bmiStatus.text}`}>
                  {bmiStatus.status}
                </p>
              </div>
              <div className="p-4 rounded-xl group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: `${bmiStatus.color}20` }}>
                <FaHeartbeat className="text-2xl" style={{ color: bmiStatus.color }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Health Metrics with Status Indicators */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-slideLeft">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-br from-btn2 to-sky-400 p-2 rounded-lg">
                <FaChartBar className="text-white text-xl" />
              </div>
              Health Metrics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-sky-50 transition-all duration-300 border border-gray-200">
                <span className="text-gray-700 font-medium">📏 Height</span>
                <span className="font-bold text-gray-800 text-lg">
                  {health_metrics?.height ? `${health_metrics.height} cm` : "Not set"}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-sky-50 transition-all duration-300 border border-gray-200">
                <span className="text-gray-700 font-medium">⚖️ Weight</span>
                <span className="font-bold text-gray-800 text-lg">
                  {health_metrics?.weight ? `${health_metrics.weight} kg` : "Not set"}
                </span>
              </div>
              
              {/* Blood Pressure with Status */}
              <div className={`flex justify-between items-center p-4 rounded-lg transition-all duration-300 border-2 ${bpStatus.bg}`} style={{ borderColor: bpStatus.color }}>
                <div>
                  <span className="text-gray-700 font-medium block">❤️ Blood Pressure</span>
                  <span className={`text-xs font-bold ${bpStatus.text}`}>{bpStatus.status}</span>
                </div>
                <span className="font-bold text-lg" style={{ color: bpStatus.color }}>
                  {health_metrics?.blood_pressure || "Not set"}
                </span>
              </div>
              
              {/* BMI with Status */}
              <div className={`flex justify-between items-center p-4 rounded-lg transition-all duration-300 border-2 ${bmiStatus.bg}`} style={{ borderColor: bmiStatus.color }}>
                <div>
                  <span className="text-gray-700 font-medium block">📊 BMI</span>
                  <span className={`text-xs font-bold ${bmiStatus.text}`}>{bmiStatus.status}</span>
                </div>
                <span className="font-bold text-lg" style={{ color: bmiStatus.color }}>
                  {health_metrics?.bmi || "Not set"}
                </span>
              </div>
            </div>
            <Link
              to="/profile"
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
            >
              Update Metrics
              <span>→</span>
            </Link>
          </div>

          {/* Recent Predictions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-slideRight">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-2 rounded-lg">
                <FaStethoscope className="text-white text-xl" />
              </div>
              Recent Predictions
            </h2>
            {recent_predictions && recent_predictions.length > 0 ? (
              <div className="space-y-3">
                {recent_predictions.slice(0, 3).map((pred, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-300"
                  >
                    <p className="text-lg font-bold text-gray-800 mb-1">
                      {pred.ml_prediction || pred.disease}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-400" />
                      {pred.created_at
                        ? new Date(pred.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : "N/A"}
                    </p>
                  </div>
                ))}
                <Link
                  to="/predict"
                  className="block text-center bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-md hover:shadow-lg mt-4"
                >
                  Make New Prediction
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <FaStethoscope className="text-gray-300 text-5xl mx-auto mb-3 animate-pulse" />
                </div>
                <p className="text-gray-500 mb-6 text-lg">No predictions yet</p>
                <Link
                  to="/predict"
                  className="inline-block bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Start Predicting
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        {upcoming_appointments && upcoming_appointments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-400 to-green-600 p-2 rounded-lg">
                  <FaCalendarCheck className="text-white text-xl" />
                </div>
                Upcoming Appointments
              </h2>
              <Link
                to="/book"
                className="text-btn2 hover:text-sky-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
              >
                View All <span>→</span>
              </Link>
            </div>
            <div className="space-y-4">
              {upcoming_appointments.slice(0, 3).map((apt) => (
                <div
                  key={apt._id}
                  className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:from-blue-50 hover:to-sky-50 hover:shadow-md hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800 text-lg mb-1">
                        Dr. {apt.doctor_name || apt.doctorName}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        {apt.specialization || apt.doctorSpecialization}
                      </p>
                    </div>
                    <div className="text-right bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                      <p className="text-sm font-bold text-gray-800">
                        {apt.date}
                      </p>
                      <p className="text-sm text-gray-600">{apt.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Common Issue */}
        {statistics?.most_common_issue && (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg p-6 mb-8 border-2 border-orange-200 animate-scaleIn">
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              Most Common Health Issue
            </h3>
            <p className="text-2xl font-extrabold text-orange-700">
              {statistics.most_common_issue}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-fadeIn">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/predict"
              className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl text-center transition-all duration-300 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg group"
            >
              <div className="bg-blue-500 p-3 rounded-full w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FaStethoscope className="text-white text-2xl" />
              </div>
              <p className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">Predict Disease</p>
            </Link>
            
            <Link
              to="/book"
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl text-center transition-all duration-300 border-2 border-green-200 hover:border-green-400 hover:shadow-lg group"
            >
              <div className="bg-green-500 p-3 rounded-full w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FaCalendarCheck className="text-white text-2xl" />
              </div>
              <p className="font-bold text-gray-800 group-hover:text-green-700 transition-colors">Book Appointment</p>
            </Link>
            
            <Link
              to="/tools"
              className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl text-center transition-all duration-300 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg group"
            >
              <div className="bg-purple-500 p-3 rounded-full w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FaFileMedical className="text-white text-2xl" />
              </div>
              <p className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">Health Tools</p>
            </Link>
            
            <Link
              to="/profile"
              className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl text-center transition-all duration-300 border-2 border-orange-200 hover:border-orange-400 hover:shadow-lg group"
            >
              <div className="bg-orange-500 p-3 rounded-full w-fit mx-auto mb-3 group-hover:scale-110 transition-transform">
                <FaUser className="text-white text-2xl" />
              </div>
              <p className="font-bold text-gray-800 group-hover:text-orange-700 transition-colors">View Profile</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HealthDashboard;
