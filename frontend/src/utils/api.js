/**
 * API Utility Functions
 * Centralized API calls for the application
 * UPDATED: All endpoints match backend routes with proper error handling + JWT Auth
 */

import { authHeaders } from './authToken';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const DEFAULT_TIMEOUT_MS = 30000;

async function apiRequest(endpoint, options = {}) {
  const {
    signal: callerSignal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers: callerHeaders,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timerId = timeoutMs > 0
    ? setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), timeoutMs)
    : null;

  const onCallerAbort = () => controller.abort(callerSignal.reason);
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort(callerSignal.reason);
    } else {
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }
  }

  try {
    const isFormData = fetchOptions.body instanceof FormData;
    const headers = {};
    const method = fetchOptions.method ? fetchOptions.method.toUpperCase() : "GET";
    if (!isFormData && method !== "GET") {
      headers["Content-Type"] = "application/json";
    }
    Object.assign(headers, authHeaders(), callerHeaders);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      credentials: "include",
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = { success: response.ok, status: response.status };
    }

    if (!response.ok) {
      // FastAPI errors carry the reason in `detail`
      const detail = typeof data.detail === "string" ? data.detail : null;
      throw new Error(data.message || detail || `HTTP error! status: ${response.status}`);
    }
    return data;
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      const aborted = callerSignal?.aborted ? "Request cancelled" : `Request timed out after ${timeoutMs}ms`;
      const wrapped = new Error(aborted);
      wrapped.name = error.name;
      console.error(`API Error [${endpoint}]: ${aborted}`);
      throw wrapped;
    }
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  } finally {
    if (timerId !== null) clearTimeout(timerId);
    if (callerSignal) callerSignal.removeEventListener("abort", onCallerAbort);
  }
}

/**
 * Authentication APIs
 */
