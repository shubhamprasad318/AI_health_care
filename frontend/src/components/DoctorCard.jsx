import { Link } from "react-router-dom";
import { useState } from "react";
import { FaUserMd, FaClock, FaCalendarAlt, FaEnvelope, FaTimes, FaCheckCircle, FaStar, FaMapMarkerAlt, FaAward } from "react-icons/fa";
import { toast } from "react-toastify";
import { appointmentAPI } from "../utils/api";

function DoctorCard({
  name,
  Specialization,
  city,
  location,
  image,
  experience,
}) {
  const [openModal, setOpenModal] = useState(false);
  const handleModalClose = () => {
    setOpenModal(false);
  };

  const [appointmentDetails, setAppointmentDetails] = useState({
    name: "",
    email: "",
    date: "",
    time: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentDetails({
      ...appointmentDetails,
      [name]: value,
    });
  };

  const handleBookAppointment = async () => {
    try {
      const result = await appointmentAPI.book({
        ...appointmentDetails,
        doctorName: name,
        doctorSpecialization: Specialization,
        doctorCity: city,
        doctorLocation: location,
      });
      
      if (result.success) {
        toast.success("Appointment booked successfully!");
        setOpenModal(false);
        setConfirmationModalOpen(true);
      } else {
        toast.error(result.message || "Failed to book the appointment. Please try again.");
      }
    } catch (error) {
      console.error("Appointment booking error:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const handleConfirmAppointment = () => {
    setConfirmationModalOpen(false);
    setOpenModal(false);
    toast.success("Appointment booked successfully!");
  };

  const handleConfirmationModalClose = () => {
    setConfirmationModalOpen(false);
    setOpenModal(true);
  };

  return (
    <>
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-xl border-2 border-gray-200 hover:border-btn2 hover:shadow-2xl transition-all duration-500 overflow-hidden group animate-slideUp">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/40 to-purple-200/40 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-sky-200/40 to-blue-200/40 rounded-full -ml-32 -mb-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
        </div>
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-btn2/0 via-sky-500/0 to-blue-600/0 group-hover:from-btn2/8 group-hover:via-sky-500/8 group-hover:to-blue-600/8 transition-all duration-500"></div>
        
        <div className="relative z-10 p-6">
          {/* Header Section with Animation */}
          <div className="flex gap-4 mb-4 transform group-hover:scale-105 transition-transform duration-300">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-btn2 to-sky-500 rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
              <img
                src="https://assets-global.website-files.com/6426543485efe6a5ade36f21/64eeb730f28ad152d8d18244_Introducing-Dr.-Carewise--Your-Empathetic-3D-Animated-Doctor-gigapixel-standard-scale-6_00x.jpg"
                alt={name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-gray-100 group-hover:border-btn2 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:rotate-3 transform"
              />
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-green-400 to-green-600 w-7 h-7 rounded-full border-4 border-white shadow-lg animate-pulse group-hover:scale-110 transition-transform"></div>
            </div>
            <div className="flex-1">
              <h5 className="text-xl font-extrabold text-gray-800 mb-2 group-hover:text-btn2 transition-colors duration-300 transform group-hover:translate-x-1">
                {name}
              </h5>
              <div className="bg-gradient-to-r from-btn2 via-sky-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold inline-block mb-2 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                {Specialization}
              </div>
              <div className="flex items-center gap-1 text-yellow-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <FaStar 
                    key={i} 
                    className="text-sm group-hover:scale-110 transition-transform duration-300"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  />
                ))}
                <span className="text-gray-600 text-xs ml-1 font-semibold group-hover:text-gray-800 transition-colors">5.0</span>
              </div>
            </div>
          </div>
          
          {/* Info Section with Animated Icons */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-700 bg-white/80 backdrop-blur-sm p-3 rounded-xl border-2 border-gray-200 group-hover:bg-white group-hover:border-red-300 group-hover:shadow-md transition-all duration-300 transform group-hover:translate-x-1">
              <div className="bg-gradient-to-br from-red-100 to-red-200 p-2.5 rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm">
                <FaMapMarkerAlt className="text-red-600 text-lg" />
              </div>
              <span className="font-medium text-sm group-hover:font-semibold transition-all">{city}, {location}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 bg-white/80 backdrop-blur-sm p-3 rounded-xl border-2 border-gray-200 group-hover:bg-white group-hover:border-yellow-300 group-hover:shadow-md transition-all duration-300 transform group-hover:translate-x-1">
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-2.5 rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm">
                <FaAward className="text-yellow-600 text-lg" />
              </div>
              <span className="font-medium text-sm group-hover:font-semibold transition-all">{experience} years of experience</span>
            </div>
          </div>

          {/* Animated Button */}
          <button
            onClick={() => setOpenModal(true)}
            className="w-full bg-gradient-to-r from-btn2 via-sky-500 to-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:from-blue-600 hover:via-sky-500 hover:to-btn2 transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 group-hover:scale-105 transform relative overflow-hidden"
          >
            {/* Button Shine Effect */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            <FaCalendarAlt className="relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10">Book Appointment</span>
          </button>
        </div>
        
        {/* Decorative Corner Element */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-btn2/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-sky-500/10 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
        {openModal && (
          <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white p-8 md:p-10 rounded-3xl w-full max-w-2xl shadow-2xl border-4 border-gray-100 animate-slideUp relative">
              <button
                onClick={handleModalClose}
                className="absolute top-6 right-6 text-gray-400 hover:text-red-500 text-4xl font-bold w-12 h-12 flex items-center justify-center rounded-full hover:bg-red-50 transition-all duration-300"
              >
                ×
              </button>
              
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-btn2 to-sky-500 p-3 rounded-xl">
                    <FaCalendarAlt className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-800">Book Appointment</h2>
                    <p className="text-gray-600 text-sm">Fill in your details to confirm</p>
                  </div>
                </div>
                <div className="h-1 w-24 bg-gradient-to-r from-btn2 to-sky-500 rounded-full"></div>
              </div>

              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <FaUserMd className="text-blue-600 text-xl" />
                  <div>
                    <p className="font-bold text-gray-800">{name}</p>
                    <p className="text-sm text-gray-600">{Specialization}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FaUserMd className="text-btn2" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-btn2 focus:ring-2 focus:ring-btn2/20 transition-all font-medium"
                    value={appointmentDetails.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FaEnvelope className="text-btn2" />
                    Your Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-btn2 focus:ring-2 focus:ring-btn2/20 transition-all font-medium"
                    value={appointmentDetails.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <FaCalendarAlt className="text-btn2" />
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-btn2 focus:ring-2 focus:ring-btn2/20 transition-all font-medium"
                      value={appointmentDetails.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <FaClock className="text-btn2" />
                      Time
                    </label>
                    <select
                      name="time"
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-btn2 focus:ring-2 focus:ring-btn2/20 transition-all font-medium bg-white"
                      value={appointmentDetails.time}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Time</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="1:00 PM">1:00 PM</option>
                      <option value="2:00 PM">2:00 PM</option>
                      <option value="3:00 PM">3:00 PM</option>
                      <option value="4:00 PM">4:00 PM</option>
                      <option value="5:00 PM">5:00 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={handleModalClose}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookAppointment}
                  className="flex-1 bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmationModalOpen && (
          <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white p-8 md:p-10 rounded-3xl w-full max-w-2xl shadow-2xl border-4 border-gray-100 animate-slideUp relative">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-br from-green-400 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FaCheckCircle className="text-white text-4xl" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Confirm Appointment</h2>
                <p className="text-gray-600">Please review your appointment details</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-200 mb-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <FaUserMd className="text-btn2 text-xl" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Patient Name</p>
                      <p className="font-bold text-gray-800">{appointmentDetails.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <FaEnvelope className="text-btn2 text-xl" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Email</p>
                      <p className="font-bold text-gray-800">{appointmentDetails.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="text-btn2 text-xl" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Date</p>
                        <p className="font-bold text-gray-800">{appointmentDetails.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaClock className="text-btn2 text-xl" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Time</p>
                        <p className="font-bold text-gray-800">{appointmentDetails.time}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <FaUserMd className="text-btn2 text-xl" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Doctor</p>
                      <p className="font-bold text-gray-800">{name}</p>
                      <p className="text-sm text-gray-600">{Specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <FaMapMarkerAlt className="text-red-500 text-xl" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-medium">Location</p>
                      <p className="font-bold text-gray-800">{location}, {city}</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Visiting Fee</p>
                        <p className="text-2xl font-extrabold text-green-700">Rs. 500</p>
                      </div>
                      <p className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full font-semibold">Pay during visit</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleConfirmationModalClose}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all duration-300"
                >
                  Edit
                </button>
                <button
                  onClick={handleConfirmAppointment}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:from-emerald-600 hover:to-green-500 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <FaCheckCircle />
                  Confirm Appointment
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

export default DoctorCard;
