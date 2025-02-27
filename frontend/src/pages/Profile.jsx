import React, { useState, useEffect } from "react";
import { FaPenToSquare } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const [values, setValues] = useState({
    name: "",
    age: "",
    gender: "",
    phoneNumber: "",
    email: "",
    address: "",
    joiningDate: "06-06-24",
    image: "public/user.png",
    height: "",
    weight: "",
    pressure: "",
    bmi: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { email } = useAuth();

  useEffect(() => {
    // Fetch user data from the backend
    fetch("http://localhost:5000/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
        } else {
          setValues((prevValues) => ({
            ...prevValues,
            name: data.name || "",
            age: data.age || "",
            gender: data.gender || "",
            phoneNumber: data.phone || "",
            email: data.email || "",
            address: data.address || "",
            height: data.height || "",
            weight: data.weight || "",
            pressure: data.pressure || "",
            bmi: data.bmi || "",
          }));
        }
      })
      .catch((error) => console.error("Error fetching profile:", error));
  }, [email]);


  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileURLs = files.map((file) => URL.createObjectURL(file));
    setUploadedFiles((prevFiles) => [...prevFiles, ...fileURLs]);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    setIsEditing(false);
    // Add logic to save the edited details
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleDeleteFile = (index) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const renderAboutSection = () => (
    <div className="p-2">
      <div className="w-full bg-gray-300 p-2 rounded mb-4">
        <h2 className="text-xl font-bold mb-2">Personal Details</h2>
        {isEditing ? (
          <div>
            {[
              "name",
              "age",
              "gender",
              "phoneNumber",
              "email",
              "address",
              "joiningDate",
            ].map((field) => (
              <div className="flex items-center" key={field}>
                <label htmlFor={field} className="mr-2">
                  {field.charAt(0).toUpperCase() + field.slice(1)}:
                </label>
                <input
                  id={field}
                  type="text"
                  name={field}
                  value={values[field]}
                  onChange={handleChange}
                  className="my-2 px-2 rounded mx-2"
                />
              </div>
            ))}
            <button
              onClick={handleSaveClick}
              className="flex justify-center items-center bg-btn2 px-5 py-2 rounded mb-3"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="relative">
            {[
              "name",
              "age",
              "gender",
              "phoneNumber",
              "email",
              "address",
              "joiningDate",
            ].map((field) => (
              <p key={field}>{`${
                field.charAt(0).toUpperCase() + field.slice(1)
              }: ${values[field]}`}</p>
            ))}
            <button
              onClick={handleEditClick}
              className="flex justify-center items-center text-gray-600 absolute top-0 right-3"
            >
              <FaPenToSquare /> Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderReportsSection = () => (
    <div>
      <h2 className="text-xl font-bold mb-2">Reports</h2>
      <div className="flex flex-col">
        <input
          type="file"
          onChange={handleFileUpload}
          multiple
          className="mb-4"
        />
        {uploadedFiles.length > 0 && (
          <div className="bg-gray-200 p-2 rounded">
            <h3 className="text-lg font-bold mb-2">Uploaded Files</h3>
            <ul>
              {uploadedFiles.map((fileURL, index) => (
                <li key={index} className="flex justify-between items-center">
                  <span>{fileURL.split("/").pop()}</span>
                  <div className="flex">
                    <button
                      onClick={() => window.open(fileURL, "_blank")}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // const renderAppointmentsSection = () => (
  //   <div>
  //     <h2 className="text-xl font-bold mb-2">Appointments</h2>
  //     {/* Add appointment details or management here */}
  //   </div>
  // );

  return (
    <div className="w-full font-text flex">
      {/* Left side */}
      <div className="w-[300px] h-fit bg-gray-200 p-2">
        <div className="flex flex-col w-full justify-center items-center">
          <img
            className="rounded-full w-32 h-32 object-cover shadow-md shadow-black border-[5px] border-btn2"
            src={values.image}
            alt="Profile"
          />
          <h1 className="font-bold text-xl mt-2">{values.name}</h1>
          <p className="text-sm text-gray-700 font-medium">{values.email}</p>
        </div>
        <div className="p-2">
          {["age", "gender", "phoneNumber", "address"].map((field) => (
            <p className="text-base font-medium m-2" key={field}>
              {`${field.charAt(0).toUpperCase() + field.slice(1)}: `}
              <span className="text-sm text-gray-800 font-normal">
                {values[field]}
              </span>
            </p>
          ))}
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 p-2">
        <div className="flex mb-4">
          {["about", "reports"].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`flex-1 p-2 ${
                activeSection === section
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300"
              }`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>
        {activeSection === "about" && renderAboutSection()}
        {activeSection === "reports" && renderReportsSection()}
        {/* {activeSection === "appointments" && renderAppointmentsSection()} */}
      </div>
    </div>
  );
}

export default Profile;
