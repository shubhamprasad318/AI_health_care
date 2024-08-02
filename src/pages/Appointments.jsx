import React, { useState } from "react";
import DoctorCard from "../components/DoctorCard";
import { FaSearch } from "react-icons/fa";
import { doctors } from "../components/DoctorList";
// import axios from "axios";
// import { load } from "cheerio";

function DoctorRecommend() {
  

  const [location, setLocation] = useState("");
  const [specialization, setspecialization] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  console.log(specialization, location, filteredDoctors);

  const handlespecializationChange = (event) => {
    setspecialization(event.target.value);
  };

  const handleLocationChange = (event) => {
    setLocation(event.target.value);
  };
  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    const filteredDoctors = this.state.doctors.filter((doctor) => {
      const locationMatch = doctor.city.toLowerCase().includes(query);
      const specializationMatch = doctor.specialization
        .toLowerCase()
        .includes(query);
      return locationMatch || specializationMatch;
    });
    this.setState({ filteredDoctors });
  };

  // const fetchData = async () => {
  //   try {
  //     console.log("Searching...");

  //     const response = await axios.get("https://www.practo.com/doctors");

  //     console.log(response);
  //     console.log("Searching...");

  //     const html = response.data;
  //     const $ = load(html);

  //     const doctorsList = [];

  //     $(".doctor-card").each((index, element) => {
  //       const name = $(element).find(".doctor-name").text();
  //       const specialization = $(element).find(".doctor-specialization").text();
  //       const city = $(element).find(".doctor-location").text();

  //       doctorsList.push({ name, specialization, city });
  //     });

  //     setDoctorsList(doctorsList);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   }
  // };

  return (
    <>
      <div className="w-full h-full relative font-text bg-lightBackground">
        <div className="w-full flex flex-col justify-center items-center">
          <div className="w-full h-[350px] bg-right bg-doc bg-fixed ">
            <div className="w-full h-full bg-black bg-opacity-60 flex flex-col justify-center items-center px-10">
              <h1 className="text-6xl top-20 justify-start items-center text-white font-text font-bold">
                Find Doctor
              </h1>
              <p className="text-white italic">
                "Effortless doctor appointments: Book with ease, stay healthy!"
              </p>
            </div>
          </div>

          <div className="flex px-10 py-3 w-full mt-5 ">
            <div className="px-6 flex ">
              <div className="px-4 ">
                <select
                  value={specialization}
                  onChange={handlespecializationChange}
                  className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-btn2"
                >
                  <option value="">--Specialization--</option>
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
              <div>
                <select
                  value={location}
                  onChange={handleLocationChange}
                  className="border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-btn2"
                >
                  <option value="">--City--</option>
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
              <div className="flex justify-center items-center px-2">
                <button
                  className="flex justify-center items-center bg-btn2 hover:bg-sky-300 py-2 px-3 rounded "
                  onClick={handleSearch}
                >
                  <span className="pr-2">Search</span>
                  <FaSearch className="" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-5 grid grid-cols-3">
          {doctors
            .filter(
              (doctor) =>
                doctor.city.toLowerCase().includes(location.toLowerCase()) &&
                doctor.Specialization.toLowerCase().includes(
                  specialization.toLowerCase()
                )
              // doctor.city.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((doctor) => (
              <DoctorCard
                key={doctor.id}
                name={doctor.name}
                city={doctor.city}
                location={doctor.location}
                Specialization={doctor.Specialization}
                rating={doctor.rating}
                experience={doctor.experience}
              />
            ))}
        </div>
      </div>
    </>
  );
}

export default DoctorRecommend;
