import React from "react";
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaFileAlt, FaHeartbeat } from "react-icons/fa";

const ReportAnalysisModal = ({ analysis, onClose }) => {
  if (!analysis) return null;

  const getRiskColor = (risk) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === "low") return "bg-green-100 text-green-700 border-green-300";
    if (riskLower === "medium") return "bg-yellow-100 text-yellow-700 border-yellow-300";
    if (riskLower === "high") return "bg-red-100 text-red-700 border-red-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  const getRiskIcon = (risk) => {
    const riskLower = risk?.toLowerCase();
    if (riskLower === "low") return "✓";
    if (riskLower === "medium") return "⚠";
    if (riskLower === "high") return "⚠";
    return "?";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 rounded-t-2xl relative sticky top-0 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all"
          >
            <FaTimes size={24} />
          </button>
          <div className="flex items-center gap-3">
            <FaFileAlt size={32} />
            <div>
              <h2 className="text-3xl font-bold">Report Analysis</h2>
              <p className="text-white text-opacity-90">AI-powered medical report insights</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Report Type & Risk */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
              <p className="text-sm text-gray-600 font-semibold mb-1">Report Type</p>
              <p className="text-xl font-bold text-gray-800">
                {analysis.report_type || "Medical Report"}
              </p>
            </div>
            <div className={`p-4 rounded-xl border-2 ${getRiskColor(analysis.risk_level)}`}>
              <p className="text-sm font-semibold mb-1">Risk Level</p>
              <p className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">{getRiskIcon(analysis.risk_level)}</span>
                {analysis.risk_level || "Unknown"}
              </p>
            </div>
          </div>

          {/* Date */}
          {analysis.date && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-sm text-gray-600 font-semibold">Report Date: </span>
              <span className="text-gray-800 font-bold">{analysis.date}</span>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-5 rounded-xl border-2 border-blue-200">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
              <FaFileAlt className="text-blue-600" />
              Summary
            </h3>
            <p className="text-gray-700 leading-relaxed">{analysis.summary || "No summary available"}</p>
          </div>

          {/* Key Findings */}
          {analysis.key_findings?.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                Key Findings
              </h3>
              <ul className="space-y-2">
                {analysis.key_findings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-all">
                    <span className="text-green-600 font-bold text-lg">•</span>
                    <span className="text-gray-700 flex-1">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Abnormal Values */}
          {analysis.abnormal_values?.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-600" />
                Abnormal Values
              </h3>
              <div className="space-y-3">
                {analysis.abnormal_values.map((item, idx) => (
                  <div key={idx} className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-800 text-lg">{item.parameter}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        item.status?.toLowerCase() === "high" 
                          ? "bg-red-100 text-red-700" 
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {item.status?.toUpperCase() || "ABNORMAL"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Value: </span>
                        <strong className="text-gray-800">{item.value}</strong>
                      </div>
                      <div>
                        <span className="text-gray-600">Normal: </span>
                        <strong className="text-gray-800">{item.normal_range}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health Metrics */}
          {analysis.health_metrics && Object.keys(analysis.health_metrics).length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FaHeartbeat className="text-red-600" />
                Health Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(analysis.health_metrics).map(([key, value]) => (
                  <div key={key} className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 hover:shadow-md transition-all">
                    <p className="text-sm text-gray-600 font-semibold capitalize mb-1">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-lg font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FaCheckCircle className="text-purple-600" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-purple-50 p-4 rounded-lg border border-purple-200 hover:shadow-md transition-all">
                    <span className="text-purple-600 font-bold">✓</span>
                    <span className="text-gray-700 flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-400">
            <p className="text-sm text-gray-700">
              <strong>⚠️ Disclaimer:</strong> This analysis is AI-generated for informational purposes only. 
              Always consult with healthcare professionals for medical advice and treatment decisions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-2xl border-t">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportAnalysisModal;
