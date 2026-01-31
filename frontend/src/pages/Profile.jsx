import React, { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake, FaCalendarAlt, FaFileMedical, FaHeartbeat, FaChartLine, FaUpload, FaTrash, FaEye, FaCheckCircle, FaTimes, FaMicroscope, FaRuler, FaWeight } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { profileAPI, fileAPI } from "../utils/api";
import HealthPlanGenerator from "../components/HealthPlanGenerator";
import ReportAnalysisModal from "../components/ReportAnalysisModal";

const API_BASE_URL = import.meta.env.VITE_API_URL;

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
    image: "/user.png",
    height: "",
    weight: "",
    pressure: "",
    bmi: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analyzingFileId, setAnalyzingFileId] = useState(null);
  
  const { email } = useAuth();

  useEffect(() => {
    // Fetch user data from the backend
    profileAPI
      .getProfile()
      .then((data) => {
        if (data.success && data.data) {
          const userData = data.data;
          setValues((prevValues) => ({
            ...prevValues,
            name: userData.name || "",
            age: userData.age || "",
            gender: userData.gender || "",
            phoneNumber: userData.phone || "",
            email: userData.email || "",
            address: userData.address || "",
            height: userData.height || "",
            weight: userData.weight || "",
            pressure: userData.pressure || "",
            bmi: userData.bmi || "",
          }));
        } else {
          console.error("Error fetching profile:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      });
  }, [email]);

  // ✅ AUTO-CALCULATE BMI
  useEffect(() => {
    if (values.height && values.weight) {
      const heightInMeters = parseFloat(values.height) / 100;
      const bmiValue = (parseFloat(values.weight) / (heightInMeters * heightInMeters)).toFixed(1);
      
      if (!isNaN(bmiValue) && isFinite(bmiValue)) {
        setValues(prev => ({ ...prev, bmi: bmiValue }));
      }
    }
  }, [values.height, values.weight]);

  // ✅ GET BMI CATEGORY
  const getBMICategory = (bmi) => {
    const bmiValue = parseFloat(bmi);
    if (isNaN(bmiValue)) return { category: "Unknown", color: "gray", bgColor: "bg-gray-100", textColor: "text-gray-600" };
    
    if (bmiValue < 16) return { category: "Severely Underweight", color: "#dc2626", bgColor: "bg-red-100", textColor: "text-red-700", message: "⚠️ Please consult a healthcare professional" };
    if (bmiValue < 18.5) return { category: "Underweight", color: "#f59e0b", bgColor: "bg-orange-100", textColor: "text-orange-700", message: "💡 Consider gaining weight through healthy diet" };
    if (bmiValue < 25) return { category: "Normal", color: "#10b981", bgColor: "bg-green-100", textColor: "text-green-700", message: "✅ Your BMI is in the healthy range!" };
    if (bmiValue < 30) return { category: "Overweight", color: "#f59e0b", bgColor: "bg-orange-100", textColor: "text-orange-700", message: "💪 Consider exercise and healthy eating" };
    if (bmiValue < 35) return { category: "Obese Class I", color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-700", message: "⚠️ Please consult a healthcare professional" };
    if (bmiValue < 40) return { category: "Obese Class II", color: "#dc2626", bgColor: "bg-red-200", textColor: "text-red-800", message: "🏥 Medical consultation strongly recommended" };
    return { category: "Obese Class III", color: "#991b1b", bgColor: "bg-red-300", textColor: "text-red-900", message: "🚨 Urgent medical consultation required" };
  };

  // ✅ GET BLOOD PRESSURE STATUS
  const getBloodPressureStatus = (bp) => {
    if (!bp || !bp.includes("/")) return { category: "Unknown", color: "gray", bgColor: "bg-gray-100", textColor: "text-gray-600" };
    
    try {
      const [systolic, diastolic] = bp.split("/").map(v => parseInt(v.trim()));
      
      if (systolic < 120 && diastolic < 80) return { category: "Normal", color: "#10b981", bgColor: "bg-green-100", textColor: "text-green-700", message: "✅ Your blood pressure is normal" };
      if (systolic < 130 && diastolic < 80) return { category: "Elevated", color: "#f59e0b", bgColor: "bg-orange-100", textColor: "text-orange-700", message: "⚠️ Watch your blood pressure" };
      if (systolic < 140 || diastolic < 90) return { category: "High BP (Stage 1)", color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-700", message: "🏥 Consult your doctor" };
      if (systolic < 180 || diastolic < 120) return { category: "High BP (Stage 2)", color: "#dc2626", bgColor: "bg-red-200", textColor: "text-red-800", message: "🚨 Medical attention needed" };
      return { category: "Hypertensive Crisis", color: "#991b1b", bgColor: "bg-red-300", textColor: "text-red-900", message: "🚨 Seek emergency care" };
    } catch {
      return { category: "Invalid", color: "gray", bgColor: "bg-gray-100", textColor: "text-gray-600" };
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        const data = await fileAPI.upload(file);
        if (data.success) {
          toast.success(`File ${file.name} uploaded successfully!`);
          fetchFiles();
        } else {
          toast.error(data.message || `Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Error uploading ${file.name}`);
      }
    }
  };

  const fetchFiles = async () => {
    try {
      const data = await fileAPI.getFiles();
      if (data.success && data.data) {
        setUploadedFiles(data.data.files || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    if (activeSection === "reports") {
      fetchFiles();
    }
  }, [activeSection]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      // Validate blood pressure format
      if (values.pressure && !values.pressure.match(/^\d+\/\d+$/)) {
        toast.error("Blood pressure must be in format: 120/80");
        return;
      }

      // Validate height and weight
      if (values.height && (parseFloat(values.height) < 50 || parseFloat(values.height) > 300)) {
        toast.error("Height must be between 50 and 300 cm");
        return;
      }

      if (values.weight && (parseFloat(values.weight) < 20 || parseFloat(values.weight) > 300)) {
        toast.error("Weight must be between 20 and 300 kg");
        return;
      }

      const updateData = {
        name: values.name,
        phone: values.phoneNumber,
        age: parseInt(values.age) || values.age,
        gender: values.gender,
        height: values.height,
        weight: values.weight,
        pressure: values.pressure,
        bmi: values.bmi,
      };

      const data = await profileAPI.updateProfile(updateData);
      if (data.success) {
        toast.success("✅ Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const data = await fileAPI.deleteFile(fileId);
      if (data.success) {
        toast.success("File deleted successfully!");
        fetchFiles();
      } else {
        toast.error(data.message || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Error deleting file");
    }
  };

 const handleAnalyzeReport = async (fileId) => {
  try {
    setAnalyzingFileId(fileId);
    toast.info("🔍 Analyzing report...");
    
   
    const data = await fileAPI.analyzeReport(fileId);
    
    if (data.success) {
      setAnalysisData(data.data.analysis);
      setShowAnalysisModal(true);
      toast.success("✅ Analysis complete!");
    } else {
      toast.error(data.message || "Failed to analyze report");
    }
  } catch (error) {
    console.error("Analysis error:", error);
    toast.error("Failed to analyze report");
  } finally {
    setAnalyzingFileId(null);
  }
};


  const renderAboutSection = () => (
    <div className="p-4 animate-slideUp">
      <div className="w-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-8 rounded-2xl border-2 border-gray-200 shadow-xl relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full -mr-20 -mt-20 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full -ml-20 -mb-20 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-btn2 to-sky-500 p-3 rounded-xl shadow-lg">
                <FaUser className="text-white text-xl" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-800">Personal Details</h2>
            </div>
            {!isEditing && (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <FaPenToSquare /> Edit Profile
              </button>
            )}
          </div>
          {isEditing ? (
          <div className="space-y-5">
            {[
              { field: "name", icon: FaUser, type: "text" },
              { field: "age", icon: FaBirthdayCake, type: "number" },
              { field: "gender", icon: FaUser, type: "text" },
              { field: "phoneNumber", icon: FaPhone, type: "tel" },
              { field: "email", icon: FaEnvelope, type: "email" },
              { field: "address", icon: FaMapMarkerAlt, type: "text" },
              { field: "joiningDate", icon: FaCalendarAlt, type: "text" },
            ].map(({ field, icon: Icon, type }) => (
              <div className="flex flex-col group" key={field}>
                <label htmlFor={field} className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Icon className="text-btn2" />
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  id={field}
                  type={type}
                  name={field}
                  value={values[field]}
                  onChange={handleChange}
                  disabled={field === "email"}
                  className="px-5 py-3.5 rounded-xl border-2 border-gray-300 focus:border-btn2 focus:ring-4 focus:ring-btn2/20 focus:outline-none transition-all bg-white font-medium group-hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            ))}
            <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-200">
              <button
                onClick={handleSaveClick}
                className="flex-1 bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-4 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover:scale-105 transform"
              >
                <FaCheckCircle />
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold hover:bg-gray-300 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { field: "name", icon: FaUser, colorClass: "bg-gradient-to-br from-blue-100 to-blue-200", iconClass: "text-blue-600" },
              { field: "age", icon: FaBirthdayCake, colorClass: "bg-gradient-to-br from-purple-100 to-purple-200", iconClass: "text-purple-600" },
              { field: "gender", icon: FaUser, colorClass: "bg-gradient-to-br from-pink-100 to-pink-200", iconClass: "text-pink-600" },
              { field: "phoneNumber", icon: FaPhone, colorClass: "bg-gradient-to-br from-green-100 to-green-200", iconClass: "text-green-600" },
              { field: "email", icon: FaEnvelope, colorClass: "bg-gradient-to-br from-blue-100 to-blue-200", iconClass: "text-blue-600" },
              { field: "address", icon: FaMapMarkerAlt, colorClass: "bg-gradient-to-br from-red-100 to-red-200", iconClass: "text-red-600" },
              { field: "joiningDate", icon: FaCalendarAlt, colorClass: "bg-gradient-to-br from-orange-100 to-orange-200", iconClass: "text-orange-600" },
            ].map(({ field, icon: Icon, colorClass, iconClass }) => (
              <div key={field} className="p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-btn2 hover:shadow-xl transition-all duration-300 group">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${colorClass} p-2.5 rounded-lg group-hover:scale-110 transition-transform`}>
                    <Icon className={`${iconClass} text-lg`} />
                  </div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </p>
                </div>
                <p className="text-base font-extrabold text-gray-800 ml-12 group-hover:text-btn2 transition-colors">
                  {values[field] || "Not set"}
                </p>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderReportsSection = () => (
    <div className="p-4 animate-slideUp">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
          <FaFileMedical className="text-white text-2xl" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-800">Health Reports</h2>
      </div>
      <div className="flex flex-col">
        <div className="mb-8 p-8 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-500 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200/0 to-purple-200/0 group-hover:from-blue-200/20 group-hover:to-purple-200/20 transition-all duration-500"></div>
          
          <label className="cursor-pointer relative z-10">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-gradient-to-br from-btn2 to-sky-500 p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <FaUpload className="text-white text-3xl" />
                </div>
              </div>
              <p className="text-gray-800 font-bold text-lg mb-2">Upload Health Reports</p>
              <p className="text-sm text-gray-600 mb-6">Click to select files or drag and drop (PDF, JPG, PNG)</p>
              <input
                type="file"
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-gradient-to-r from-btn2 to-sky-500 text-white px-8 py-4 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer hover:scale-105 transform"
              >
                <FaUpload className="inline mr-2" />
                Choose Files
              </label>
            </div>
          </label>
        </div>
        
        {uploadedFiles.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg">
                <FaCheckCircle className="text-white text-xl" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-800">Uploaded Files</h3>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                {uploadedFiles.length} {uploadedFiles.length === 1 ? "file" : "files"}
              </span>
            </div>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={file._id || file.file_id} 
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-btn2 hover:shadow-lg transition-all duration-300 group gap-3"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-lg group-hover:scale-110 transition-transform">
                      <FaFileMedical className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 group-hover:text-btn2 transition-colors block">
                        {file.filename || file.original_filename || file.stored_filename}
                      </span>
                      {file.analyzed && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mt-1 inline-block">
                          ✓ Analyzed
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                   <button
                      onClick={() => handleViewFile(file._id || file.file_id)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:from-blue-600 hover:to-blue-500 transition-all shadow-md hover:shadow-lg flex items-center gap-2 hover:scale-105 transform"
                      title="View file"
                    >
                      <FaEye />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    
                    <button
                      onClick={() => handleAnalyzeReport(file._id || file.file_id)}
                      disabled={analyzingFileId === (file._id || file.file_id)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:from-purple-600 hover:to-purple-500 transition-all shadow-md hover:shadow-lg flex items-center gap-2 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Analyze report with AI"
                    >
                      <FaMicroscope />
                      <span className="hidden sm:inline">
                        {analyzingFileId === (file._id || file.file_id) ? "Analyzing..." : "Analyze"}
                      </span>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteFile(file._id || file.file_id)}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl font-bold hover:from-red-600 hover:to-red-500 transition-all shadow-md hover:shadow-lg flex items-center gap-2 hover:scale-105 transform"
                      title="Delete file"
                    >
                      <FaTrash />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {uploadedFiles.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <FaFileMedical className="text-gray-300 text-6xl mx-auto mb-4" />
            <p className="text-gray-600 font-semibold text-lg">No files uploaded yet</p>
            <p className="text-gray-500 text-sm mt-2">Upload your health reports to keep them organized</p>
          </div>
        )}
      </div>
    </div>
  );

  // ✅ ENHANCED HEALTH SECTION WITH EDIT/SAVE BUTTONS
const renderHealthSection = () => {
  const bmiStatus = getBMICategory(values.bmi);
  const bpStatus = getBloodPressureStatus(values.pressure);

  return (
    <div className="p-4 animate-slideUp">
      {/* ✅ HEADER WITH EDIT/SAVE BUTTONS */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
            <FaHeartbeat className="text-white text-2xl" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800">Health Management</h2>
        </div>
        
        {/* ✅ EDIT/SAVE TOGGLE BUTTONS */}
        {!isEditing ? (
          <button
            onClick={handleEditClick}
            className="flex items-center gap-2 bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-3 rounded-xl font-bold hover:from-sky-500 hover:to-btn2 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <FaPenToSquare /> Edit Metrics
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSaveClick}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-500 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <FaCheckCircle /> Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all"
            >
              <FaTimes /> Cancel
            </button>
          </div>
        )}
      </div>
      
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 space-y-6">
        {/* ✅ BMI CALCULATOR CARD */}
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-500 p-2 rounded-lg">
              <FaChartLine className="text-white text-xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">BMI Calculator</h3>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              {/* Height & Weight Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FaRuler className="text-blue-500" />
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    name="height"
                    value={values.height}
                    onChange={handleChange}
                    placeholder="e.g., 175"
                    min="50"
                    max="300"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your height in centimeters (50-300 cm)</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FaWeight className="text-blue-500" />
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={values.weight}
                    onChange={handleChange}
                    placeholder="e.g., 70"
                    min="20"
                    max="300"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter your weight in kilograms (20-300 kg)</p>
                </div>
              </div>
              
              {/* Auto-calculated BMI Display */}
              {values.height && values.weight && values.bmi && (
                <div className={`p-4 rounded-xl ${bmiStatus.bgColor} border-2 animate-scaleIn`} style={{ borderColor: bmiStatus.color }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-600">Calculated BMI</p>
                      <p className="text-4xl font-extrabold mt-1" style={{ color: bmiStatus.color }}>
                        {values.bmi}
                      </p>
                      <p className={`text-sm font-bold mt-1 ${bmiStatus.textColor}`}>
                        {bmiStatus.category}
                      </p>
                    </div>
                    <div className="text-5xl">📊</div>
                  </div>
                  {bmiStatus.message && (
                    <p className="text-xs text-gray-600 mt-3 bg-white/50 p-2 rounded-lg">
                      💡 {bmiStatus.message}
                    </p>
                  )}
                </div>
              )}
              
              {/* Blood Pressure Input */}
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FaHeartbeat className="text-red-500" />
                  Blood Pressure (e.g., 120/80)
                </label>
                <input
                  type="text"
                  name="pressure"
                  value={values.pressure}
                  onChange={handleChange}
                  placeholder="120/80"
                  pattern="\d{2,3}/\d{2,3}"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none transition-all text-lg font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">Format: Systolic/Diastolic (e.g., 120/80)</p>
              </div>

              {/* Instructions Card */}
              <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <span>BMI is automatically calculated when you enter height and weight. Click "Save" button above to update your health profile.</span>
                </p>
              </div>
            </div>
          ) : (
            // ✅ DISPLAY MODE (Shows current metrics)
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl ${bmiStatus.bgColor} border-2 hover:shadow-lg transition-all`} style={{ borderColor: bmiStatus.color }}>
                <div className="text-2xl mb-2">📊</div>
                <p className="text-sm text-gray-600 font-semibold">BMI</p>
                <p className="text-2xl font-extrabold" style={{ color: bmiStatus.color }}>
                  {values.bmi || "Not set"}
                </p>
                {values.bmi && (
                  <p className={`text-xs font-bold mt-1 ${bmiStatus.textColor}`}>
                    {bmiStatus.category}
                  </p>
                )}
              </div>
              
              <div className="bg-white p-4 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-all">
                <div className="text-2xl mb-2">📏</div>
                <p className="text-sm text-gray-600 font-semibold">Height</p>
                <p className="text-2xl font-bold text-gray-800">
                  {values.height ? `${values.height} cm` : "Not set"}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-all">
                <div className="text-2xl mb-2">⚖️</div>
                <p className="text-sm text-gray-600 font-semibold">Weight</p>
                <p className="text-2xl font-bold text-gray-800">
                  {values.weight ? `${values.weight} kg` : "Not set"}
                </p>
              </div>
              
              <div className={`p-4 rounded-xl ${bpStatus.bgColor} border-2 hover:shadow-lg transition-all`} style={{ borderColor: bpStatus.color }}>
                <div className="text-2xl mb-2">❤️</div>
                <p className="text-sm text-gray-600 font-semibold">Blood Pressure</p>
                <p className="text-2xl font-extrabold" style={{ color: bpStatus.color }}>
                  {values.pressure || "Not set"}
                </p>
                {values.pressure && bpStatus.category !== "Invalid" && (
                  <p className={`text-xs font-bold mt-1 ${bpStatus.textColor}`}>
                    {bpStatus.category}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* BMI & BP Status Messages (Display Mode) */}
          {!isEditing && (
            <>
              {values.bmi && bmiStatus.message && (
                <div className="mt-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:shadow-md transition-all">
                  <p className="text-sm text-gray-700 font-medium">
                    📊 {bmiStatus.message}
                  </p>
                </div>
              )}
              
              {values.pressure && bpStatus.message && bpStatus.category !== "Invalid" && (
                <div className="mt-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:shadow-md transition-all">
                  <p className="text-sm text-gray-700 font-medium">
                    ❤️ {bpStatus.message}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Health Plan Generator */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-500 p-2 rounded-lg">
              <FaChartLine className="text-white text-xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Personalized Health Plan
            </h3>
          </div>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Generate a comprehensive, personalized health management plan based on your recent diagnosis. 
            Our AI will create a detailed 4-week plan tailored to your specific health condition.
          </p>
          <div className="flex justify-center">
            <HealthPlanGenerator />
          </div>
        </div>
      </div>
    </div>
  );
};


  const getFieldIcon = (field) => {
    const iconMap = {
      age: FaBirthdayCake,
      gender: FaUser,
      phoneNumber: FaPhone,
      address: FaMapMarkerAlt,
      email: FaEnvelope,
      name: FaUser,
    };
    return iconMap[field] || FaUser;
  };

  return (
    <div className="w-full min-h-screen font-text bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-5">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-btn2 to-sky-500 rounded-2xl p-8 shadow-xl text-white">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">My Profile</h1>
            <p className="text-lg text-white/90">Manage your personal information and health data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left side - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-gray-100 sticky top-8 hover:shadow-3xl transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col w-full justify-center items-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-btn2 to-sky-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <img
                      className="rounded-full w-32 h-32 object-cover shadow-2xl border-4 border-white relative z-10 group-hover:scale-110 transition-transform duration-300"
                      src={values.image}
                      alt="Profile"
                    />
                    <div className="absolute bottom-2 right-2 bg-gradient-to-br from-green-400 to-green-600 w-8 h-8 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-500 w-6 h-6 rounded-full border-2 border-white shadow-md"></div>
                  </div>
                  <h1 className="font-extrabold text-2xl mt-2 text-gray-800 group-hover:text-btn2 transition-colors">{values.name || "User"}</h1>
                  <p className="text-sm text-gray-600 font-medium flex items-center gap-2 mt-1">
                    <FaEnvelope className="text-btn2" />
                    {values.email}
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    { field: "age", icon: FaBirthdayCake, colorClass: "bg-blue-100", iconClass: "text-blue-600" },
                    { field: "gender", icon: FaUser, colorClass: "bg-purple-100", iconClass: "text-purple-600" },
                    { field: "phoneNumber", icon: FaPhone, colorClass: "bg-green-100", iconClass: "text-green-600" },
                    { field: "address", icon: FaMapMarkerAlt, colorClass: "bg-red-100", iconClass: "text-red-600" },
                  ].map(({ field, icon: Icon, colorClass, iconClass }) => (
                    <div key={field} className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-btn2 hover:shadow-md transition-all duration-300 group/item">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`${colorClass} p-1.5 rounded-lg`}>
                          <Icon className={`${iconClass} text-sm`} />
                        </div>
                        <p className="text-xs text-gray-500 font-bold">
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-800 font-semibold ml-8">
                        {values[field] || "Not set"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-gray-100 hover:shadow-3xl transition-all duration-300">
              <div className="flex mb-8 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 p-1.5 rounded-2xl border border-gray-200">
                {[
                  { name: "about", icon: FaUser, label: "About" },
                  { name: "reports", icon: FaFileMedical, label: "Reports" },
                  { name: "health", icon: FaHeartbeat, label: "Health" },
                ].map(({ name, icon: Icon, label }) => (
                  <button
                    key={name}
                    onClick={() => setActiveSection(name)}
                    className={`flex-1 p-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                      activeSection === name
                        ? "bg-gradient-to-r from-btn2 to-sky-500 text-white shadow-xl scale-105"
                        : "text-gray-600 hover:text-gray-800 hover:bg-white"
                    }`}
                  >
                    <Icon className={activeSection === name ? "text-white" : "text-gray-500"} />
                    {label}
                  </button>
                ))}
              </div>
              
              {activeSection === "about" && renderAboutSection()}
              {activeSection === "reports" && renderReportsSection()}
              {activeSection === "health" && renderHealthSection()}
            </div>
          </div>
        </div>
      </div>

      {showAnalysisModal && (
        <ReportAnalysisModal 
          analysis={analysisData} 
          onClose={() => setShowAnalysisModal(false)} 
        />
      )}
    </div>
  );
}

export default Profile;


