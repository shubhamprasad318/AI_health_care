import React, { useState, useEffect } from "react";
import { FaStethoscope, FaCalendarCheck, FaPills, FaBook, FaFilter, FaPlus, FaTimes, FaEdit, FaTrash, FaChevronDown } from "react-icons/fa";
import { timelineAPI } from "../utils/api";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const EVENT_ICONS = {
  prediction: { icon: FaStethoscope, color: "#3b82f6", bg: "from-blue-100 to-blue-200", label: "Prediction" },
  appointment: { icon: FaCalendarCheck, color: "#10b981", bg: "from-green-100 to-green-200", label: "Appointment" },
  medication_log: { icon: FaPills, color: "#8b5cf6", bg: "from-purple-100 to-purple-200", label: "Medication" },
  journal: { icon: FaBook, color: "#f59e0b", bg: "from-amber-100 to-amber-200", label: "Journal" },
};

const SEVERITY_COLORS = {
  low: { dot: "bg-green-400", text: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  medium: { dot: "bg-yellow-400", text: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  high: { dot: "bg-red-400", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  info: { dot: "bg-blue-400", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
};

const MOOD_OPTIONS = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "bad", emoji: "😞", label: "Bad" },
  { value: "terrible", emoji: "😣", label: "Terrible" },
];

function SymptomTimeline() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState(null);
  const [days, setDays] = useState(90);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [journalForm, setJournalForm] = useState({
    title: "", content: "", mood: "", symptoms: "", tags: "", pain_level: "",
  });

  useEffect(() => {
    fetchTimeline();
  }, [filter, days]);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const data = await timelineAPI.getTimeline(days, filter);
      if (data.success) {
        setEvents(data.data.events || []);
      } else {
        toast.error("Failed to load timeline");
      }
    } catch (error) {
      console.error("Timeline error:", error);
      toast.error("Failed to load timeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJournal = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: journalForm.title,
        content: journalForm.content,
        mood: journalForm.mood || null,
        symptoms: journalForm.symptoms ? journalForm.symptoms.split(",").map(s => s.trim()).filter(Boolean) : [],
        tags: journalForm.tags ? journalForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        pain_level: journalForm.pain_level ? parseInt(journalForm.pain_level) : null,
      };

      if (editingEntry) {
        await timelineAPI.updateJournal(editingEntry, payload);
        toast.success("Journal entry updated");
      } else {
        await timelineAPI.createJournal(payload);
        toast.success("Journal entry created");
      }

      setShowJournalModal(false);
      resetForm();
      fetchTimeline();
    } catch (error) {
      toast.error(editingEntry ? "Failed to update entry" : "Failed to create entry");
    }
  };

  const handleDeleteJournal = async (entryId) => {
    if (!window.confirm("Delete this journal entry?")) return;
    try {
      await timelineAPI.deleteJournal(entryId);
      toast.success("Journal entry deleted");
      fetchTimeline();
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const openEditModal = (event) => {
    setEditingEntry(event.id);
    setJournalForm({
      title: event.title || "",
      content: event.details?.content || "",
      mood: event.details?.mood || "",
      symptoms: (event.details?.symptoms || []).join(", "),
      tags: (event.details?.tags || []).join(", "),
      pain_level: event.details?.pain_level != null ? String(event.details.pain_level) : "",
    });
    setShowJournalModal(true);
  };

  const resetForm = () => {
    setJournalForm({ title: "", content: "", mood: "", symptoms: "", tags: "", pain_level: "" });
    setEditingEntry(null);
  };

  const groupEventsByDate = (events) => {
    const groups = {};
    events.forEach((event) => {
      const dateStr = event.date ? event.date.split("T")[0] : "Unknown";
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(event);
    });
    return groups;
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "Unknown") return "Unknown Date";
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
  };

  const grouped = groupEventsByDate(events);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-btn2 border-t-transparent mx-auto mb-4"></div>
            <FaBook className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-btn2 text-2xl animate-pulse" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your health timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-text py-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-5">
        {/* Hero */}
        <div className="mb-8 animate-fadeIn">
          <div className="bg-gradient-to-r from-btn2 to-btn1 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 flex items-center gap-3">
                <FaBook className="animate-pulse" />
                Health Timeline
              </h1>
              <p className="text-lg text-white/90">Track your complete health journey — predictions, appointments, medications, and journal entries.</p>
            </div>
          </div>
        </div>

        {/* Filters + Add Journal */}
        <div className="mb-6 flex flex-wrap items-center gap-3 animate-slideUp">
          <button
            onClick={() => { resetForm(); setShowJournalModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-btn2 to-btn1 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-btn1 hover:to-btn2 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
          >
            <FaPlus /> New Journal Entry
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <FaFilter className="text-gray-400 dark:text-gray-500" />
            <select
              value={filter || ""}
              onChange={(e) => setFilter(e.target.value || null)}
              className="border-2 border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium focus:border-btn2 focus:outline-none transition-colors dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">All Events</option>
              <option value="prediction">Predictions</option>
              <option value="appointment">Appointments</option>
              <option value="medication_log">Medications</option>
              <option value="journal">Journal</option>
            </select>

            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border-2 border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium focus:border-btn2 focus:outline-none transition-colors dark:bg-gray-800 dark:text-gray-100"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>

        {/* Event Type Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slideUp">
          {Object.entries(EVENT_ICONS).map(([type, config]) => {
            const count = events.filter(e => e.type === type).length;
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setFilter(filter === type ? null : type)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  filter === type ? "border-btn2 shadow-lg scale-105" : "border-gray-200 dark:border-gray-700"
                } bg-white dark:bg-gray-800`}
              >
                <div className={`bg-gradient-to-br ${config.bg} p-3 rounded-lg w-fit mb-2`}>
                  <Icon className="text-xl" style={{ color: config.color }} />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{config.label}s</p>
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        {events.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700">
            <FaBook className="text-gray-300 dark:text-gray-600 text-6xl mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">No events yet</h3>
            <p className="text-gray-400 dark:text-gray-500 mb-6">Start tracking your health journey by adding a journal entry or making a prediction.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => { resetForm(); setShowJournalModal(true); }}
                className="bg-gradient-to-r from-btn2 to-btn1 text-white px-6 py-3 rounded-xl font-semibold hover:from-btn1 hover:to-btn2 transition-all shadow-md"
              >
                Add Journal Entry
              </button>
              <Link
                to="/predict"
                className="border-2 border-btn2 text-btn2 px-6 py-3 rounded-xl font-semibold hover:bg-btn2 hover:text-white transition-all"
              >
                Make Prediction
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([dateStr, dateEvents]) => (
              <div key={dateStr} className="animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600"></div>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full whitespace-nowrap">
                    {formatDate(dateStr)}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600"></div>
                </div>

                <div className="relative pl-8 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                  {dateEvents.map((event) => {
                    const typeConfig = EVENT_ICONS[event.type] || EVENT_ICONS.journal;
                    const sevConfig = SEVERITY_COLORS[event.severity] || SEVERITY_COLORS.info;
                    const Icon = typeConfig.icon;

                    return (
                      <div key={event.id} className="relative group">
                        {/* Timeline dot */}
                        <div
                          className="absolute -left-[25px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: typeConfig.color }}
                        ></div>

                        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900/50 border ${sevConfig.border} p-5 hover:shadow-xl transition-all duration-300 hover:scale-[1.01]`}>
                          <div className="flex items-start gap-4">
                            <div className={`bg-gradient-to-br ${typeConfig.bg} p-3 rounded-xl flex-shrink-0`}>
                              <Icon className="text-xl" style={{ color: typeConfig.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sevConfig.bg} ${sevConfig.text}`}>
                                  {typeConfig.label}
                                </span>
                                {event.severity && event.severity !== "info" && (
                                  <span className={`w-2 h-2 rounded-full ${sevConfig.dot}`}></span>
                                )}
                                {event.type === "journal" && event.details?.mood && (
                                  <span className="text-sm">
                                    {MOOD_OPTIONS.find(m => m.value === event.details.mood)?.emoji}
                                  </span>
                                )}
                                {event.type === "journal" && event.details?.pain_level != null && (
                                  <span className="text-xs text-gray-500 font-medium">
                                    Pain: {event.details.pain_level}/10
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 truncate">{event.title}</h3>
                              {event.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p>
                              )}

                              {/* Appointment details */}
                              {event.type === "appointment" && event.details && (
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  {event.details.time && (
                                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                                      🕐 {event.details.time}
                                    </span>
                                  )}
                                  {event.details.location && (
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                                      📍 {event.details.location}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Prediction details */}
                              {event.type === "prediction" && event.details?.symptoms?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {event.details.symptoms.slice(0, 4).map((s, i) => (
                                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                      {s}
                                    </span>
                                  ))}
                                  {event.details.symptoms.length > 4 && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">+{event.details.symptoms.length - 4} more</span>
                                  )}
                                </div>
                              )}

                              {/* Journal tags */}
                              {event.type === "journal" && event.details?.tags?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {event.details.tags.map((tag, i) => (
                                    <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Time */}
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                {event.date ? new Date(event.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
                              </p>
                            </div>

                            {/* Journal actions */}
                            {event.type === "journal" && (
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditModal(event)}
                                  className="p-2 text-gray-400 hover:text-btn2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteJournal(event.id)}
                                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Journal Modal */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn dark:border dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {editingEntry ? "Edit Journal Entry" : "New Journal Entry"}
                </h2>
                <button
                  onClick={() => { setShowJournalModal(false); resetForm(); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaTimes className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateJournal} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={journalForm.title}
                    onChange={(e) => setJournalForm({ ...journalForm, title: e.target.value })}
                    placeholder="How are you feeling today?"
                    className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:border-btn2 focus:outline-none transition-colors dark:bg-gray-700/50 dark:text-gray-100"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Content *</label>
                  <textarea
                    value={journalForm.content}
                    onChange={(e) => setJournalForm({ ...journalForm, content: e.target.value })}
                    placeholder="Describe your symptoms, how you're feeling, any observations..."
                    className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:border-btn2 focus:outline-none transition-colors min-h-[120px] resize-y dark:bg-gray-700/50 dark:text-gray-100"
                    required
                    maxLength={5000}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Mood</label>
                  <div className="flex gap-2">
                    {MOOD_OPTIONS.map((mood) => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setJournalForm({ ...journalForm, mood: journalForm.mood === mood.value ? "" : mood.value })}
                        className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all ${
                          journalForm.mood === mood.value
                            ? "border-btn2 bg-blue-50 dark:bg-blue-950/30 scale-110"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        <span className="text-2xl">{mood.emoji}</span>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Pain Level: {journalForm.pain_level || "Not set"}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={journalForm.pain_level || 0}
                    onChange={(e) => setJournalForm({ ...journalForm, pain_level: e.target.value })}
                    className="w-full accent-btn2"
                  />
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 font-medium">
                    <span>No pain</span>
                    <span>Severe</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Symptoms (comma-separated)</label>
                  <input
                    type="text"
                    value={journalForm.symptoms}
                    onChange={(e) => setJournalForm({ ...journalForm, symptoms: e.target.value })}
                    placeholder="headache, fatigue, nausea"
                    className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:border-btn2 focus:outline-none transition-colors dark:bg-gray-700/50 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={journalForm.tags}
                    onChange={(e) => setJournalForm({ ...journalForm, tags: e.target.value })}
                    placeholder="diet, exercise, sleep"
                    className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:border-btn2 focus:outline-none transition-colors dark:bg-gray-700/50 dark:text-gray-100"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-btn2 to-btn1 text-white py-3 rounded-xl font-bold hover:from-btn1 hover:to-btn2 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {editingEntry ? "Update Entry" : "Save Entry"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowJournalModal(false); resetForm(); }}
                    className="px-6 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SymptomTimeline;
