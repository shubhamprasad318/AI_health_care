import React, { useState } from "react";
import { 
  FaPills, 
  FaTimes, 
  FaPlus, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaDownload, 
  FaSave,
  FaInfoCircle 
} from "react-icons/fa";
import { geminiAPI } from "../utils/api";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import jsPDF from "jspdf";

const DrugInteractionChecker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [medications, setMedications] = useState(["", ""]);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);

  // ✅ Common medications database for autocomplete
  const commonMedications = [
    "Paracetamol", "Dolo", "Acetaminophen", "Ibuprofen", "Aspirin",
    "Amoxicillin", "Azithromycin", "Ciprofloxacin", "Metformin", 
    "Atorvastatin", "Amlodipine", "Losartan", "Omeprazole",
    "Levothyroxine", "Metoprolol", "Lisinopril", "Simvastatin",
    "Clopidogrel", "Warfarin", "Insulin", "Gabapentin",
    "Sertraline", "Fluoxetine", "Alprazolam", "Diazepam",
    "Tramadol", "Codeine", "Morphine", "Prednisone",
    "Montelukast", "Albuterol", "Ranitidine", "Pantoprazole",
    "Metronidazole", "Clarithromycin", "Doxycycline", "Cetirizine",
    "Loratadine", "Fexofenadine", "Salbutamol", "Furosemide"
  ];

  // ✅ Handle medication input with autocomplete
  const handleMedicationChange = (index, value) => {
    const updated = [...medications];
    updated[index] = value;
    setMedications(updated);

    // Show autocomplete suggestions
    if (value.length > 1) {
      const filtered = commonMedications.filter(med =>
        med.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6));
      setActiveSuggestionIndex(index);
    } else {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
    }
  };

  // ✅ Select autocomplete suggestion
  const selectSuggestion = (index, suggestion) => {
    const updated = [...medications];
    updated[index] = suggestion;
    setMedications(updated);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
  };

  const handleAddMedication = () => {
    if (medications.length < 10) {
      setMedications([...medications, ""]);
    } else {
      toast.warning("Maximum 10 medications allowed");
    }
  };

  const handleRemoveMedication = (index) => {
    if (medications.length > 2) {
      setMedications(medications.filter((_, i) => i !== index));
    } else {
      toast.warning("At least 2 medications required");
    }
  };

  // ✅ Determine severity level with color coding
  const getSeverityInfo = (analysis) => {
    const lower = analysis.toLowerCase();
    
    if (lower.includes("severe") || lower.includes("contraindicated") || lower.includes("dangerous") || lower.includes("overdose")) {
      return {
        level: "Severe",
        color: "red",
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        textColor: "text-red-800",
        gradientFrom: "from-red-500",
        gradientTo: "to-red-600",
        icon: FaExclamationTriangle
      };
    } else if (lower.includes("moderate") || lower.includes("caution") || lower.includes("monitor")) {
      return {
        level: "Moderate",
        color: "yellow",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-300",
        textColor: "text-yellow-800",
        gradientFrom: "from-yellow-500",
        gradientTo: "to-orange-500",
        icon: FaExclamationTriangle
      };
    } else if (lower.includes("minor") || lower.includes("mild")) {
      return {
        level: "Minor",
        color: "blue",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-300",
        textColor: "text-blue-800",
        gradientFrom: "from-blue-500",
        gradientTo: "to-blue-600",
        icon: FaInfoCircle
      };
    } else if (lower.includes("no interaction") || lower.includes("safe") || lower.includes("no significant")) {
      return {
        level: "Safe",
        color: "green",
        bgColor: "bg-green-50",
        borderColor: "border-green-300",
        textColor: "text-green-800",
        gradientFrom: "from-green-500",
        gradientTo: "to-green-600",
        icon: FaCheckCircle
      };
    }
    
    return {
      level: "Unknown",
      color: "gray",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-300",
      textColor: "text-gray-800",
      gradientFrom: "from-gray-500",
      gradientTo: "to-gray-600",
      icon: FaInfoCircle
    };
  };

  const handleCheck = async () => {
    const validMeds = medications.filter((med) => med.trim());
    if (validMeds.length < 2) {
      toast.error("Please enter at least 2 medications");
      return;
    }

    setIsLoading(true);
    setShowResults(false);
    
    try {
      const response = await geminiAPI.checkDrugInteractions(validMeds);
      if (response.success && response.data) {
        const analysisText = typeof response.data.analysis === "string"
          ? response.data.analysis
          : JSON.stringify(response.data.analysis, null, 2);
        
        setResult(analysisText);
        setShowResults(true);
        toast.success("Analysis complete!");
      } else {
        throw new Error(response.message || "Failed to check interactions");
      }
    } catch (error) {
      console.error("Error checking interactions:", error);
      toast.error("Failed to check drug interactions");
      setResult("Unable to check interactions at this time.");
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Export to PDF
  const exportToPDF = () => {
    if (!result) return;

    const validMeds = medications.filter(med => med.trim());
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(128, 90, 213); // Purple
    doc.text("Drug Interaction Report", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });
    
    // Medications section
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Medications Analyzed:", 20, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    validMeds.forEach((med, idx) => {
      doc.text(`${idx + 1}. ${med}`, 25, yPos);
      yPos += 6;
    });

    // Analysis section
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Interaction Analysis:", 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Remove markdown syntax for PDF
    const cleanText = result
      .replace(/[#*_]/g, "")
      .replace(/\n{3,}/g, "\n\n");
    
    const lines = doc.splitTextToSize(cleanText, pageWidth - 40);
    
    lines.forEach(line => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos);
      yPos += 5;
    });

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | AI Health Platform`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      doc.text(
        "This report is for informational purposes only. Consult a healthcare professional.",
        pageWidth / 2,
        pageHeight - 6,
        { align: "center" }
      );
    }

    doc.save(`drug-interaction-${Date.now()}.pdf`);
    toast.success("📄 PDF downloaded successfully!");
  };

  // ✅ Save to profile
  const saveToProfile = () => {
    try {
      const validMeds = medications.filter(med => med.trim());
      const reportData = {
        medications: validMeds,
        analysis: result,
        timestamp: new Date().toISOString(),
        severity: getSeverityInfo(result).level
      };

      const existingReports = JSON.parse(
        localStorage.getItem("drugInteractionReports") || "[]"
      );
      
      existingReports.push(reportData);
      localStorage.setItem("drugInteractionReports", JSON.stringify(existingReports));
      
      toast.success("💾 Report saved to your profile!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save report");
    }
  };

  const severityInfo = result ? getSeverityInfo(result) : null;
  const SeverityIcon = severityInfo?.icon;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition shadow-md hover:shadow-lg"
      >
        <FaPills />
        Check Drug Interactions
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 rounded-t-2xl relative">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setMedications(["", ""]);
                  setResult("");
                  setShowResults(false);
                  setSuggestions([]);
                }}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition"
              >
                <FaTimes size={24} />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <FaPills size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Drug Interaction Checker</h2>
                  <p className="text-white text-opacity-90 text-sm">
                    Check interactions between medications
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Enter Medications (at least 2 required):
                </label>
                
                {medications.map((med, index) => (
                  <div key={index} className="mb-3 relative">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={med}
                          onChange={(e) => handleMedicationChange(index, e.target.value)}
                          placeholder={`Medication ${index + 1}`}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 transition"
                        />
                        
                        {/* ✅ Autocomplete dropdown */}
                        {activeSuggestionIndex === index && suggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border-2 border-purple-300 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            {suggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                onClick={() => selectSuggestion(index, suggestion)}
                                className="px-4 py-2 hover:bg-purple-50 cursor-pointer transition flex items-center gap-2"
                              >
                                <FaPills className="text-purple-500 text-sm" />
                                <span className="text-gray-800">{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {medications.length > 2 && (
                        <button
                          onClick={() => handleRemoveMedication(index)}
                          className="bg-red-500 text-white px-4 rounded-xl hover:bg-red-600 transition"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {medications.length < 10 && (
                  <button
                    onClick={handleAddMedication}
                    className="w-full mt-2 px-4 py-3 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <FaPlus />
                    Add Another Medication
                  </button>
                )}
              </div>

              <button
                onClick={handleCheck}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white py-4 rounded-xl hover:from-purple-600 hover:to-purple-800 disabled:opacity-50 transition shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FaPills />
                    Check Interactions
                  </>
                )}
              </button>

              {/* ✅ Results with color coding */}
              {showResults && result && severityInfo && (
                <div className="mt-6 space-y-4">
                  {/* Severity badge */}
                  <div className={`p-4 rounded-xl ${severityInfo.bgColor} border-2 ${severityInfo.borderColor}`}>
                    <div className="flex items-center gap-3">
                      <div className={`bg-gradient-to-br ${severityInfo.gradientFrom} ${severityInfo.gradientTo} p-3 rounded-full text-white`}>
                        <SeverityIcon size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Severity Level</p>
                        <p className={`text-2xl font-bold ${severityInfo.textColor}`}>
                          {severityInfo.level}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Analysis content */}
                  <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <FaInfoCircle className="text-purple-600" />
                      Analysis Results:
                    </h3>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {result}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={exportToPDF}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <FaDownload />
                      Export PDF
                    </button>
                    
                    <button
                      onClick={saveToProfile}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <FaSave />
                      Save to Profile
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Generated on {new Date().toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DrugInteractionChecker;
