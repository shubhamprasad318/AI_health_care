import React, { useState } from "react";
import { FaFileMedical, FaTimes, FaCheckCircle } from "react-icons/fa";
import { geminiAPI } from "../utils/api";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const HealthPlanGenerator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { email, loggedIn } = useAuth();

  const handleGenerate = async () => {
    if (!loggedIn || !email) {
      toast.error("Please login to generate a health plan");
      return;
    }

    setIsLoading(true);
    try {
      const response = await geminiAPI.generateHealthPlan();
      if (response.success && response.data) {
        setPlan(response.data);
        toast.success("Health plan generated successfully!");
      } else {
        throw new Error(
          response.message ||
            "No recent diagnosis found. Please complete a disease prediction first."
        );
      }
    } catch (error) {
      console.error("Error generating health plan:", error);
      toast.error(
        error.message ||
          "Please complete a disease prediction first to generate a personalized health plan."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition shadow-md hover:shadow-lg"
      >
        <FaFileMedical />
        Generate Health Plan
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-6 rounded-t-2xl relative sticky top-0 z-10">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setPlan(null);
                }}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition"
              >
                <FaTimes size={24} />
              </button>

              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <FaFileMedical size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">
                    Personalized Health Plan
                  </h2>
                  <p className="text-white text-opacity-90 text-sm">
                    4-Week Health Management Program
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {!plan ? (
                <div className="text-center py-12">
                  <div className="bg-green-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <FaFileMedical className="text-green-500 text-5xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Ready to Create Your Health Plan?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Get a personalized 4-week health management plan based on
                    your recent diagnosis. This plan includes daily routines,
                    dietary recommendations, and lifestyle modifications.
                  </p>

                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-500 to-green-700 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-800 disabled:opacity-50 transition shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center gap-2 mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Generating Your Plan...
                      </>
                    ) : (
                      <>
                        <FaCheckCircle />
                        Generate My Health Plan
                      </>
                    )}
                  </button>

                  {isLoading && (
                    <p className="text-gray-500 text-sm mt-4 animate-pulse">
                      This may take a few moments...
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Success Badge */}
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-xl border-2 border-green-200">
                    <FaCheckCircle size={24} />
                    <span className="font-semibold">
                      Your personalized health plan is ready!
                    </span>
                  </div>

                  {/* Plan Content */}
                  {plan.plan && (
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200 p-8 shadow-lg">
                      <div className="prose prose-base max-w-none 
                        prose-headings:text-green-800 
                        prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-8 prose-h1:pb-3 prose-h1:border-b-2 prose-h1:border-green-300
                        prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-green-700
                        prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-green-600
                        prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base
                        prose-li:text-gray-700 prose-li:my-2 prose-li:leading-relaxed
                        prose-strong:text-green-800 prose-strong:font-bold
                        prose-table:text-sm prose-table:my-6
                        prose-th:bg-green-100 prose-th:p-3 prose-th:font-bold prose-th:text-green-900
                        prose-td:p-3 prose-td:border prose-td:border-green-200
                        prose-ul:my-4 prose-ul:space-y-2
                        prose-ol:my-4 prose-ol:space-y-2
                        ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {typeof plan.plan === "string"
                            ? plan.plan
                            : plan.plan.plan || JSON.stringify(plan.plan, null, 2)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}


                  {/* Disclaimer */}
                  {plan.note && (
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                      <div className="flex gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <h4 className="font-bold text-yellow-800 mb-1">
                            Important Disclaimer
                          </h4>
                          <p className="text-sm text-yellow-700">{plan.note}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => window.print()}
                      className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition shadow-md hover:shadow-lg font-semibold"
                    >
                      📄 Print Plan
                    </button>
                    <button
                      onClick={() => {
                        setPlan(null);
                        handleGenerate();
                      }}
                      className="flex-1 bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition shadow-md hover:shadow-lg font-semibold"
                    >
                      🔄 Generate New Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HealthPlanGenerator;
