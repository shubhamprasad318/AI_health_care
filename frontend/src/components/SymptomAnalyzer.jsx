import React, { useState } from "react";
import { FaStethoscope, FaTimes, FaExclamationCircle } from "react-icons/fa";
import { geminiAPI } from "../utils/api";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SymptomAnalyzer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [symptomsText, setSymptomsText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

 const handleAnalyze = async () => {
  if (!symptomsText.trim()) {
    toast.error("Please enter your symptoms");
    return;
  }

  setIsLoading(true);
  try {
    // ✅ PASS STRING DIRECTLY - No object wrapper
    const response = await geminiAPI.analyzeSymptoms(symptomsText.trim());
    
    console.log("Symptom analysis response:", response);
    
    if (response.success && response.data) {
      setAnalysis(response.data);
      toast.success("Analysis complete!");
    } else {
      throw new Error(response.message || "Failed to analyze symptoms");
    }
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    toast.error("Failed to analyze symptoms");
    setAnalysis({ error: "Unable to analyze symptoms at this time." });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition shadow-md hover:shadow-lg"
      >
        <FaStethoscope />
        Analyze Symptoms
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-700 text-white p-6 rounded-t-2xl relative">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSymptomsText("");
                  setAnalysis(null);
                }}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition"
              >
                <FaTimes size={24} />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <FaStethoscope size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Advanced Symptom Analysis</h2>
                  <p className="text-white text-opacity-90 text-sm">
                    Powered by Google Gemini AI
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Describe your symptoms in detail:
                </label>
                <textarea
                  value={symptomsText}
                  onChange={(e) => setSymptomsText(e.target.value)}
                  placeholder="e.g., I've been experiencing severe headaches for 3 days, along with nausea, sensitivity to light, and dizziness. The pain is mostly on the right side of my head..."
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 rounded-xl focus:outline-none focus:border-orange-500 transition resize-none"
                  rows={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  💡 Tip: Include duration, severity, location, and any related symptoms for better analysis
                </p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isLoading || !symptomsText.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-700 text-white py-4 rounded-xl hover:from-orange-600 hover:to-orange-800 disabled:opacity-50 transition shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FaStethoscope />
                    Analyze Symptoms
                  </>
                )}
              </button>

              {analysis && (
                <div className="mt-6">
                  {analysis.error ? (
                    // ✅ Changed from red to yellow/orange theme
                    <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl border-2 border-yellow-400 dark:border-yellow-700">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-400 p-3 rounded-full">
                          <FaExclamationCircle className="text-white text-xl" />
                        </div>
                        <div>
                          <h4 className="font-bold text-yellow-800 text-lg">Unable to Complete Analysis</h4>
                          <p className="text-yellow-700 mt-1">{analysis.error}</p>
                          <p className="text-yellow-600 text-sm mt-2">
                            Please try again or contact support if the issue persists.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-orange-50 dark:bg-orange-950/30 rounded-xl border-2 border-orange-200 dark:border-orange-800">
                      <h3 className="font-bold text-lg mb-4 text-orange-800 flex items-center gap-2">
                        <FaStethoscope />
                        Analysis Results:
                      </h3>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {typeof analysis.analysis === "string"
                            ? analysis.analysis
                            : JSON.stringify(analysis, null, 2)}
                        </ReactMarkdown>
                      </div>
                      {analysis.disclaimer && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                            ⚠️ {analysis.disclaimer}
                          </p>
                        </div>
                      )}
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                          ⚕️ This is an AI-generated symptom assessment for informational purposes only. It is NOT a clinical diagnosis. If symptoms are severe, worsening, or you are unsure, seek medical attention immediately.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SymptomAnalyzer;

