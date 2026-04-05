import React from "react";
import SymptomAnalyzer from "../components/SymptomAnalyzer";
import DrugInteractionChecker from "../components/DrugInteractionChecker";
import HealthPlanGenerator from "../components/HealthPlanGenerator";
import { FaStethoscope, FaPills, FaFileMedical, FaBrain } from "react-icons/fa";

function HealthTools() {
  return (
    <div className="w-full min-h-screen bg-lightBackground dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-text py-10 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-5">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-lightText dark:text-gray-100 mb-4">
            AI Health Tools
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Advanced AI-powered tools to help you understand and manage your health
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Symptom Analyzer */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
                <FaStethoscope className="text-orange-500 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Symptom Analyzer
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Advanced AI analysis of your symptoms
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Get detailed analysis of your symptoms with possible conditions,
              urgency levels, and recommended next steps.
            </p>
            <SymptomAnalyzer />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                <FaPills className="text-purple-500 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Drug Interaction Checker
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check interactions between medications
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Verify potential interactions between multiple medications before
              taking them together.
            </p>
            <DrugInteractionChecker />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                <FaFileMedical className="text-green-500 text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  Health Plan Generator
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Personalized 4-week health management plan
                </p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Generate a comprehensive, personalized health management plan based
              on your recent diagnosis.
            </p>
            <HealthPlanGenerator />
          </div>

          {/* AI Assistant Info */}
          <div className="bg-gradient-to-br from-btn2 to-btn1 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-full">
                <FaBrain className="text-2xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Health Assistant</h2>
                <p className="text-sm text-white text-opacity-90">
                  Available 24/7
                </p>
              </div>
            </div>
            <p className="mb-4 text-white text-opacity-90">
              Chat with our AI health assistant anytime for instant health
              guidance, medical term explanations, and personalized advice.
            </p>
            <p className="text-sm text-white text-opacity-75">
              Click the chat icon in the bottom right corner to start a
              conversation!
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-10 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-3">
            Important Information
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              These tools are powered by Google Gemini AI and are for
              educational purposes only.
            </li>
            <li>
              Always consult qualified healthcare professionals for accurate
              diagnosis and treatment.
            </li>
            <li>
              Do not use these tools as a substitute for professional medical
              advice.
            </li>
            <li>
              In case of medical emergencies, contact emergency services
              immediately.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HealthTools;

