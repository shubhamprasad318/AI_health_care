import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import Select from "react-select";
import { BsArrowDown } from "react-icons/bs";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import { 
  FaStar, 
  FaStethoscope, 
  FaBrain, 
  FaShieldAlt, 
  FaCheckCircle, 
  FaInfoCircle, 
  FaHeartbeat, 
  FaUserMd 
} from "react-icons/fa";

function PredictDisease() {
  const symptoms = [
    "Itching",
    "Skin Rash",
    "Nodal Skin Eruptions",
    "Continuous Sneezing",
    "Shivering",
    "Chills",
    "Joint Pain",
    "Stomach Pain",
    "Acidity",
    "Ulcers On Tongue",
    "Muscle Wasting",
    "Vomiting",
    "Burning Micturition",
    "Spotting Urination",
    "Fatigue",
    "Weight Gain",
    "Anxiety",
    "Cold Hands And Feets",
    "Mood Swings",
    "Weight Loss",
    "Restlessness",
    "Lethargy",
    "Patches In Throat",
    "Irregular Sugar Level",
    "Cough",
    "High Fever",
    "Sunken Eyes",
    "Breathlessness",
    "Sweating",
    "Dehydration",
    "Indigestion",
    "Headache",
    "Yellowish Skin",
    "Dark Urine",
    "Nausea",
    "Loss Of Appetite",
    "Pain Behind The Eyes",
    "Back Pain",
    "Constipation",
    "Abdominal Pain",
    "Diarrhoea",
    "Mild Fever",
    "Yellow Urine",
    "Yellowing Of Eyes",
    "Acute Liver Failure",
    "Fluid Overload",
    "Swelling Of Stomach",
    "Swelled Lymph Nodes",
    "Malaise",
    "Blurred And Distorted Vision",
    "Phlegm",
    "Throat Irritation",
    "Redness Of Eyes",
    "Sinus Pressure",
    "Runny Nose",
    "Congestion",
    "Chest Pain",
    "Weakness In Limbs",
    "Fast Heart Rate",
    "Pain During Bowel Movements",
    "Pain In Anal Region",
    "Bloody Stool",
    "Irritation In Anus",
    "Neck Pain",
    "Dizziness",
    "Cramps",
    "Bruising",
    "Obesity",
    "Swollen Legs",
    "Swollen Blood Vessels",
    "Puffy Face And Eyes",
    "Enlarged Thyroid",
    "Brittle Nails",
    "Swollen Extremeties",
    "Excessive Hunger",
    "Extra Marital Contacts",
    "Drying And Tingling Lips",
    "Slurred Speech",
    "Knee Pain",
    "Hip Joint Pain",
    "Muscle Weakness",
    "Stiff Neck",
    "Swelling Joints",
    "Movement Stiffness",
    "Spinning Movements",
    "Loss Of Balance",
    "Unsteadiness",
    "Weakness Of One Body Side",
    "Loss Of Smell",
    "Bladder Discomfort",
    "Foul Smell Of Urine",
    "Continuous Feel Of Urine",
    "Passage Of Gases",
    "Internal Itching",
    "Toxic Look (Typhos)",
    "Depression",
    "Irritability",
    "Muscle Pain",
    "Altered Sensorium",
    "Red Spots Over Body",
    "Belly Pain",
    "Abnormal Menstruation",
    "Dischromic Patches",
    "Watering From Eyes",
    "Increased Appetite",
    "Polyuria",
    "Family History",
    "Mucoid Sputum",
    "Rusty Sputum",
    "Lack Of Concentration",
    "Visual Disturbances",
    "Receiving Blood Transfusion",
    "Receiving Unsterile Injections",
    "Coma",
    "Stomach Bleeding",
    "Distention Of Abdomen",
    "History Of Alcohol Consumption",
    "Fluid Overload",
    "Blood In Sputum",
    "Prominent Veins On Calf",
    "Palpitations",
    "Painful Walking",
    "Pus Filled Pimples",
    "Blackheads",
    "Scurring",
    "Skin Peeling",
    "Silver Like Dusting",
    "Small Dents In Nails",
    "Inflammatory Nails",
    "Blister",
    "Red Sore Around Nose",
    "Yellow Crust Ooze",
    "Prognosis"
  ];

  const [predictionData, setPredictionData] = useState({
    prediction: "",
    description: "",
    precautions: [],
    specialize: "",
    geminiAnalysis: null,
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState({
    symptom1: "",
    symptom2: "",
    symptom3: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useEnhanced, setUseEnhanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ FIXED: Corrected handlePredict function
  const handlePredict = async () => {
    setIsLoading(true);
    try {
      const { predictionAPI } = await import("../utils/api");
      
      // ✅ Build request in the format backend expects
      const requestData = {
        symptom1: selectedSymptoms.symptom1?.value || selectedSymptoms.symptom1?.label || "",
        symptom2: selectedSymptoms.symptom2?.value || selectedSymptoms.symptom2?.label || "",
        symptom3: selectedSymptoms.symptom3?.value || selectedSymptoms.symptom3?.label || "",
      };
  
      console.log("Sending symptoms:", requestData);
      
      let data;
      if (useEnhanced) {
        data = await predictionAPI.predictEnhanced(requestData);
        console.log("Enhanced prediction response:", data);
      } else {
        data = await predictionAPI.predict(requestData);
        console.log("Basic prediction response:", data);
      }
  
      if (data.success && data.data) {
        const responseData = data.data;
        
        console.log("=== RESPONSE DATA DEBUG ===");
        console.log("Response keys:", Object.keys(responseData));
        console.log("ml_prediction:", responseData.ml_prediction);
        console.log("ml_description:", responseData.ml_description);
        console.log("ml_precautions:", responseData.ml_precautions);
        console.log("ml_specialist:", responseData.ml_specialist);
        console.log("========================");
        
        setPredictionData({
          prediction: responseData.ml_prediction || responseData.prediction || "Unknown",
          description: responseData.ml_description || responseData.description || "Description not available",
          precautions: responseData.ml_precautions || responseData.precautions || [],
          specialize: responseData.ml_specialist || responseData.specialist || responseData.specialize || "General Physician",
          geminiAnalysis: useEnhanced && responseData.gemini_analysis ? responseData.gemini_analysis : null,
        });
        
        setIsModalOpen(true);
        toast.success("Prediction completed successfully!");
      } else {
        toast.error(data.message || "Failed to predict disease");
      }
    } catch (error) {
      console.error("Error predicting disease:", error);
      toast.error("An error occurred while predicting disease");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleSymptomChange = (value, actionMeta) => {
    setSelectedSymptoms((prevState) => ({
      ...prevState,
      [actionMeta.name]: value,
    }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const symptomsOptions = symptoms.map((symptom) => ({
    value: symptom,
    label: symptom,
  }));

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Hero Section */}
      <div className="w-full h-[400px] bg-gradient-to-r from-btn2 via-sky-500 to-blue-600 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        
        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 px-5">
          <div className="text-center max-w-4xl">
            <div className="mb-6 flex justify-center">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border-2 border-white/30">
                <FaStethoscope className="text-5xl text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-center drop-shadow-2xl">
              Advanced Disease Prediction
            </h1>
            <p className="font-semibold text-xl md:text-3xl italic text-white/95 text-center mb-8 drop-shadow-lg">
              "Empowering Health Through Technology"
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                <span className="flex items-center gap-2">
                  <FaShieldAlt className="text-yellow-300" />
                  <span className="font-semibold">98.99% Accuracy</span>
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                <span className="flex items-center gap-2">
                  <FaBrain className="text-purple-300" />
                  <span className="font-semibold">AI-Powered</span>
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                <span className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-300" />
                  <span className="font-semibold">Instant Results</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white flex flex-col items-center animate-bounce z-20">
          <p className="text-sm font-medium mb-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">Scroll to predict</p>
          <BsArrowDown size={30} />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="w-full bg-gradient-to-br from-gray-50 via-white to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                HOW IT WORKS
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-btn2 via-sky-500 to-blue-600 bg-clip-text text-transparent mb-6">
              How Does It Work?
            </h2>
            <div className="h-2 w-32 bg-gradient-to-r from-btn2 to-sky-500 mx-auto rounded-full mb-4"></div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Our advanced AI system uses cutting-edge machine learning to provide accurate disease predictions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">High Accuracy Model</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our model is trained on extensive and diverse datasets, facilitating comprehensive learning. It is rigorously tested, achieving a remarkable <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">98.99% accuracy rate</span> in disease prediction.
                </p>
              </div>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100 hover:border-green-300 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Advanced ML Algorithms</h3>
                <p className="text-gray-700 leading-relaxed">
                  Utilizing supervised learning and advanced Machine Learning algorithms, our model maps symptoms to diseases during training. This approach ensures <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded">precise predictions</span> and empowers proactive healthcare interventions.
                </p>
              </div>
            </div>

            <div className="group bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100 hover:border-purple-300 hover:shadow-2xl hover:scale-105 transition-all duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Timely Interventions</h3>
                <p className="text-gray-700 leading-relaxed">
                  The outcome is a robust disease prediction system capable of accurately identifying health conditions based on symptoms, enabling <span className="font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">timely interventions</span> and informed healthcare decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Form Section */}
      <div className="w-full py-20 font-text bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-btn2 to-sky-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 justify-center">
                <FaHeartbeat className="text-lg" />
                DISEASE PREDICTION
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4 bg-gradient-to-r from-btn2 via-sky-500 to-blue-600 bg-clip-text text-transparent">
              Select Your Symptoms
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Choose up to 3 symptoms to get an accurate disease prediction powered by AI
            </p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-gray-100 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full -ml-32 -mt-32 opacity-20"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full -mr-48 -mb-48 opacity-20"></div>
            
            <div className="relative z-10">
              <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-200 flex items-start gap-3">
                <FaInfoCircle className="text-blue-500 text-xl mt-1 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Note:</span> Select at least one symptom for accurate prediction. For best results, select 2-3 symptoms that you're experiencing.
                </p>
              </div>
              
              <form className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="group">
                      <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <div className="bg-gradient-to-br from-btn2 to-sky-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-md">
                          {num}
                        </div>
                        Symptom {num}
                      </label>
                      <Select
                        name={`symptom${num}`}
                        className="capitalize"
                        value={selectedSymptoms[`symptom${num}`]}
                        onChange={handleSymptomChange}
                        options={symptomsOptions}
                        placeholder="Select symptom..."
                        isClearable
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            borderRadius: '1rem',
                            border: state.isFocused ? '3px solid #0ea5e9' : '2px solid #e5e7eb',
                            padding: '0.5rem',
                            boxShadow: state.isFocused ? '0 0 0 3px rgba(14, 165, 233, 0.1)' : 'none',
                            '&:hover': {
                              borderColor: '#0ea5e9'
                            },
                            transition: 'all 0.3s'
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected 
                              ? '#0ea5e9' 
                              : state.isFocused 
                              ? '#e0f2fe' 
                              : 'white',
                            color: state.isSelected ? 'white' : '#1f2937',
                            padding: '12px',
                            '&:active': {
                              backgroundColor: '#0ea5e9'
                            }
                          })
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Selected Symptoms Display */}
                {(selectedSymptoms.symptom1 || selectedSymptoms.symptom2 || selectedSymptoms.symptom3) && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                    <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <FaCheckCircle className="text-green-600" />
                      Selected Symptoms:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[selectedSymptoms.symptom1, selectedSymptoms.symptom2, selectedSymptoms.symptom3]
                        .filter(Boolean)
                        .map((symptom, idx) => (
                          <span
                            key={idx}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md flex items-center gap-2"
                          >
                            <FaCheckCircle />
                            {symptom.value || symptom.label || symptom}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-10 pt-8 border-t-2 border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer p-5 bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-yellow-300 hover:border-yellow-500 hover:shadow-lg transition-all duration-300 group">
                    <input
                      type="checkbox"
                      checked={useEnhanced}
                      onChange={(e) => setUseEnhanced(e.target.checked)}
                      className="w-6 h-6 text-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-500 cursor-pointer"
                    />
                    <span className="text-base font-bold flex items-center gap-2 text-gray-800 group-hover:text-yellow-700 transition-colors">
                      <FaStar className="text-yellow-500 text-xl" />
                      Enhanced AI Analysis
                      <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">PRO</span>
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handlePredict}
                    disabled={isLoading || (!selectedSymptoms.symptom1 && !selectedSymptoms.symptom2 && !selectedSymptoms.symptom3)}
                    className={`bg-gradient-to-r from-btn2 via-sky-500 to-blue-600 text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:via-sky-500 hover:to-btn2 transform ${
                      isLoading || (!selectedSymptoms.symptom1 && !selectedSymptoms.symptom2 && !selectedSymptoms.symptom3)
                        ? "opacity-50 cursor-not-allowed hover:scale-100"
                        : ""
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <FaStethoscope className="text-xl" />
                        <span>Predict Disease</span>
                        <FaBrain className="text-xl" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Results Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-md animate-fadeIn">
              <div className="bg-white p-8 md:p-10 rounded-3xl w-[95%] max-w-[800px] max-h-[90vh] overflow-y-auto relative shadow-2xl border-4 border-gray-100 animate-slideUp">
                {/* Close Button */}
                <button
                  onClick={closeModal}
                  className="absolute top-6 right-6 text-gray-400 hover:text-red-500 text-4xl font-bold w-12 h-12 flex items-center justify-center rounded-full hover:bg-red-50 transition-all duration-300 z-20"
                >
                  ×
                </button>
                
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="inline-block mb-4">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                      <FaCheckCircle />
                      PREDICTION COMPLETE
                    </div>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-btn2 via-sky-500 to-blue-600 bg-clip-text text-transparent">
                    {predictionData.prediction}
                  </h2>
                  <div className="h-2 w-32 bg-gradient-to-r from-btn2 to-sky-500 mx-auto rounded-full"></div>
                  <div className="mt-4 flex justify-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                      <FaUserMd />
                      {predictionData.specialize}
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* ✅ FIXED: Description Card */}
                  <div className="p-6 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 rounded-2xl border-2 border-blue-200 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                        <FaInfoCircle className="text-white text-xl" />
                      </div>
                      <p className="text-gray-800 font-bold text-xl">
                        What is {predictionData.prediction}?
                      </p>
                    </div>
                    {predictionData.description ? (
                      <p className="text-justify text-gray-700 leading-relaxed text-base">
                        {predictionData.description}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">Description not available</p>
                    )}
                  </div>
                  
                  {/* ✅ FIXED: Precautions Card */}
                  <div className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-2xl border-2 border-green-200 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                        <FaShieldAlt className="text-white text-xl" />
                      </div>
                      <p className="text-gray-800 font-bold text-xl">
                        Precautions for {predictionData.prediction}
                      </p>
                    </div>
                    <div className="text-justify text-gray-700">
                      {Array.isArray(predictionData.precautions) && predictionData.precautions.length > 0 ? (
                        <ul className="space-y-3">
                          {predictionData.precautions.map((precaution, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
                              <span className="font-semibold text-base">{precaution}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">No precautions available</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Specialist Recommendation */}
                  <div className="p-6 bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 rounded-2xl border-2 border-purple-300 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                        <FaUserMd className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-bold text-lg mb-1">
                          Recommended Specialist
                        </p>
                        <p className="text-purple-700 font-extrabold text-xl">
                          {predictionData.specialize}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* ✅ UPDATED: Gemini Analysis Display with Markdown */}
                {predictionData.geminiAnalysis && (
                  <div className="my-6 p-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 rounded-2xl border-2 border-yellow-400 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full -mr-16 -mt-16 opacity-30"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-xl shadow-lg">
                          <FaStar className="text-white text-2xl" />
                        </div>
                        <div>
                          <h3 className="font-bold text-2xl text-gray-800">AI-Enhanced Analysis</h3>
                          <p className="text-sm text-gray-600">Powered by Google Gemini AI</p>
                        </div>
                      </div>
                      
                      {/* ✅ FIXED: Render Markdown properly */}
                      <div className="text-base text-gray-700 max-h-96 overflow-y-auto leading-relaxed bg-white p-6 rounded-xl border-2 border-gray-200 shadow-inner prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            // Style headers
                            h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xl font-bold text-gray-800 mt-5 mb-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-lg font-bold text-gray-700 mt-4 mb-2" {...props} />,
                            
                            // Style paragraphs
                            p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                            
                            // Style lists
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-2" {...props} />,
                            li: ({node, ...props}) => <li className="ml-4" {...props} />,
                            
                            // Style emphasis
                            strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                            em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                            
                            // Style code blocks
                            code: ({node, inline, ...props}) => 
                              inline 
                                ? <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono" {...props} />
                                : <code className="block bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto" {...props} />,
                            
                            // Style blockquotes (for disclaimers)
                            blockquote: ({node, ...props}) => (
                              <blockquote className="border-l-4 border-yellow-400 pl-4 italic text-gray-600 my-3 bg-yellow-50 p-3 rounded-r" {...props} />
                            ),
                            
                            // Style horizontal rules
                            hr: ({node, ...props}) => <hr className="my-4 border-gray-300" {...props} />,
                          }}
                        >
                          {typeof predictionData.geminiAnalysis === 'string' 
                            ? predictionData.geminiAnalysis 
                            : predictionData.geminiAnalysis?.gemini_analysis 
                            || predictionData.geminiAnalysis?.analysis 
                            || "Analysis not available"}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                
                {/* Action Buttons */}
                <div className="my-8 p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 rounded-2xl border-2 border-gray-200 shadow-lg">
                  <p className="text-center text-gray-800 font-bold text-lg mb-6">
                    Next Steps
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      className="bg-gradient-to-r from-btn2 via-sky-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-base hover:from-blue-600 hover:via-sky-500 hover:to-btn2 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform flex items-center justify-center gap-2"
                      href="/book"
                    >
                      <FaUserMd />
                      Book Appointment
                    </a>
                    <a
                      className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-base hover:from-purple-700 hover:via-purple-600 hover:to-purple-500 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform flex items-center justify-center gap-2"
                      href="/tools"
                    >
                      <FaStethoscope />
                      Health Tools
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PredictDisease;