export const authAPI = {
  login: async (email, password) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  verify2FA: async (email, code, isRecovery = false) => {
    return apiRequest("/auth/2fa/verify-login", {
      method: "POST",
      body: JSON.stringify({ email, code, is_recovery: isRecovery }),
    });
  },

  setup2FA: async () => {
    return apiRequest("/auth/2fa/setup", { method: "POST" });
  },

  verifySetup2FA: async (code) => {
    return apiRequest("/auth/2fa/verify-setup", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  disable2FA: async (code) => {
    return apiRequest("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  },

  get2FAStatus: async () => {
    return apiRequest("/auth/2fa/status", { method: "GET" });
  },

  signup: async (userData) => {
    return apiRequest("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    return apiRequest("/auth/logout", {
      method: "POST",
    });
  },

  // Check authentication status
  checkAuth: async () => {
    return apiRequest("/auth/status", {
      method: "GET",
    });
  },
};

/**
 * Profile APIs
 */
export const profileAPI = {
  getProfile: async () => {
    return apiRequest("/profile", {
      method: "GET",
    });
  },

  updateProfile: async (updateData) => {
    return apiRequest("/profile/update", {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  },
};

/**
 * Disease Prediction APIs
 */
export const predictionAPI = {
  getEvidences: async (language = "en") => {
    return apiRequest(`/predict/evidences?language=${language}`, {
      method: "GET",
    });
  },

  predict: async ({ evidences, age, sex, topK = 5 }) => {
    return apiRequest("/predict/disease", {
      method: "POST",
      body: JSON.stringify({ evidences, age, sex, top_k: topK }),
    });
  },

  predictEnhanced: async ({ evidences, age, sex, topK = 5 }) => {
    return apiRequest("/predict/enhanced", {
      method: "POST",
      body: JSON.stringify({ evidences, age, sex, top_k: topK }),
    });
  },

  getHistory: async (limit = 50) => {
    return apiRequest(`/predictions/history?limit=${limit}`, {
      method: "GET",
    });
  },

  getStatistics: async () => {
    return apiRequest("/predictions/statistics", {
      method: "GET",
    });
  },
};

/**
 * Gemini AI APIs
 */
export const geminiAPI = {
  healthChat: async (message, context = {}) => {
    return apiRequest("/gemini/chat", {
      method: "POST",
      body: JSON.stringify({ message, context }),
    });
  },

  explainMedicalTerm: async (term) => {
    return apiRequest(`/gemini/medical/explain/${encodeURIComponent(term)}`, {
      method: "GET",
    });
  },

  analyzeSymptoms: async (symptomsText) => {
    return apiRequest("/gemini/symptom/analyze", {
      method: "POST",
      body: JSON.stringify({ symptoms: symptomsText }),
    });
  },

  checkDrugInteractions: async (medications) => {
    return apiRequest("/gemini/drugs/interactions", {
      method: "POST",
      body: JSON.stringify({ medications }),
    });
  },

  generateHealthPlan: async () => {
    return apiRequest("/gemini/health/personalized-plan", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  getStatus: async () => {
    return apiRequest("/gemini/status", {
      method: "GET",
    });
  },
};

/**
 * Appointment APIs
 */
export const appointmentAPI = {
  book: async (appointmentData) => {
    return apiRequest("/appointments/book", {
      method: "POST",
      body: JSON.stringify(appointmentData),
    });
  },

  getAppointments: async () => {
    return apiRequest("/appointments", {
      method: "GET",
    });
  },

  cancelAppointment: async (appointmentId) => {
    return apiRequest(`/appointments/${appointmentId}`, {
      method: "DELETE",
    });
  },
};

/**
 * File APIs
 */
export const fileAPI = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest("/files/upload", {
      method: "POST",
      body: formData,
    });
  },

  getFiles: async () => {
    return apiRequest("/files", {
      method: "GET",
    });
  },

  deleteFile: async (fileId) => {
    return apiRequest(`/files/${fileId}`, {
      method: "DELETE",
    });
  },

  getFile: async (fileId) => {
    return apiRequest(`/files/${fileId}`, {
      method: "GET",
    });
  },

  analyzeReport: async (fileId) => {
    return apiRequest(`/files/${fileId}/analysis`, {
      method: "GET",
    });
  },

  viewFile: async (fileId) => {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      credentials: 'include',
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    try {
      window.open(url, '_blank');
    } finally {
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    }
  }
};

/**
 * Contact API
 */
export const contactAPI = {
  submit: async (contactData) => {
    return apiRequest("/contact", {
      method: "POST",
      body: JSON.stringify(contactData),
    });
  },

  // Get contact submissions (admin only)
  getSubmissions: async () => {
    return apiRequest("/contact/submissions", {
      method: "GET",
    });
  },
};

/**
 * LiveKit APIs
 */
export const livekitAPI = {
  getToken: async () => {
    return apiRequest("/livekit/token", {
      method: "POST",
    });
  },

  getStatus: async () => {
    return apiRequest("/livekit/status", {
      method: "GET",
    });
  },
};

/**
 * Medication Tracker APIs
 */
export const medicationAPI = {
  add: async (medicationData) => {
    return apiRequest("/medications", {
      method: "POST",
      body: JSON.stringify(medicationData),
    });
  },

  list: async (active = null) => {
    const params = active !== null ? `?active=${active}` : "";
    return apiRequest(`/medications${params}`, {
      method: "GET",
    });
  },

  get: async (medicationId) => {
    return apiRequest(`/medications/${medicationId}`, {
      method: "GET",
    });
  },

  update: async (medicationId, updateData) => {
    return apiRequest(`/medications/${medicationId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  },

  delete: async (medicationId) => {
    return apiRequest(`/medications/${medicationId}`, {
      method: "DELETE",
    });
  },

  log: async (logData) => {
    return apiRequest("/medications/log", {
      method: "POST",
      body: JSON.stringify(logData),
    });
  },

  getLogs: async (medicationId, days = 30) => {
    return apiRequest(`/medications/${medicationId}/logs?days=${days}`, {
      method: "GET",
    });
  },

  getAdherenceStats: async (days = 30) => {
    return apiRequest(`/medications/adherence/stats?days=${days}`, {
      method: "GET",
    });
  },
};

/**
 * Health Dashboard APIs
 */
export const healthAPI = {
  check: async () => {
    return apiRequest("/health", {
      method: "GET",
    });
  },

  getDashboard: async () => {
    return apiRequest("/health/dashboard", {
      method: "GET",
    });
  },

  getMetrics: async () => {
    return apiRequest("/health/metrics", {
      method: "GET",
    });
  },
};

/**
 * Timeline / Health Journal APIs
 */
export const timelineAPI = {
  getTimeline: async (days = 90, eventType = null, limit = 100) => {
    const params = new URLSearchParams({ days, limit });
    if (eventType) params.append("event_type", eventType);
    return apiRequest(`/timeline?${params}`, { method: "GET" });
  },

  createJournal: async (entryData) => {
    return apiRequest("/timeline/journal", {
      method: "POST",
      body: JSON.stringify(entryData),
    });
  },

  getJournalEntries: async (limit = 50, mood = null) => {
    const params = new URLSearchParams({ limit });
    if (mood) params.append("mood", mood);
    return apiRequest(`/timeline/journal?${params}`, { method: "GET" });
  },

  updateJournal: async (entryId, updateData) => {
    return apiRequest(`/timeline/journal/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  },

  deleteJournal: async (entryId) => {
    return apiRequest(`/timeline/journal/${entryId}`, {
      method: "DELETE",
    });
  },
};

/**
 * Health Report APIs
 */
export const reportAPI = {
  downloadReport: async (days = 90) => {
    const response = await fetch(`${API_BASE_URL}/reports/generate?days=${days}`, {
      credentials: "include",
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error("Failed to generate report");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health_report_${new Date().toISOString().split("T")[0]}.pdf`;
    a.style.display = "none";
    document.body.appendChild(a);
    try {
      a.click();
    } finally {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  },

  getSummary: async (days = 90) => {
    return apiRequest(`/reports/summary?days=${days}`, { method: "GET" });
  },
};

/**
 * Family Profile APIs
 */
export const familyAPI = {
  create: async (profileData) => {
    return apiRequest("/family", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  },

  list: async () => {
    return apiRequest("/family", { method: "GET" });
  },

  get: async (profileId) => {
    return apiRequest(`/family/${profileId}`, { method: "GET" });
  },

  update: async (profileId, updateData) => {
    return apiRequest(`/family/${profileId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  },

  delete: async (profileId) => {
    return apiRequest(`/family/${profileId}`, { method: "DELETE" });
  },

  getSummary: async (profileId) => {
    return apiRequest(`/family/${profileId}/summary`, { method: "GET" });
  },
};

/**
 * Doctor Directory APIs
 */
export const doctorAPI = {
  list: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.specialization) searchParams.append("specialization", params.specialization);
    if (params.city) searchParams.append("city", params.city);
    if (params.search) searchParams.append("search", params.search);
    if (params.min_rating) searchParams.append("min_rating", params.min_rating);
    if (params.sort_by) searchParams.append("sort_by", params.sort_by);
    if (params.limit) searchParams.append("limit", params.limit);
    if (params.skip) searchParams.append("skip", params.skip);
    return apiRequest(`/doctors?${searchParams}`, { method: "GET" });
  },

  get: async (doctorId) => {
    return apiRequest(`/doctors/${doctorId}`, { method: "GET" });
  },

  getSpecializations: async () => {
    return apiRequest("/doctors/specializations", { method: "GET" });
  },

  getCities: async () => {
    return apiRequest("/doctors/cities", { method: "GET" });
  },

  addReview: async (doctorId, reviewData) => {
    return apiRequest(`/doctors/${doctorId}/reviews`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  },

  updateReview: async (doctorId, reviewData) => {
    return apiRequest(`/doctors/${doctorId}/reviews`, {
      method: "PATCH",
      body: JSON.stringify(reviewData),
    });
  },

  deleteReview: async (doctorId) => {
    return apiRequest(`/doctors/${doctorId}/reviews`, { method: "DELETE" });
  },

  seed: async () => {
    return apiRequest("/doctors/seed", { method: "POST" });
  },
};

export const gamificationAPI = {
  getData: async () => {
    return apiRequest("/gamification", { method: "GET" });
  },
};

export const adminAPI = {
  getStats: async () => {
    return apiRequest("/admin/stats", { method: "GET" });
  },

  getUsers: async (search = "", limit = 50, skip = 0) => {
    const params = new URLSearchParams({ limit, skip });
    if (search) params.append("search", search);
    return apiRequest(`/admin/users?${params}`, { method: "GET" });
  },

  getUserDetail: async (userId) => {
    return apiRequest(`/admin/users/${userId}`, { method: "GET" });
  },

  deleteUser: async (userId) => {
    return apiRequest(`/admin/users/${userId}`, { method: "DELETE" });
  },

  getSystemHealth: async () => {
    return apiRequest("/admin/system", { method: "GET" });
  },

  getActivity: async (limit = 20) => {
    return apiRequest(`/admin/activity?limit=${limit}`, { method: "GET" });
  },
};

export const consultationsAPI = {
  list: async (limit = 20, skip = 0) =>
    apiRequest(`/consultations?limit=${limit}&skip=${skip}`, { method: "GET" }),

  get: async (id) =>
    apiRequest(`/consultations/${id}`, { method: "GET" }),

  delete: async (id) =>
    apiRequest(`/consultations/${id}`, { method: "DELETE" }),

  markRecommendationAction: async (id, recommendationIdx, actionType, linkedId = null) =>
    apiRequest(`/consultations/${id}/recommendation-action`, {
      method: "PATCH",
      body: JSON.stringify({
        recommendation_idx: recommendationIdx,
        action_type: actionType,
        linked_id: linkedId,
      }),
    }),
};

/**
 * Notification APIs
 */
export const notificationAPI = {
  list: async (limit = 50, unreadOnly = false) => {
    const params = new URLSearchParams({ limit });
    if (unreadOnly) params.append("unread_only", "true");
    return apiRequest(`/notifications?${params}`, { method: "GET" });
  },

  markRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, { method: "PATCH" });
  },

  markAllRead: async () => {
    return apiRequest("/notifications/read-all", { method: "PATCH" });
  },

  delete: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}`, { method: "DELETE" });
  },
};

/**
 * Utility function to check if user is authenticated
 */
export const checkAuthentication = async () => {
  try {
    const response = await authAPI.checkAuth();
    return response.success;
  } catch (error) {
    return false;
  }
};

/**
 * Utility function to handle file downloads
 */
export const downloadFile = async (fileId, filename) => {
  let url = null;
  let anchor = null;
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      credentials: "include",
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error("Download failed");

    const blob = await response.blob();
    url = window.URL.createObjectURL(blob);
    anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "download";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  } finally {
    if (anchor && anchor.parentNode) anchor.parentNode.removeChild(anchor);
    if (url) window.URL.revokeObjectURL(url);
  }
};

// Export the base apiRequest function for custom calls
export { apiRequest, API_BASE_URL };

// DEFAULT EXPORT: All APIs in one object
export default {
  auth: authAPI,
  profile: profileAPI,
  prediction: predictionAPI,
  gemini: geminiAPI,
  appointment: appointmentAPI,
  file: fileAPI,
  contact: contactAPI,
  health: healthAPI,
  livekit: livekitAPI,
  medication: medicationAPI,
  timeline: timelineAPI,
  report: reportAPI,
  family: familyAPI,
  notification: notificationAPI,
  consultations: consultationsAPI,
  doctor: doctorAPI,
  gamification: gamificationAPI,
  admin: adminAPI,
  checkAuthentication,
  downloadFile,
};
