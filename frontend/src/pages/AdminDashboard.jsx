import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import {
  FaUsers,
  FaChartLine,
  FaCalendarCheck,
  FaPills,
  FaUserDoctor,
  FaFileLines,
  FaBook,
  FaPeopleGroup,
  FaStar,
  FaShieldHalved,
  FaDatabase,
  FaBrain,
  FaRobot,
  FaTrash,
  FaMagnifyingGlass,
  FaArrowRight,
  FaCircleCheck,
  FaCircleXmark,
} from "react-icons/fa6";

const STAT_ICONS = {
  total_users: FaUsers,
  total_predictions: FaChartLine,
  total_appointments: FaCalendarCheck,
  total_medications: FaPills,
  total_doctors: FaUserDoctor,
  total_files: FaFileLines,
  total_journal_entries: FaBook,
  total_family_profiles: FaPeopleGroup,
  total_reviews: FaStar,
};

const STAT_COLORS = {
  total_users: "from-blue-500 to-blue-600",
  total_predictions: "from-purple-500 to-purple-600",
  total_appointments: "from-green-500 to-green-600",
  total_medications: "from-orange-500 to-orange-600",
  total_doctors: "from-cyan-500 to-cyan-600",
  total_files: "from-pink-500 to-pink-600",
  total_journal_entries: "from-indigo-500 to-indigo-600",
  total_family_profiles: "from-teal-500 to-teal-600",
  total_reviews: "from-yellow-500 to-yellow-600",
};

const STAT_LABELS = {
  total_users: "Users",
  total_predictions: "Predictions",
  total_appointments: "Appointments",
  total_medications: "Medications",
  total_doctors: "Doctors",
  total_files: "Files",
  total_journal_entries: "Journal Entries",
  total_family_profiles: "Family Profiles",
  total_reviews: "Reviews",
};

const ACTIVITY_ICONS = {
  prediction: FaChartLine,
  appointment: FaCalendarCheck,
  signup: FaUsers,
};

const ACTIVITY_COLORS = {
  prediction: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
  appointment: "text-green-500 bg-green-100 dark:bg-green-900/30",
  signup: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
};

