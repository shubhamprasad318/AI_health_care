/**
 * API Utility Functions
 * Centralized API calls for the application
 * UPDATED: All endpoints match backend routes with proper error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Make authenticated API request with enhanced error handling
 */
async function apiRequest(endpoint, options = {}) {
  try {
    // Don't set Content-Type for FormData, let browser set it with boundary
    const isFormData = options.body instanceof FormData;
    
    const defaultOptions = {
      credentials: "include", // Always include cookies for session management
      headers: isFormData
        ? {} // Let browser set Content-Type for FormData
        : {
            "Content-Type": "application/json",
            ...options.headers,
          },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    });

    // Handle different response types
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // For file downloads or other non-JSON responses
      data = { success: response.ok, status: response.status };
    }
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    // Enhanced error logging
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
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

  // ✅ NEW: Check authentication status
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

  // ✅ NEW: Update profile picture
  updateProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append("profile_picture", file);
    
    return apiRequest("/profile/picture", {
      method: "POST",
      body: formData,
    });
  },
};

/**
 * Disease Prediction APIs
 */
export const predictionAPI = {
  predict: async (symptoms) => {
    return apiRequest("/predict/disease", {
      method: "POST",
      body: JSON.stringify({ symptoms }),
    });
  },

  predictEnhanced: async (symptoms, options = {}) => {
    return apiRequest("/predict/enhanced", {
      method: "POST",
      body: JSON.stringify({ symptoms, ...options }),
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

  // ✅ NEW: Delete prediction from history
  deletePrediction: async (predictionId) => {
    return apiRequest(`/predictions/${predictionId}`, {
      method: "DELETE",
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

  // ✅ NEW: Cancel appointment
  cancelAppointment: async (appointmentId) => {
    return apiRequest(`/appointments/${appointmentId}/cancel`, {
      method: "POST",
    });
  },

  // ✅ NEW: Reschedule appointment
  rescheduleAppointment: async (appointmentId, newDate, newTime) => {
    return apiRequest(`/appointments/${appointmentId}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify({ date: newDate, time: newTime }),
    });
  },

  // ✅ NEW: Get appointment by ID
  getAppointment: async (appointmentId) => {
    return apiRequest(`/appointments/${appointmentId}`, {
      method: "GET",
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

  // ✅ NEW: Get file by ID (returns download URL)
  getFile: async (fileId) => {
    return apiRequest(`/files/${fileId}`, {
      method: "GET",
    });
  },

  // ✅ NEW: Analyze medical report with AI
  analyzeReport: async (fileId) => {
    return apiRequest(`/files/${fileId}/analysis`, {
      method: "GET",
    });
  },
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

  // ✅ NEW: Get contact submissions (admin only)
  getSubmissions: async () => {
    return apiRequest("/contact/submissions", {
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

  // ✅ NEW: Get health metrics only
  getMetrics: async () => {
    return apiRequest("/health/metrics", {
      method: "GET",
    });
  },
};

/**
 * Articles/Blog APIs (if you implement them)
 */
export const articleAPI = {
  getArticles: async (limit = 10, offset = 0) => {
    return apiRequest(`/articles?limit=${limit}&offset=${offset}`, {
      method: "GET",
    });
  },

  getArticle: async (articleId) => {
    return apiRequest(`/articles/${articleId}`, {
      method: "GET",
    });
  },

  searchArticles: async (query) => {
    return apiRequest(`/articles/search?q=${encodeURIComponent(query)}`, {
      method: "GET",
    });
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
  try {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      credentials: "include",
    });
    
    if (!response.ok) throw new Error("Download failed");
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};

// Export the base apiRequest function for custom calls
export { apiRequest, API_BASE_URL };

// ✅ DEFAULT EXPORT: All APIs in one object
export default {
  auth: authAPI,
  profile: profileAPI,
  prediction: predictionAPI,
  gemini: geminiAPI,
  appointment: appointmentAPI,
  file: fileAPI,
  contact: contactAPI,
  health: healthAPI,
  article: articleAPI,
  checkAuthentication,
  downloadFile,
};
