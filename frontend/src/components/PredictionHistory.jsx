import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaStethoscope, FaChartLine } from "react-icons/fa";
import { predictionAPI } from "../utils/api";
import { toast } from "react-toastify";

function PredictionHistory() {
  const [predictions, setPredictions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([
        predictionAPI.getHistory(),
        predictionAPI.getStatistics(),
      ]);

      if (historyData.success) {
        setPredictions(historyData.data.predictions || []);
      }

      if (statsData.success) {
        setStatistics(statsData.data);
      }
    } catch (error) {
      console.error("Error fetching prediction data:", error);
      toast.error("Failed to load prediction history");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-btn2 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading prediction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 font-text py-8">
      <div className="max-w-7xl mx-auto px-5">
        {/* Header */}
        <div className="mb-10">
          <div className="bg-gradient-to-r from-btn2 to-sky-500 rounded-2xl p-8 shadow-xl text-white">
            <h1 className="text-5xl font-bold mb-3">
              Prediction History
            </h1>
            <p className="text-lg text-white/90">
              View and track your past disease predictions with detailed insights
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl group-hover:scale-110 transition-transform">
                  <FaChartLine className="text-blue-600 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-medium">Total Predictions</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    {statistics.total_predictions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-xl group-hover:scale-110 transition-transform">
                  <FaStethoscope className="text-green-600 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-medium">Most Common</p>
                  <p className="text-xl font-bold text-gray-800">
                    {statistics.most_common?.[0]?.disease || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl group-hover:scale-110 transition-transform">
                  <FaCalendarAlt className="text-purple-600 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-medium">Recent Activity</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    {statistics.recent_predictions?.length || 0} Recent
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Most Common Predictions */}
        {statistics && statistics.most_common?.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-2 rounded-lg">
                <FaStethoscope className="text-white text-xl" />
              </div>
              Most Common Health Issues
            </h2>
            <div className="space-y-3">
              {statistics.most_common.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:from-blue-50 hover:to-sky-50 hover:shadow-md transition-all duration-300"
                >
                  <span className="font-bold text-gray-800 text-lg">
                    {item.disease}
                  </span>
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                    {item.count} {item.count === 1 ? "time" : "times"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Predictions List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-gradient-to-br from-btn2 to-sky-500 p-2 rounded-lg">
                <FaStethoscope className="text-white text-xl" />
              </div>
              All Predictions
            </h2>
          </div>

          {predictions.length === 0 ? (
            <div className="p-12 text-center">
              <FaStethoscope className="text-gray-300 text-6xl mx-auto mb-4" />
              <p className="text-gray-500 text-xl font-medium mb-2">
                No predictions found
              </p>
              <p className="text-gray-400">
                Start by making a disease prediction!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {predictions.map((prediction) => (
                <div
                  key={prediction._id}
                  className="p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 transition-all duration-300 cursor-pointer border-l-4 border-transparent hover:border-btn2 group"
                  onClick={() => setSelectedPrediction(prediction)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-btn2 transition-colors">
                          {prediction.ml_prediction || "Unknown Disease"}
                        </h3>
                        {prediction.gemini_enhanced && (
                          <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
                            ⭐ AI Enhanced
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-lg">
                          <FaCalendarAlt className="text-gray-400" />
                          {formatDate(prediction.created_at)}
                        </span>
                      </div>
                      {prediction.symptoms && prediction.symptoms.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2 font-medium">
                            Symptoms:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {prediction.symptoms.slice(0, 5).map((symptom, idx) => (
                              <span
                                key={idx}
                                className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium border border-blue-200"
                              >
                                {symptom}
                              </span>
                            ))}
                            {prediction.symptoms.length > 5 && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                +{prediction.symptoms.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <button className="ml-4 text-btn2 hover:text-sky-600 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                      View Details <span>→</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prediction Detail Modal */}
        {selectedPrediction && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl border-4 border-gray-100">
              <button
                onClick={() => setSelectedPrediction(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 transition-all duration-300"
              >
                ×
              </button>
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-btn2 to-sky-500 bg-clip-text text-transparent">
                  {selectedPrediction.ml_prediction}
                </h2>
                <div className="h-1 w-20 bg-gradient-to-r from-btn2 to-sky-500 rounded-full"></div>
              </div>
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <p className="text-sm font-bold text-gray-600 mb-2">Date:</p>
                  <p className="text-gray-800 font-semibold text-lg">
                    {formatDate(selectedPrediction.created_at)}
                  </p>
                </div>
                {selectedPrediction.symptoms && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-200">
                    <p className="text-sm font-bold text-gray-700 mb-3">
                      Symptoms:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPrediction.symptoms.map((symptom, idx) => (
                        <span
                          key={idx}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm px-4 py-2 rounded-full font-semibold shadow-md"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPrediction.ml_models && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <p className="text-sm font-bold text-gray-700 mb-3">
                      Model Predictions:
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all shadow-md">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Random Forest</p>
                        <p className="font-bold text-gray-800 text-lg">
                          {selectedPrediction.ml_models.rf}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 transition-all shadow-md">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Naive Bayes</p>
                        <p className="font-bold text-gray-800 text-lg">
                          {selectedPrediction.ml_models.nb}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-purple-400 transition-all shadow-md">
                        <p className="text-xs text-gray-600 mb-1 font-medium">SVM</p>
                        <p className="font-bold text-gray-800 text-lg">
                          {selectedPrediction.ml_models.svm}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PredictionHistory;

