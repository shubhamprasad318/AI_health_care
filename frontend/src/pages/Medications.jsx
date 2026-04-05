import React, { useState, useEffect } from "react";
import {
  FaPills,
  FaPlus,
  FaClock,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaTrash,
  FaEdit,
  FaChartBar,
  FaBell,
  FaCalendarAlt,
  FaNotesMedical,
  FaHistory,
} from "react-icons/fa";
import { medicationAPI } from "../utils/api";
import { toast } from "react-toastify";

const FREQUENCY_LABELS = {
  once_daily: "Once Daily",
  twice_daily: "Twice Daily",
  three_times: "3 Times/Day",
  four_times: "4 Times/Day",
  every_x_hours: "Every X Hours",
  as_needed: "As Needed",
  weekly: "Weekly",
};

function Medications() {
  const [medications, setMedications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [adherenceStats, setAdherenceStats] = useState(null);
  const [selectedMedLogs, setSelectedMedLogs] = useState(null);
  const [logsData, setLogsData] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "once_daily",
    times: ["08:00"],
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    notes: "",
    reminder_enabled: true,
  });

  useEffect(() => {
    fetchMedications();
    fetchAdherenceStats();
  }, [showActiveOnly]);

  const fetchMedications = async () => {
    setIsLoading(true);
    try {
      const data = await medicationAPI.list(showActiveOnly ? true : null);
      if (data.success) {
        setMedications(data.data?.medications || []);
      }
    } catch (error) {
      console.error("Error fetching medications:", error);
      toast.error("Failed to load medications");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdherenceStats = async () => {
    try {
      const data = await medicationAPI.getAdherenceStats(30);
      if (data.success) {
        setAdherenceStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        end_date: formData.end_date || null,
        notes: formData.notes || null,
      };

      let data;
      if (editingMed) {
        data = await medicationAPI.update(editingMed._id, payload);
      } else {
        data = await medicationAPI.add(payload);
      }

      if (data.success) {
        toast.success(editingMed ? "Medication updated!" : "Medication added!");
        setShowAddForm(false);
        setEditingMed(null);
        resetForm();
        fetchMedications();
        fetchAdherenceStats();
      }
    } catch (error) {
      toast.error(error.message || "Failed to save medication");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      frequency: "once_daily",
      times: ["08:00"],
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      notes: "",
      reminder_enabled: true,
    });
  };

  const handleEdit = (med) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      times: med.times || ["08:00"],
      start_date: med.start_date || "",
      end_date: med.end_date || "",
      notes: med.notes || "",
      reminder_enabled: med.reminder_enabled ?? true,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (medId) => {
    if (!window.confirm("Deactivate this medication?")) return;
    try {
      const data = await medicationAPI.delete(medId);
      if (data.success) {
        toast.success("Medication deactivated");
        fetchMedications();
        fetchAdherenceStats();
      }
    } catch (error) {
      toast.error("Failed to deactivate medication");
    }
  };

  const handleLogMedication = async (medId, skipped = false) => {
    try {
      const data = await medicationAPI.log({
        medication_id: medId,
        skipped,
      });
      if (data.success) {
        toast.success(skipped ? "Marked as skipped" : "Marked as taken!");
        fetchAdherenceStats();
      }
    } catch (error) {
      toast.error("Failed to log medication");
    }
  };

  const handleViewLogs = async (med) => {
    setSelectedMedLogs(med);
    setLogsLoading(true);
    try {
      const data = await medicationAPI.getLogs(med._id, 30);
      if (data.success) {
        setLogsData(data.data?.logs || []);
      }
    } catch (error) {
      toast.error("Failed to load logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const addTimeSlot = () => {
    setFormData({ ...formData, times: [...formData.times, "12:00"] });
  };

  const removeTimeSlot = (index) => {
    if (formData.times.length <= 1) return;
    setFormData({
      ...formData,
      times: formData.times.filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (index, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData({ ...formData, times: newTimes });
  };

  return (
    <div className="w-full min-h-screen font-text bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Hero */}
      <div className="w-full h-[350px] bg-gradient-to-r from-btn2 via-sky-500 to-btn1 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>

        <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 px-5">
          <div className="text-center max-w-4xl animate-fadeIn">
            <div className="mb-6 flex justify-center">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border-2 border-white/30 animate-bounce-slow">
                <FaPills className="text-5xl text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-2xl animate-slideDown">
              Medication Tracker
            </h1>
            <p className="font-semibold text-xl md:text-2xl italic text-white/95 mb-6 drop-shadow-lg animate-slideUp delay-200">
              Track, manage, and never miss a dose
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {adherenceStats && (
        <div className="max-w-7xl mx-auto px-5 -mt-10 relative z-20 animate-slideUp">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-5 border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-lg">
                  <FaPills className="text-white text-lg" />
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Active</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
                {adherenceStats.active_medications}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-5 border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-br from-green-400 to-green-600 p-2 rounded-lg">
                  <FaCheck className="text-white text-lg" />
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Taken</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
                {adherenceStats.total_taken}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-5 border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-br from-red-400 to-red-600 p-2 rounded-lg">
                  <FaTimes className="text-white text-lg" />
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Skipped</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
                {adherenceStats.total_skipped}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-5 border-2 border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-2 rounded-lg">
                  <FaChartBar className="text-white text-lg" />
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Adherence</span>
              </div>
              <p className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">
                {adherenceStats.adherence_percentage}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-5 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowActiveOnly(!showActiveOnly)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                showActiveOnly
                  ? "bg-gradient-to-r from-btn2 to-btn1 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Active Only
            </button>
            <button
              onClick={() => {
                setShowActiveOnly(false);
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                !showActiveOnly
                  ? "bg-gradient-to-r from-btn2 to-btn1 text-white shadow-lg"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              All
            </button>
          </div>

          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingMed(null);
              resetForm();
            }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:from-emerald-600 hover:to-green-500 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105"
          >
            <FaPlus />
            Add Medication
          </button>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-scaleIn dark:border dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <FaPills className="text-btn2" />
                {editingMed ? "Edit Medication" : "Add Medication"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMed(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl py-3 px-4 focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all dark:bg-gray-700/50 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Dosage *
                </label>
                <input
                  type="text"
                  required
                  value={formData.dosage}
                  onChange={(e) =>
                    setFormData({ ...formData, dosage: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl py-3 px-4 focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all dark:bg-gray-700/50 dark:text-gray-100"
                  placeholder="e.g., 500mg"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl py-3 px-4 focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all dark:bg-gray-700/50 dark:text-gray-100"
                >
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Times *
                </label>
                {formData.times.map((time, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      className="flex-1 border-2 border-gray-300 dark:border-gray-600 rounded-xl py-2 px-4 focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all dark:bg-gray-700/50 dark:text-gray-100"
                    />
                    {formData.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="text-btn2 hover:text-sky-600 font-semibold text-sm flex items-center gap-1 mt-1"
                >
                  <FaPlus className="text-xs" />
                  Add Time
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl py-2 px-4 focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all dark:bg-gray-700/50 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl py-2 px-4 focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all dark:bg-gray-700/50 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-xl py-3 px-4 focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all resize-none dark:bg-gray-700/50 dark:text-gray-100"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reminder_enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reminder_enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:ring-4 peer-focus:ring-btn2/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-btn2"></div>
                </label>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <FaBell className="text-btn2" />
                  Enable Reminders
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingMed(null);
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-btn2 to-btn1 text-white py-3 rounded-xl font-bold hover:from-btn1 hover:to-btn2 transition-all shadow-lg hover:shadow-xl"
                >
                  {editingMed ? "Update" : "Add Medication"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {selectedMedLogs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 animate-scaleIn dark:border dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <FaHistory className="text-btn2" />
                {selectedMedLogs.name} - Logs
              </h2>
              <button
                onClick={() => setSelectedMedLogs(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl"
              >
                <FaTimes />
              </button>
            </div>

            {logsLoading ? (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin text-btn2 text-4xl mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading logs...</p>
              </div>
            ) : logsData.length === 0 ? (
              <div className="text-center py-12">
              <FaNotesMedical className="text-gray-300 dark:text-gray-600 text-5xl mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">No logs yet</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                  Start logging your medication intake
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logsData.map((log) => (
                  <div
                    key={log._id}
                    className={`p-4 rounded-xl border-2 ${
                      log.skipped
                        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                        : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.skipped ? (
                          <FaTimes className="text-red-500" />
                        ) : (
                          <FaCheck className="text-green-500" />
                        )}
                        <span className="font-bold text-gray-800 dark:text-gray-100">
                          {log.skipped ? "Skipped" : "Taken"}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.taken_at || log.logged_at).toLocaleString()}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medications List */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {isLoading ? (
          <div className="text-center py-16">
            <FaSpinner className="animate-spin text-btn2 text-5xl mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
              Loading medications...
            </p>
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 border-2 border-gray-100 dark:border-gray-700 animate-scaleIn">
            <FaPills className="text-gray-300 dark:text-gray-600 text-6xl mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-300 text-xl font-semibold mb-2">
              No medications tracked yet
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Add your first medication to start tracking
            </p>
            <button
              onClick={() => {
                setShowAddForm(true);
                resetForm();
                setEditingMed(null);
              }}
              className="bg-gradient-to-r from-btn2 to-btn1 text-white px-6 py-3 rounded-xl font-bold hover:from-btn1 hover:to-btn2 transition-all shadow-lg hover:shadow-xl"
            >
              <FaPlus className="inline mr-2" />
              Add Medication
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medications.map((med, index) => (
              <div
                key={med._id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 border-2 p-6 hover:shadow-xl transition-all duration-300 group animate-scaleIn ${
                  med.active
                    ? "border-gray-100 dark:border-gray-700 hover:border-btn2"
                    : "border-gray-200 dark:border-gray-600 opacity-60"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 group-hover:text-btn2 transition-colors">
                      {med.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold mt-1">
                      {med.dosage}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      med.active
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {med.active ? "Active" : "Inactive"}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FaClock className="text-btn2 text-sm" />
                    <span className="text-sm font-medium">
                      {FREQUENCY_LABELS[med.frequency] || med.frequency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FaCalendarAlt className="text-btn2 text-sm" />
                    <span className="text-sm font-medium">
                      {med.start_date}
                      {med.end_date ? ` → ${med.end_date}` : " → Ongoing"}
                    </span>
                  </div>
                  {med.times && med.times.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {med.times.map((time, i) => (
                        <span
                          key={i}
                          className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg text-xs font-bold"
                        >
                          {time}
                        </span>
                      ))}
                    </div>
                  )}
                  {med.reminder_enabled && (
                    <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                      <FaBell className="text-xs" />
                      <span className="text-xs font-semibold">
                        Reminders On
                      </span>
                    </div>
                  )}
                </div>

                {med.notes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-4 truncate">
                    {med.notes}
                  </p>
                )}

                {med.active && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => handleLogMedication(med._id, false)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl font-bold text-sm hover:from-emerald-600 hover:to-green-500 transition-all flex items-center justify-center gap-1"
                    >
                      <FaCheck />
                      Taken
                    </button>
                    <button
                      onClick={() => handleLogMedication(med._id, true)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-2 rounded-xl font-bold text-sm hover:from-rose-600 hover:to-red-500 transition-all flex items-center justify-center gap-1"
                    >
                      <FaTimes />
                      Skipped
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleViewLogs(med)}
                    className="flex-1 text-btn2 hover:text-sky-600 font-semibold text-sm flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                  >
                    <FaHistory />
                    Logs
                  </button>
                  <button
                    onClick={() => handleEdit(med)}
                    className="flex-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold text-sm flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    <FaEdit />
                    Edit
                  </button>
                  {med.active && (
                    <button
                      onClick={() => handleDelete(med._id)}
                      className="flex-1 text-red-500 hover:text-red-700 font-semibold text-sm flex items-center justify-center gap-1 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                    >
                      <FaTrash />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Medications;
