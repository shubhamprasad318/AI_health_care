import { Link } from "react-router-dom";
import { useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { PiMedalDuotone } from "react-icons/pi";
import { toast } from "react-toastify";

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
      const response = await fetch("http://localhost:5000/appoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...appointmentDetails,
          doctorName: name,
          doctorSpecialization: Specialization,
          doctorCity: city,
          doctorLocation: location,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Appointment booked successfully!");
        setOpenModal(false);
        setConfirmationModalOpen(true);
      } else {
        toast.error("Failed to book the appointment. Please try again.");
      }
    } catch (error) {
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
      <div className="w-[360px] shadow-sm shadow-gray-500 my-5 p-2">
        <div className="flex">
          <div className="">
            <img
              src="https://assets-global.website-files.com/6426543485efe6a5ade36f21/64eeb730f28ad152d8d18244_Introducing-Dr.-Carewise--Your-Empathetic-3D-Animated-Doctor-gigapixel-standard-scale-6_00x.jpg"
              alt=""
              className="flex w-32 px-2 py-2 items-center rounded-full"
            />
          </div>
          <div className="w-full">
            <div className="border-b-2">
              <h5 className="text-2xl flex justify-center font-bold font-text tracking-tight px-2">
                {name}
              </h5>
              <div className="w-full justify-center text-gray-600 flex text-sm">
                <p>{Specialization}</p>
              </div>
            </div>
            <div className="font-text px-3 py-2 text-sm text-gray-700 font-medium text-justify mt-2 capitalize">
              <div className="flex items-center">
                <FaLocationDot className="text-red-500" size={15} />
                <p className="mx-4">
                  {city}, {location}
                </p>
              </div>
              <div className="flex mt-2">
                <PiMedalDuotone className="text-yellow-500" size={15} />
                <p className="mx-4">{experience} years of experience</p>
              </div>
            </div>

            <div className="flex justify-center items-center w-full bg-btn1 rounded">
              <Link className="px-2 py-2">
                <button
                  onClick={() => setOpenModal(true)}
                  className="text-gray-800 font-semibold py-1 rounded text-sm font-text"
                >
                  Book Appointment
                </button>
              </Link>
            </div>
          </div>
        </div>
        {openModal && (
          <div className="fixed inset-0 z-50 overflow-auto bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded shadow-md">
              <h2 className="text-lg font-semibold">Book Appointment</h2>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                className="border border-gray-300 rounded px-2 py-1 mt-2 w-full"
                value={appointmentDetails.name}
                onChange={handleInputChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                className="border border-gray-300 rounded px-2 py-1 mt-2 w-full"
                value={appointmentDetails.email}
                onChange={handleInputChange}
                required
              />
              <input
                type="date"
                name="date"
                placeholder="Date"
                className="border border-gray-300 rounded px-2 py-1 mt-2 w-full"
                value={appointmentDetails.date}
                onChange={handleInputChange}
                required
              />
              <select
                name="time"
                className="border border-gray-300 rounded px-2 py-1 mt-2 w-full"
                value={appointmentDetails.time}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Time</option>
                <option value="9:00 AM">9:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="3:00 PM">3:00 PM</option>
                <option value="6:00 PM">6:00 PM</option>
              </select>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleBookAppointment}
                  className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
                >
                  Book
                </button>
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmationModalOpen && (
          <div className="fixed inset-0 z-50 overflow-auto bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded shadow-md">
              <h2 className="text-lg font-semibold">Confirm Appointment</h2>
              <p>Name: {appointmentDetails.name}</p>
              <p>Email: {appointmentDetails.email}</p>
              <p>Date: {appointmentDetails.date}</p>
              <p>Time: {appointmentDetails.time}</p>
              <p>Doctor: {name}</p>
              <p>Specialization: {Specialization}</p>
              <p>
                Location: {location}, {city}
              </p>
              <p>Visiting fee: Rs.500</p>
              <p className="text-xs text-gray-700">(pay during visit)</p>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleConfirmationModalClose}
                  className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={handleConfirmAppointment}
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default DoctorCard;
