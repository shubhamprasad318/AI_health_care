import React, { useState } from "react";
import { FaInfoCircle, FaTimes } from "react-icons/fa";
import { geminiAPI } from "../utils/api";
import { toast } from "react-toastify";

const MedicalTermExplainer = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleExplain = async () => {
    if (!term) return;
    
    setIsOpen(true);
    setIsLoading(true);
    
    try {
      const response = await geminiAPI.explainMedicalTerm(term);
      if (response.success && response.data) {
        setExplanation(response.data.explanation || response.data);
      } else {
        throw new Error(response.message || "Failed to get explanation");
      }
    } catch (error) {
      console.error("Error explaining term:", error);
      toast.error("Failed to get medical term explanation");
      setExplanation("Unable to explain this term at this time.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <span
        onClick={handleExplain}
        className="inline-flex items-center gap-1 text-btn2 cursor-pointer hover:underline"
        title="Click to explain this medical term"
      >
        {children || term}
        <FaInfoCircle className="text-xs" />
      </span>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-lightText">
                Medical Term: {term}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={24} />
              </button>
            </div>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin text-btn2 text-2xl">⏳</div>
              </div>
            ) : (
              <div className="text-gray-700 whitespace-pre-wrap">
                {explanation}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MedicalTermExplainer;

