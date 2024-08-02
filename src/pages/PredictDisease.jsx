import React, { useState } from "react";
import { MdClose } from "react-icons/md";
import Select from "react-select";
import { BsArrowDown } from "react-icons/bs";

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
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState({
    symptom1: "",
    symptom2: "",
    symptom3: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handlePredict = async () => {
    try {
      const response = await fetch("http://localhost:5000/diseasepredict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedSymptoms),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        console.error("Error predicting disease:", data.error);
      } else {
        setPredictionData({
          prediction: data.prediction,
          description: data.description,
          precautions: data.precautions,
          specialize: data.specialize,
        });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error predicting disease:", error.message);
    }
  };

  // hello

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
    <div className="">
      <div className="w-full h-[200px] bg-img3 relative">
        <div className="w-full h-full bg-black  bg-opacity-30 ">
          <h1 className="flex flex-col justify-center items-center w-full h-full text-3xl font-bold text-gray-100">
            Advanced Disease Prediction{" "}
            <span className="font-semibold text-2xl italic text-gray-300">
              "Empowering Health Through Technology"
            </span>
          </h1>
          <p className="absolute bottom-5 left-2 text-xs text-gray-300 flex items-center">
            {" "}
            <BsArrowDown size={30} className="p-2 animate-bounce"/>
            Scroll down to predict
          </p>
        </div>
      </div>
      <div className="w-full flex justify-between p-10  bg-gray-100">
        <div className="w-1/2 flex justify-center items-center">
          <h2 className="text-lightText capitalize text-6xl">
            How does it work?
          </h2>
        </div>
        <div className="w-2/3 flex justify-center items-center text-gray-700">
          <ul className="px-2">
            <li className="py-2 px-2 border-l-2 border-lightText mb-2 text-justify">
              Our model is trained on extensive and diverse datasets,
              facilitating comprehensive learning. It is rigorously tested,
              achieving a remarkable 98.99% accuracy rate in disease prediction,
              ensuring reliable and effective healthcare outcomes.
            </li>
            <li className="py-2 px-2 border-l-2 border-lightText mb-2 text-justify">
              Utilizing supervised learning and advanced Machine Learning
              algorithms, our model maps symptoms to diseases during training.
              This approach ensures precise predictions and empowers proactive
              healthcare interventions.
            </li>
            <li className="py-2 px-2 border-l-2 border-lightText mb-2 text-justify">
              The outcome is a robust disease prediction system capable of
              accurately identifying health conditions based on symptoms,
              enabling timely interventions and informed healthcare decisions
              for improved patient outcomes.
            </li>
          </ul>
        </div>
      </div>
      <div className="w-full my-40 font-text">
        <div className="flex justify-center mt-10">
          <form className="">
            <div className="flex">
              <div className="mx-3">
                <label>
                  Symptom 1:
                  <Select
                    name="symptom1"
                    className="capitalize mx-2 w-[250px]"
                    value={selectedSymptoms.symptom1}
                    onChange={handleSymptomChange}
                    options={symptomsOptions}
                    placeholder="--Symptom--"
                    isClearable
                  />
                </label>
              </div>
              <div className="mx-3">
                <label>
                  Symptom 2:
                  <Select
                    name="symptom2"
                    className="capitalize mx-2 w-[250px]"
                    value={selectedSymptoms.symptom2}
                    onChange={handleSymptomChange}
                    options={symptomsOptions}
                    placeholder="--Symptom--"
                    isClearable
                  />
                </label>
              </div>
              <div className="mx-3">
                <label>
                  Symptom 3:
                  <Select
                    name="symptom3"
                    className="capitalize mx-2 w-[250px]"
                    value={selectedSymptoms.symptom3}
                    onChange={handleSymptomChange}
                    options={symptomsOptions}
                    placeholder="--Symptom--"
                    isClearable
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handlePredict}
                className="bg-btn2 px-4 py-2 rounded mt-5"
              >
                Predict
              </button>
            </div>
          </form>
          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white p-8 rounded-lg w-[500px] relative">
                <h2 className="text-2xl font-bold mb-4">
                  Predicted Disease: {predictionData.prediction}
                </h2>
                <p className="text-gray-800 font-medium text-sm">
                  What is {predictionData.prediction}?
                </p>
                <p className="mb-4 text-justify text-xs text-gray-700">
                  {predictionData.description}
                </p>
                <p className="text-gray-800 font-medium text-sm">
                  What precaution you should take for{" "}
                  {predictionData.prediction}?
                </p>
                <p className="mb-4 text-justify text-xs text-gray-700">
                  {predictionData.precautions}
                </p>
                <p className="text-lightText font-medium">
                  We would suggest to visit a {predictionData.specialize}.
                </p>
                <div className="my-5 flex justify-center items-center h-[1px] bg-gray-200"></div>
                <p className="mt-5 text-xs text-gray-500 font-bold">
                  Would you like to book an appointment and receive expert
                  advice from a {predictionData.specialize}?
                </p>
                <a
                  className="underline text-btn2 font-black text-sm flex justify-center items-center w-full my-2"
                  href="/book"
                >
                  Book Appointment
                </a>
                <button
                  onClick={closeModal}
                  className=" absolute top-4 right-6 text-gray-500"
                >
                  <MdClose />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PredictDisease;
