import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaFileExport, FaFileCsv, FaFileCode, FaDatabase, FaDownload, FaChartBar } from "react-icons/fa6";
import { API_BASE_URL } from "../utils/api";

const DATA_TYPES = [
  { key: "predictions", label: "Predictions", icon: "🔮", color: "from-purple-500 to-indigo-500" },
  { key: "appointments", label: "Appointments", icon: "📅", color: "from-blue-500 to-cyan-500" },
  { key: "medications", label: "Medications", icon: "💊", color: "from-green-500 to-emerald-500" },
  { key: "journal", label: "Journal", icon: "📝", color: "from-orange-500 to-amber-500" },
  { key: "family", label: "Family", icon: "👨‍👩‍👧‍👦", color: "from-pink-500 to-rose-500" },
];

const PERIODS = [
  { days: 7, label: "7 Days" },
  { days: 30, label: "30 Days" },
  { days: 90, label: "90 Days" },
  { days: 180, label: "6 Months" },
  { days: 365, label: "1 Year" },
];

export default function ExportData() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);
  const [days, setDays] = useState(90);
  const [selectedTypes, setSelectedTypes] = useState(new Set(DATA_TYPES.map((d) => d.key)));

  useEffect(() => {
    fetchSummary();
  }, [days]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/export/summary?days=${days}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setSummary(data.data);
    } catch {
      toast.error("Failed to load export summary");
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (key) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const downloadCSV = async (dataType) => {
    try {
      setExporting(`csv-${dataType}`);
      const res = await fetch(`${API_BASE_URL}/export/csv/${dataType}?days=${days}`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `health_${dataType}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${dataType} CSV downloaded`);
    } catch {
      toast.error(`Failed to export ${dataType} CSV`);
    } finally {
      setExporting(null);
    }
  };

  const downloadFHIR = async () => {
    try {
      setExporting("fhir");
      const res = await fetch(`${API_BASE_URL}/export/fhir?days=${days}`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `health_fhir_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("FHIR R4 Bundle downloaded");
    } catch {
      toast.error("Failed to export FHIR data");
    } finally {
      setExporting(null);
    }
  };

  const downloadAllCSV = async () => {
    for (const type of selectedTypes) {
      await downloadCSV(type);
    }
  };

  const totalRecords = summary?.total_records || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-2xl mb-4 shadow-lg">
            <FaFileExport />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Export Health Data</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Download your data in CSV or FHIR R4 format</p>
        </motion.div>

        {/* Period Selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                days === p.days
                  ? "bg-gradient-to-r from-btn2 to-sky-500 text-white shadow-md"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        {!loading && summary && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {DATA_TYPES.map((dt) => {
              const count = summary.counts?.[dt.key] || 0;
              const isSelected = selectedTypes.has(dt.key);
              return (
                <motion.button
                  key={dt.key}
                  onClick={() => toggleType(dt.key)}
                  whileTap={{ scale: 0.95 }}
                  className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-btn2 bg-white dark:bg-gray-800 shadow-lg"
                      : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 opacity-60"
                  }`}
                >
                  <div className="text-2xl mb-1">{dt.icon}</div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{dt.label}</div>
                  <div className="text-2xl font-bold text-btn2">{count}</div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-btn2 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-btn2 border-t-transparent"></div>
          </div>
        )}

        {/* Export Options */}
        {!loading && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* CSV Export */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xl">
                  <FaFileCsv />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">CSV Export</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Spreadsheet-compatible format</p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Export individual data categories as CSV files. Compatible with Excel, Google Sheets, and data analysis tools.
              </p>

              <div className="space-y-2 mb-4">
                {DATA_TYPES.filter((dt) => selectedTypes.has(dt.key)).map((dt) => (
                  <div key={dt.key} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {dt.icon} {dt.label} ({summary?.counts?.[dt.key] || 0})
                    </span>
                    <button
                      onClick={() => downloadCSV(dt.key)}
                      disabled={!!exporting}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-md disabled:opacity-50 transition-all flex items-center gap-1"
                    >
                      {exporting === `csv-${dt.key}` ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <FaDownload className="text-[10px]" />
                      )}
                      CSV
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={downloadAllCSV}
                disabled={!!exporting || selectedTypes.size === 0}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exporting?.startsWith("csv") ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <FaDownload />
                )}
                Download All CSV ({selectedTypes.size} files)
              </button>
            </motion.div>

            {/* FHIR Export */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xl">
                  <FaFileCode />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">FHIR R4 Export</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Healthcare interoperability standard</p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Export all health data as a FHIR R4 Transaction Bundle. This standard format can be imported by most healthcare systems worldwide.
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <FaDatabase className="text-blue-500" /> Included Resources
                </h3>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <div>• Patient profile</div>
                  <div>• Conditions (predictions)</div>
                  <div>• Encounters (appointments)</div>
                  <div>• MedicationStatements</div>
                  <div>• Observations (journal)</div>
                  <div>• RelatedPerson (family)</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <FaChartBar className="text-btn2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total records: <span className="text-btn2 font-bold">{totalRecords}</span>
                </span>
              </div>

              <button
                onClick={downloadFHIR}
                disabled={!!exporting || totalRecords === 0}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-indigo-500 hover:to-blue-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exporting === "fhir" ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <FaDownload />
                )}
                Download FHIR R4 Bundle
              </button>
            </motion.div>
          </div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">About Data Formats</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">CSV (Comma-Separated Values)</h4>
              <p>Universal spreadsheet format. Open with Excel, Google Sheets, or any data analysis tool. Best for personal record-keeping and simple analysis.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">FHIR R4 (Fast Healthcare Interoperability Resources)</h4>
              <p>International healthcare data standard. Share your records with doctors, hospitals, and health apps that support FHIR. Ensures data portability across systems.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
