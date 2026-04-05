import React, { useState, useEffect, useMemo } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaUserMd, FaClock, FaMapMarkerAlt, FaTimes, FaSpinner, FaCalendarCheck, FaCalendarDay, FaList } from "react-icons/fa";
import { toast } from "react-toastify";
import { appointmentAPI } from "../utils/api";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const STATUS_COLORS = {
  confirmed: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", dot: "bg-green-500" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", dot: "bg-yellow-500" },
  cancelled: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", dot: "bg-red-500" },
  completed: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", dot: "bg-blue-500" },
};

function AppointmentCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState("month"); // month | list
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentAPI.getAppointments();
      if (data.success && data.data) {
        setAppointments(data.data.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(appointmentId);
    try {
      const data = await appointmentAPI.cancelAppointment(appointmentId);
      if (data.success) {
        toast.success("Appointment cancelled successfully!");
        setSelectedAppointment(null);
        fetchAppointments();
      } else {
        toast.error(data.message || "Failed to cancel appointment");
      }
    } catch (error) {
      toast.error("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(formatDate(new Date()));
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Map appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments.forEach((apt) => {
      const date = apt.date;
      if (!date) return;
      // Normalize date format (handle "2025-04-02", "02/04/2025", etc.)
      let normalized = date;
      if (date.includes("/")) {
        const parts = date.split("/");
        if (parts[2] && parts[2].length === 4) {
          normalized = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
      if (!map[normalized]) map[normalized] = [];
      map[normalized].push(apt);
    });
    return map;
  }, [appointments]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = formatDate(now);
    return {
      total: appointments.length,
      upcoming: appointments.filter((a) => a.date >= todayStr && a.status !== "cancelled").length,
      thisMonth: appointments.filter((a) => {
        if (!a.date) return false;
        return a.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`);
      }).length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
    };
  }, [appointments, year, month]);

  const todayStr = formatDate(new Date());

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days = [];

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = formatDate(new Date(year, month - 1, day));
      days.push({ day, date, isCurrentMonth: false, isToday: date === todayStr });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(new Date(year, month, day));
      days.push({ day, date, isCurrentMonth: true, isToday: date === todayStr });
    }

    // Next month leading days
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const date = formatDate(new Date(year, month + 1, day));
      days.push({ day, date, isCurrentMonth: false, isToday: date === todayStr });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, daysInPrevMonth, todayStr]);

  // Filtered list for selected date
  const selectedDateAppointments = selectedDate ? (appointmentsByDate[selectedDate] || []) : [];

  // List view — all appointments sorted by date
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      if (a.date === b.date) return (a.time || "").localeCompare(b.time || "");
      return (b.date || "").localeCompare(a.date || "");
    });
  }, [appointments]);

  const getStatus = (apt) => apt.status || "confirmed";
  const getStatusColor = (apt) => STATUS_COLORS[getStatus(apt)] || STATUS_COLORS.pending;

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
            <div className="mb-4 flex justify-center">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border-2 border-white/30">
                <FaCalendarAlt className="text-5xl text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-2xl animate-slideDown">
              Appointment Calendar
            </h1>
            <p className="font-semibold text-xl md:text-2xl text-white/90 animate-slideUp">
              View and manage all your appointments at a glance
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 -mt-8 relative z-20">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slideUp">
          {[
            { label: "Total", value: stats.total, icon: FaCalendarAlt, color: "from-blue-500 to-blue-600" },
            { label: "Upcoming", value: stats.upcoming, icon: FaCalendarCheck, color: "from-green-500 to-green-600" },
            { label: "This Month", value: stats.thisMonth, icon: FaCalendarDay, color: "from-purple-500 to-purple-600" },
            { label: "Cancelled", value: stats.cancelled, icon: FaTimes, color: "from-red-500 to-red-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-5 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3">
                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View Toggle + Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900/50 p-1 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                viewMode === "month"
                  ? "bg-gradient-to-r from-btn2 to-btn1 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FaCalendarAlt /> Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                viewMode === "list"
                  ? "bg-gradient-to-r from-btn2 to-btn1 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <FaList /> List
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/book"
              className="bg-gradient-to-r from-btn2 to-btn1 text-white px-5 py-2.5 rounded-xl font-bold hover:from-btn1 hover:to-btn2 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm flex items-center gap-2"
            >
              <FaCalendarCheck /> Book Appointment
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <FaSpinner className="animate-spin text-btn2 text-5xl mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your appointments...</p>
          </div>
        ) : viewMode === "month" ? (
          /* Calendar View */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden mb-12 animate-fadeIn">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-btn2 to-btn1 p-5 flex items-center justify-between text-white">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-white/20 transition-all"
              >
                <FaChevronLeft className="text-lg" />
              </button>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{MONTHS[month]} {year}</h2>
                <button
                  onClick={goToToday}
                  className="text-xs mt-1 bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-all font-medium"
                >
                  Today
                </button>
              </div>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-white/20 transition-all"
              >
                <FaChevronRight className="text-lg" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              {WEEKDAYS.map((day) => (
                <div key={day} className="text-center py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((dayObj, idx) => {
                const dayAppointments = appointmentsByDate[dayObj.date] || [];
                const isSelected = selectedDate === dayObj.date;
                const hasAppointments = dayAppointments.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(isSelected ? null : dayObj.date)}
                    className={`min-h-[90px] md:min-h-[110px] p-2 border-b border-r border-gray-100 dark:border-gray-700 cursor-pointer transition-all relative group
                      ${!dayObj.isCurrentMonth ? "bg-gray-50/50 dark:bg-gray-900/50" : "bg-white dark:bg-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"}
                      ${dayObj.isToday ? "ring-2 ring-inset ring-btn2" : ""}
                      ${isSelected ? "bg-blue-50 dark:bg-blue-950/30 ring-2 ring-inset ring-blue-400" : ""}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                          ${!dayObj.isCurrentMonth ? "text-gray-300 dark:text-gray-600" : "text-gray-700 dark:text-gray-200"}
                          ${dayObj.isToday ? "bg-btn2 text-white" : ""}
                        `}
                      >
                        {dayObj.day}
                      </span>
                      {hasAppointments && (
                        <span className="text-xs font-bold text-btn2 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded-full">
                          {dayAppointments.length}
                        </span>
                      )}
                    </div>

                    {/* Appointment dots/previews */}
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map((apt, i) => {
                        const sc = getStatusColor(apt);
                        return (
                          <div
                            key={i}
                            className={`text-xs px-1.5 py-0.5 rounded ${sc.bg} ${sc.text} truncate font-medium hidden md:block`}
                          >
                            Dr. {apt.doctorName || apt.doctor_name}
                          </div>
                        );
                      })}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium hidden md:block">
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                      {/* Mobile dots */}
                      <div className="flex gap-1 md:hidden flex-wrap">
                        {dayAppointments.slice(0, 3).map((apt, i) => {
                          const sc = getStatusColor(apt);
                          return <div key={i} className={`w-2 h-2 rounded-full ${sc.dot}`} />;
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Date Details */}
            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t-2 border-blue-200 dark:border-blue-800 overflow-hidden"
                >
                  <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white dark:from-gray-800 dark:to-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h3>
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    {selectedDateAppointments.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No appointments on this date</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedDateAppointments.map((apt) => {
                          const sc = getStatusColor(apt);
                          return (
                            <div
                              key={apt._id}
                              onClick={() => setSelectedAppointment(apt)}
                              className={`p-4 rounded-xl border-2 ${sc.border} ${sc.bg} cursor-pointer hover:shadow-md transition-all`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-800 dark:text-gray-100">
                                  Dr. {apt.doctorName || apt.doctor_name}
                                </h4>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                                  {getStatus(apt).toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <FaClock className="text-btn2" />
                                {apt.time}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <FaMapMarkerAlt className="text-red-500" />
                                {apt.doctorLocation || apt.doctor_location}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* List View */
          <div className="mb-12 animate-fadeIn">
            {sortedAppointments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-12 text-center border border-gray-100 dark:border-gray-700">
                <FaCalendarAlt className="text-gray-300 dark:text-gray-600 text-6xl mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Appointments</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't booked any appointments yet.</p>
                <Link
                  to="/book"
                  className="bg-gradient-to-r from-btn2 to-btn1 text-white px-6 py-3 rounded-xl font-bold hover:from-btn1 hover:to-btn2 transition-all shadow-lg"
                >
                  Book Your First Appointment
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAppointments.map((apt, index) => {
                  const sc = getStatusColor(apt);
                  const isPast = apt.date < todayStr;
                  return (
                    <motion.div
                      key={apt._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-gray-900/50 border-2 ${sc.border} p-5 flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer hover:shadow-xl transition-all ${
                        isPast ? "opacity-70" : ""
                      }`}
                    >
                      {/* Date Badge */}
                      <div className="bg-gradient-to-br from-btn2 to-btn1 text-white rounded-xl p-3 text-center min-w-[70px]">
                        <p className="text-2xl font-bold leading-none">
                          {apt.date ? new Date(apt.date + "T00:00:00").getDate() : "-"}
                        </p>
                        <p className="text-xs font-medium uppercase mt-1">
                          {apt.date ? MONTHS[new Date(apt.date + "T00:00:00").getMonth()]?.slice(0, 3) : ""}
                        </p>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FaUserMd className="text-btn2" />
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                            Dr. {apt.doctorName || apt.doctor_name}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {apt.doctorSpecialization || apt.doctor_specialization}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FaClock className="text-btn2" /> {apt.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaMapMarkerAlt className="text-red-500" />
                            {apt.doctorLocation || apt.doctor_location}{apt.doctorCity || apt.doctor_city ? `, ${apt.doctorCity || apt.doctor_city}` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <span className={`px-4 py-2 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                        {getStatus(apt).toUpperCase()}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 mb-12">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3">Status Legend</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(STATUS_COLORS).map(([status, colors]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5"
            onClick={() => setSelectedAppointment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-btn2 to-btn1 p-6 text-white relative">
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white p-1"
                >
                  <FaTimes className="text-lg" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <FaUserMd className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Dr. {selectedAppointment.doctorName || selectedAppointment.doctor_name}
                    </h2>
                    <p className="text-white/80 font-medium">
                      {selectedAppointment.doctorSpecialization || selectedAppointment.doctor_specialization}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Date</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <FaCalendarAlt className="text-btn2" />
                      {selectedAppointment.date}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Time</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <FaClock className="text-btn2" />
                      {selectedAppointment.time}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Location</p>
                  <p className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-red-500" />
                    {selectedAppointment.doctorLocation || selectedAppointment.doctor_location}
                    {(selectedAppointment.doctorCity || selectedAppointment.doctor_city) &&
                      `, ${selectedAppointment.doctorCity || selectedAppointment.doctor_city}`}
                  </p>
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Status</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        getStatusColor(selectedAppointment).bg
                      } ${getStatusColor(selectedAppointment).text}`}
                    >
                      {getStatus(selectedAppointment).toUpperCase()}
                    </span>
                  </div>
                  {selectedAppointment.created_at && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Booked On</p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {new Date(selectedAppointment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {getStatus(selectedAppointment) !== "cancelled" && (
                  <button
                    onClick={() => handleCancelAppointment(selectedAppointment._id)}
                    disabled={cancellingId === selectedAppointment._id}
                    className="w-full py-3 rounded-xl font-bold text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {cancellingId === selectedAppointment._id ? (
                      <>
                        <FaSpinner className="animate-spin" /> Cancelling...
                      </>
                    ) : (
                      <>
                        <FaTimes /> Cancel Appointment
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AppointmentCalendar;
