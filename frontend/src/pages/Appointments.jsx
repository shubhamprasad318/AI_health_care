import React, { useState, useEffect } from "react";
import DoctorCard from "../components/DoctorCard";
import { FaSearch, FaCalendarCheck, FaFilter, FaMapMarkerAlt, FaUserMd, FaClock, FaCheckCircle, FaTimes, FaSpinner } from "react-icons/fa";
import { doctors } from "../components/DoctorList";
import { toast } from "react-toastify";
import { appointmentAPI } from "../utils/api";

function DoctorRecommend() {
  const [location, setLocation] = useState("");
  const [specialization, setspecialization] = useState("");
  const [myAppointments, setMyAppointments] = useState([]);
  const [showAppointments, setShowAppointments] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const handlespecializationChange = (event) => {
    setspecialization(event.target.value);
  };

  const handleLocationChange = (event) => {
    setLocation(event.target.value);
  };

  const fetchAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const data = await appointmentAPI.getAppointments();
      if (data.success && data.data) {
        setMyAppointments(data.data.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // ✅ CANCEL APPOINTMENT HANDLER
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    setCancellingId(appointmentId);
    try {
      const data = await appointmentAPI.cancelAppointment(appointmentId);
      if (data.success) {
        toast.success("🗓️ Appointment cancelled successfully! You'll receive a confirmation email.", {
          position: "top-center",
          autoClose: 4000,
        });
        fetchAppointments(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.city.toLowerCase().includes(location.toLowerCase()) &&
      doctor.Specialization.toLowerCase().includes(specialization.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen relative font-text bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="w-full h-[400px] bg-gradient-to-r from-btn2 via-sky-500 to-blue-600 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 px-5">
          <div className="text-center max-w-4xl animate-fadeIn">
            <div className="mb-6 flex justify-center">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border-2 border-white/30 animate-bounce-slow">
                <FaUserMd className="text-5xl text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-center drop-shadow-2xl animate-slideDown">
              Find Your Doctor
            </h1>
            <p className="font-semibold text-xl md:text-3xl italic text-white/95 text-center mb-8 drop-shadow-lg animate-slideUp delay-200">
              "Effortless doctor appointments: Book with ease, stay healthy!"
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8 animate-slideUp delay-400">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition-all hover:scale-105">
                <span className="flex items-center gap-2">
                  <FaCalendarCheck className="text-green-300" />
                  <span className="font-semibold">Easy Booking</span>
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition-all hover:scale-105">
                <span className="flex items-center gap-2">
                  <FaUserMd className="text-blue-300" />
                  <span className="font-semibold">Expert Doctors</span>
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 hover:bg-white/30 transition-all hover:scale-105">
                <span className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-purple-300" />
                  <span className="font-semibold">Multiple Locations</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-5 -mt-10 relative z-20 animate-slideUp">
        <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-gray-100 hover:shadow-3xl transition-all duration-300">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FaUserMd className="text-btn2" />
                  Specialization
                </label>
                <select
                  value={specialization}
                  onChange={handlespecializationChange}
                  className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all font-medium text-gray-700 bg-white hover:border-gray-400"
                >
                  <option value="">All Specializations</option>
                  <option value="General Physician">General Physician</option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Gynecologist">Gynecologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="Orthopedic">Orthopedic</option>
                  <option value="Ophthalmologist">Ophthalmologist</option>
                  <option value="Dentist">Dentist</option>
                  <option value="ENT Specialist">ENT Specialist</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-btn2" />
                  Location
                </label>
                <select
                  value={location}
                  onChange={handleLocationChange}
                  className="w-full border-2 border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:border-btn2 focus:ring-4 focus:ring-btn2/20 transition-all font-medium text-gray-700 bg-white hover:border-gray-400"
                >
                  <option value="">All Cities</option>
                  <option value="New Delhi">New Delhi</option>
                  <option value="Gurgaon">Gurgaon</option>
                  <option value="Noida">Noida</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Pune">Pune</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                </select>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <label className="block text-sm font-bold text-gray-700 mb-2 opacity-0 hidden md:block">Actions</label>
              <button
                onClick={() => {
                  setShowAppointments(!showAppointments);
                  if (!showAppointments) {
                    fetchAppointments();
                  }
                }}
                className="w-full md:w-auto bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover:scale-105"
              >
                <FaCalendarCheck />
                {showAppointments ? "Hide Appointments" : "My Appointments"}
                {myAppointments.length > 0 && (
                  <span className="bg-white text-btn2 px-2 py-0.5 rounded-full text-xs font-bold">
                    {myAppointments.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* My Appointments Section */}
      {showAppointments && (
        <div className="max-w-7xl mx-auto px-5 mt-8 mb-8 animate-slideUp">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-100 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl animate-pulse">
                <FaCalendarCheck className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">My Appointments</h2>
                <p className="text-sm text-gray-600">Manage your upcoming and past appointments</p>
              </div>
            </div>

            {isLoadingAppointments ? (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin text-btn2 text-5xl mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading your appointments...</p>
              </div>
            ) : myAppointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                  <FaCalendarCheck className="text-gray-400 text-4xl" />
                </div>
                <p className="text-gray-600 text-lg font-medium">No appointments booked yet.</p>
                <p className="text-gray-500 text-sm mt-2 mb-6">Book your first appointment to get started!</p>
                <button
                  onClick={() => setShowAppointments(false)}
                  className="bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all shadow-lg hover:shadow-xl"
                >
                  Browse Doctors
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAppointments.map((apt, index) => (
                  <div
                    key={apt._id}
                    className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group animate-scaleIn"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-btn2 transition-colors">
                          Dr. {apt.doctorName || apt.doctor_name}
                        </h3>
                        <p className="text-sm text-gray-600 font-semibold bg-white px-3 py-1 rounded-full inline-block">
                          {apt.doctorSpecialization || apt.doctor_specialization}
                        </p>
                      </div>
                      <div className="bg-green-100 p-2 rounded-lg group-hover:scale-110 transition-transform">
                        <FaCheckCircle className="text-green-600 text-xl" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaClock className="text-btn2" />
                        <span className="font-semibold">{apt.date} at {apt.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaMapMarkerAlt className="text-red-500" />
                        <span className="font-medium text-sm">{apt.doctorLocation || apt.doctor_location}, {apt.doctorCity || apt.doctor_city}</span>
                      </div>
                      <div className="pt-3 border-t border-blue-200 flex items-center justify-between">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          (apt.status || "confirmed") === "confirmed" 
                            ? "bg-green-100 text-green-800" 
                            : apt.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {(apt.status || "confirmed").toUpperCase()}
                        </span>
                        {apt.status !== "cancelled" && (
                          <button
                            onClick={() => handleCancelAppointment(apt._id)}
                            disabled={cancellingId === apt._id}
                            className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingId === apt._id ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <FaTimes />
                                Cancel
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Doctors Grid */}
      <div className="max-w-7xl mx-auto px-5 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="animate-slideLeft">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Available Doctors
              </h2>
              <p className="text-gray-600 flex items-center gap-2">
                <FaSearch className="text-btn2" />
                <span className="font-semibold">{filteredDoctors.length}</span> doctors found
                {(specialization || location) && (
                  <span className="text-sm">
                    {specialization && ` in ${specialization}`}
                    {location && `, ${location}`}
                  </span>
                )}
              </p>
            </div>
            {(specialization || location) && (
              <button
                onClick={() => {
                  setSpecialization("");
                  setLocation("");
                }}
                className="text-btn2 hover:text-sky-600 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all"
              >
                <FaTimes />
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {filteredDoctors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-gray-100 animate-scaleIn">
            <FaSearch className="text-gray-300 text-6xl mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 text-xl font-semibold mb-2">No doctors found</p>
            <p className="text-gray-500 mb-6">Try adjusting your filters to see more results</p>
            <button
              onClick={() => {
                setSpecialization("");
                setLocation("");
              }}
              className="bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all shadow-lg hover:shadow-xl"
            >
              Show All Doctors
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor, index) => (
              <div
                key={doctor.id}
                className="animate-slideUp"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both'
                }}
              >
                <DoctorCard
                  name={doctor.name}
                  city={doctor.city}
                  location={doctor.location}
                  Specialization={doctor.Specialization}
                  rating={doctor.rating}
                  experience={doctor.experience}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorRecommend;
