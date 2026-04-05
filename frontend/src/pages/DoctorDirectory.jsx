import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { doctorAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaSearch,
  FaMapMarkerAlt,
  FaPhone,
  FaUserMd,
  FaCalendarAlt,
  FaRupeeSign,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";
import { Link } from "react-router-dom";

function StarRating({ rating, size = "text-sm" }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<FaStar key={i} className={`${size} text-yellow-400`} />);
    else if (rating >= i - 0.5) stars.push(<FaStarHalfAlt key={i} className={`${size} text-yellow-400`} />);
    else stars.push(<FaRegStar key={i} className={`${size} text-gray-300`} />);
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function InteractiveStarRating({ rating, setRating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className="text-2xl transition-transform hover:scale-125"
        >
          {rating >= star ? (
            <FaStar className="text-yellow-400" />
          ) : (
            <FaRegStar className="text-gray-300 hover:text-yellow-300" />
          )}
        </button>
      ))}
    </div>
  );
}

export default function DoctorDirectory() {
  const { loggedIn } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState([]);
  const [cities, setCities] = useState([]);
  const [filters, setFilters] = useState({
    specialization: "",
    city: "",
    search: "",
    sort_by: "avg_rating",
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchDoctors();
    fetchFilters();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchDoctors(), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchFilters = async () => {
    try {
      const [specRes, cityRes] = await Promise.all([
        doctorAPI.getSpecializations(),
        doctorAPI.getCities(),
      ]);
      if (specRes.success) setSpecializations(specRes.data.specializations || []);
      if (cityRes.success) setCities(cityRes.data.cities || []);
    } catch {
      // Filters may fail if no doctors seeded yet
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.city) params.city = filters.city;
      if (filters.search) params.search = filters.search;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      
      const res = await doctorAPI.list(params);
      if (res.success) {
        setDoctors(res.data.doctors || []);
        setTotal(res.data.total || 0);
      }
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const openDoctorDetail = async (doctorId) => {
    try {
      const res = await doctorAPI.get(doctorId);
      if (res.success) {
        setSelectedDoctor(res.data.doctor);
      }
    } catch {
      toast.error("Failed to load doctor details");
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedDoctor) return;
    setSubmitting(true);
    try {
      const res = await doctorAPI.addReview(selectedDoctor._id, {
        rating: reviewRating,
        comment: reviewComment || null,
      });
      if (res.success) {
        toast.success("Review submitted!");
        setShowReviewModal(false);
        setReviewRating(5);
        setReviewComment("");
        openDoctorDetail(selectedDoctor._id);
        fetchDoctors();
      }
    } catch (err) {
      if (err.message?.includes("already reviewed")) {
        try {
          const res = await doctorAPI.updateReview(selectedDoctor._id, {
            rating: reviewRating,
            comment: reviewComment || null,
          });
          if (res.success) {
            toast.success("Review updated!");
            setShowReviewModal(false);
            setReviewRating(5);
            setReviewComment("");
            openDoctorDetail(selectedDoctor._id);
            fetchDoctors();
          }
        } catch {
          toast.error("Failed to update review");
        }
      } else {
        toast.error(err.message || "Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilters({ specialization: "", city: "", search: "", sort_by: "avg_rating" });
  };

  const specColors = {
    Cardiology: "from-red-500 to-pink-500",
    Dermatology: "from-amber-500 to-orange-500",
    Pediatrics: "from-green-500 to-emerald-500",
    Orthopedics: "from-blue-500 to-indigo-500",
    Neurology: "from-purple-500 to-violet-500",
    "General Medicine": "from-teal-500 to-cyan-500",
    Gynecology: "from-pink-500 to-rose-500",
    Ophthalmology: "from-sky-500 to-blue-500",
    Psychiatry: "from-indigo-500 to-purple-500",
    Pulmonology: "from-cyan-500 to-teal-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-[80px] pb-10 px-4 transition-colors duration-300">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-btn2 to-btn1 bg-clip-text text-transparent mb-3">
          Doctor Directory
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Find trusted doctors, read reviews, and book appointments
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-6xl mx-auto mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 dark:border dark:border-gray-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-btn2/50 focus:border-btn2 transition-all dark:bg-gray-700/50 dark:text-gray-100"
            />
          </div>

          <div className="relative">
            <select
              value={filters.specialization}
              onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-btn2/50 focus:border-btn2 transition-all appearance-none bg-white dark:bg-gray-700/50 dark:text-gray-100"
            >
              <option value="">All Specializations</option>
              {specializations.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
          </div>

          <div className="relative">
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-btn2/50 focus:border-btn2 transition-all appearance-none bg-white dark:bg-gray-700/50 dark:text-gray-100"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
          </div>

          <div className="relative">
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-btn2/50 focus:border-btn2 transition-all appearance-none bg-white dark:bg-gray-700/50 dark:text-gray-100"
            >
              <option value="avg_rating">Sort by Rating</option>
              <option value="review_count">Most Reviewed</option>
              <option value="name">Name (A-Z)</option>
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
          </div>
        </div>

        {(filters.search || filters.specialization || filters.city) && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{total} doctor{total !== 1 ? "s" : ""} found</span>
            <button
              onClick={clearFilters}
              className="text-sm text-btn2 hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Doctor Cards */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-btn2 border-t-transparent"></div>
        </div>
      ) : doctors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">🩺</div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Doctors Found</h3>
          <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or check back later.</p>
        </motion.div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor, index) => {
            const gradientClass = specColors[doctor.specialization] || "from-gray-500 to-gray-600";
            return (
              <motion.div
                key={doctor._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => openDoctorDetail(doctor._id)}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${gradientClass}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${gradientClass} flex items-center justify-center text-white text-lg font-bold`}>
                        {doctor.name?.charAt(4) || "D"}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg leading-tight">{doctor.name}</h3>
                        <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r ${gradientClass} text-white`}>
                          {doctor.specialization}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{doctor.qualification}</p>

                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <FaMapMarkerAlt className="text-btn2 text-xs" />
                    <span>{doctor.city}</span>
                    <span className="text-gray-400 mx-1">|</span>
                    <span>{doctor.experience_years} yrs exp</span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <StarRating rating={doctor.avg_rating || 0} />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {doctor.avg_rating?.toFixed(1) || "0.0"}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">({doctor.review_count || 0})</span>
                    </div>
                    {doctor.consultation_fee && (
                      <span className="flex items-center text-sm font-semibold text-green-600">
                        <FaRupeeSign className="text-xs" />
                        {doctor.consultation_fee}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Doctor Detail Modal */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedDoctor(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className={`p-6 bg-gradient-to-r ${specColors[selectedDoctor.specialization] || "from-gray-500 to-gray-600"} text-white rounded-t-2xl relative`}>
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white text-xl"
                >
                  <FaTimes />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {selectedDoctor.name?.charAt(4) || "D"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedDoctor.name}</h2>
                    <p className="text-white/90">{selectedDoctor.specialization}</p>
                    <p className="text-white/80 text-sm">{selectedDoctor.qualification}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FaMapMarkerAlt className="text-btn2" />
                    <span className="text-sm">{selectedDoctor.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FaUserMd className="text-btn2" />
                    <span className="text-sm">{selectedDoctor.experience_years} years experience</span>
                  </div>
                  {selectedDoctor.phone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FaPhone className="text-btn2" />
                      <span className="text-sm">{selectedDoctor.phone}</span>
                    </div>
                  )}
                  {selectedDoctor.consultation_fee && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FaRupeeSign className="text-btn2" />
                      <span className="text-sm font-semibold">{selectedDoctor.consultation_fee} consultation fee</span>
                    </div>
                  )}
                  {selectedDoctor.available_days?.length > 0 && (
                    <div className="col-span-2 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <FaCalendarAlt className="text-btn2" />
                      <span className="text-sm">{selectedDoctor.available_days.join(", ")}</span>
                    </div>
                  )}
                </div>

                {selectedDoctor.bio && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">{selectedDoctor.bio}</p>
                )}

                {/* Rating Summary */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl">
                  <div className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {selectedDoctor.avg_rating?.toFixed(1) || "0.0"}
                  </div>
                  <div>
                    <StarRating rating={selectedDoctor.avg_rating || 0} size="text-lg" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedDoctor.review_count || 0} reviews</p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    {loggedIn && (
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-btn2 to-btn1 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                      >
                        Write Review
                      </button>
                    )}
                    <Link
                      to="/book"
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                    >
                      Book Appointment
                    </Link>
                  </div>
                </div>

                {/* Reviews */}
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-4">Reviews</h3>
                  {selectedDoctor.reviews?.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-6">No reviews yet. Be the first to review!</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedDoctor.reviews?.map((review) => (
                        <div key={review._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-btn2 to-sky-500 flex items-center justify-center text-white text-sm font-bold">
                                {review.user_name?.charAt(0) || "?"}
                              </div>
                              <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{review.user_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} />
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowReviewModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 max-w-md w-full p-6 dark:border dark:border-gray-700"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Write a Review</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{selectedDoctor.name}</p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                <InteractiveStarRating rating={reviewRating} setRating={setReviewRating} />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Comment (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-btn2/50 focus:border-btn2 resize-none transition-all dark:bg-gray-700/50 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-btn2 to-btn1 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