function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [system, setSystem] = useState(null);
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [activities, setActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, systemRes, activityRes] = await Promise.allSettled([
        apiRequest("/admin/stats"),
        apiRequest("/admin/system"),
        apiRequest("/admin/activity"),
      ]);

      const isForbidden = [statsRes, systemRes, activityRes].some(
        (r) => r.status === "rejected" && r.reason?.message?.includes("403")
      );
      if (isForbidden) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (systemRes.status === "fulfilled" && systemRes.value?.data) {
        setSystem(systemRes.value.data);
      }
      if (activityRes.status === "fulfilled" && activityRes.value?.data) {
        setActivities(activityRes.value.data.activities || []);
      }
    } catch (err) {
      toast.error("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (search = "") => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await apiRequest(`/admin/users${params}`);
      if (res?.data) {
        setUsers(res.data.users || []);
        setUserTotal(res.data.total || 0);
      }
    } catch (err) {
      toast.error("Failed to load users");
    }
  };

  const loadUserDetail = async (userId) => {
    try {
      const res = await apiRequest(`/admin/users/${userId}`);
      if (res?.data) setSelectedUser(res.data);
    } catch (err) {
      toast.error("Failed to load user details");
    }
  };

  const deleteUser = async (userId) => {
    try {
      await apiRequest(`/admin/users/${userId}`, { method: "DELETE" });
      toast.success("User deleted successfully");
      setShowDeleteConfirm(null);
      setSelectedUser(null);
      loadUsers(searchQuery);
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  useEffect(() => {
    if (activeTab === "users") loadUsers();
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers(searchQuery);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr).slice(0, 16);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-btn2 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-semibold">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaShieldHalved className="text-red-500 text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have admin privileges to access this page. Only the platform administrator can view this dashboard.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-gradient-to-r from-btn2 to-btn1 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "system", label: "System" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-10">
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-orange-500 py-12 px-5">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-10 w-32 h-32 bg-white rounded-full animate-blob"></div>
          <div className="absolute bottom-5 right-10 w-24 h-24 bg-white rounded-full animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 font-logo tracking-wide">
            Admin Dashboard
          </h1>
          <p className="text-red-100 text-lg">Platform management & monitoring</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 -mt-6 relative z-10">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-800 text-red-600 shadow-lg"
                  : "bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "overview" && stats && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {Object.entries(stats.overview || {}).map(([key, value]) => {
                  const Icon = STAT_ICONS[key] || FaChartLine;
                  const gradient = STAT_COLORS[key] || "from-gray-500 to-gray-600";
                  const label = STAT_LABELS[key] || key.replace("total_", "").replace("_", " ");
                  return (
                    <div
                      key={key}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center mb-3`}>
                        <Icon className="text-white text-lg" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Activity (30 days)</h3>
                  <div className="space-y-3">
                    {[
                      { label: "New Users", value: stats.recent_activity?.new_users_30d, color: "text-blue-600" },
                      { label: "Predictions", value: stats.recent_activity?.predictions_30d, color: "text-purple-600" },
                      { label: "Appointments", value: stats.recent_activity?.appointments_30d, color: "text-green-600" },
                      { label: "Active Users (7d)", value: stats.recent_activity?.active_users_7d, color: "text-orange-600" },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                        <span className={`font-bold ${item.color}`}>{item.value || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Security</h3>
                  <div className="text-center py-4">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-gray-700" />
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8"
                          strokeDasharray={`${(stats.security?.twofa_percentage || 0) * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                          {stats.security?.twofa_percentage || 0}%
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">2FA Adoption</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {stats.security?.twofa_enabled || 0} of {stats.overview?.total_users || 0} users
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Users ({userTotal})
                  </h3>
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative">
                      <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-btn2 outline-none text-sm w-64"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-btn2 to-sky-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Search
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u._id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => loadUserDetail(u._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {u.name || u.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-purple-600 dark:text-purple-400">
                          {u.prediction_count || 0} predictions
                        </span>
                        <span className="text-green-600 dark:text-green-400">
                          {u.appointment_count || 0} appointments
                        </span>
                        {u.totp_verified && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                            2FA
                          </span>
                        )}
                        <FaArrowRight className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                )}
              </div>

              <AnimatePresence>
                {selectedUser && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
                    onClick={() => { setSelectedUser(null); setShowDeleteConfirm(null); }}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            {selectedUser.name || "No Name"}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                        </div>
                        <button
                          onClick={() => { setSelectedUser(null); setShowDeleteConfirm(null); }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
                        >
                          ×
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {selectedUser.stats && Object.entries(selectedUser.stats).map(([key, val]) => (
                          <div key={key} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{val}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {key.replace("_", " ")}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 mb-6 text-sm">
                        {selectedUser.phone && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Phone: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedUser.phone}</span>
                          </p>
                        )}
                        {selectedUser.gender && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Gender: <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">{selectedUser.gender}</span>
                          </p>
                        )}
                        {selectedUser.blood_type && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Blood Type: <span className="font-medium text-gray-800 dark:text-gray-200">{selectedUser.blood_type}</span>
                          </p>
                        )}
                        <p className="text-gray-600 dark:text-gray-400">
                          2FA: <span className={`font-medium ${selectedUser.totp_verified ? "text-green-600" : "text-gray-500"}`}>
                            {selectedUser.totp_verified ? "Enabled" : "Disabled"}
                          </span>
                        </p>
                        {selectedUser.created_at && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Joined: <span className="font-medium text-gray-800 dark:text-gray-200">{formatDate(selectedUser.created_at)}</span>
                          </p>
                        )}
                      </div>

                      {showDeleteConfirm === selectedUser._id ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                          <p className="text-red-700 dark:text-red-400 font-semibold mb-3">
                            Permanently delete this user and ALL their data?
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => deleteUser(selectedUser._id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(selectedUser._id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                        >
                          <FaTrash /> Delete User
                        </button>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === "system" && system && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Database", value: system.database, icon: FaDatabase, ok: system.database === "connected" },
                  { label: "ML Models", value: system.ml_models, icon: FaBrain, ok: system.ml_models === "loaded" },
                  { label: "Gemini AI", value: system.gemini, icon: FaRobot, ok: system.gemini === "enabled" },
                ].map((svc) => (
                  <div key={svc.label} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <svc.icon className="text-2xl text-gray-400" />
                      {svc.ok ? (
                        <FaCircleCheck className="text-green-500 text-xl" />
                      ) : (
                        <FaCircleXmark className="text-red-500 text-xl" />
                      )}
                    </div>
                    <p className="font-bold text-gray-800 dark:text-gray-100">{svc.label}</p>
                    <p className={`text-sm capitalize ${svc.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {svc.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Collections</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Total: {system.total_documents?.toLocaleString() || 0} documents
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(system.collections || {}).map(([name, count]) => (
                    <div key={name} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3">
                      <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{count}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{name.replace("_", " ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "activity" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {activities.map((act, i) => {
                    const Icon = ACTIVITY_ICONS[act.type] || FaChartLine;
                    const colorClass = ACTIVITY_COLORS[act.type] || "text-gray-500 bg-gray-100 dark:bg-gray-900/30";
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
                            {act.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {act.email} · {formatDate(act.date)}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${colorClass}`}>
                          {act.type}
                        </span>
                      </div>
                    );
                  })}
                  {activities.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                      No recent activity
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
