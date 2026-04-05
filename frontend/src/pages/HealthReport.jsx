import { useState, useEffect } from "react";
import { reportAPI } from "../utils/api";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { FiDownload, FiFileText, FiCalendar, FiActivity, FiHeart, FiClipboard } from "react-icons/fi";

const PERIOD_OPTIONS = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
  { label: "Last 6 months", value: 180 },
  { label: "Last year", value: 365 },
];

export default function HealthReport() {
  const { user } = useAuth();
  const [days, setDays] = useState(90);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [days]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await reportAPI.getSummary(days);
      if (res.success) setSummary(res.data);
    } catch {
      toast.error("Failed to load report summary");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await reportAPI.downloadReport(days);
      toast.success("Report downloaded successfully!");
    } catch {
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="text-2xl text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-24 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <FiFileText /> Health Reports
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-gray-100 mb-3">
            Your Health{" "}
            <span className="bg-gradient-to-r from-btn2 to-btn1 bg-clip-text text-transparent">
              Report
            </span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Download a comprehensive PDF summary of your health data including predictions,
            medications, appointments, and journal entries.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 animate-slideUp">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                days === opt.value
                  ? "bg-gradient-to-r from-btn2 to-btn1 text-white shadow-lg scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-btn2 hover:text-btn2"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-btn2 border-t-transparent" />
          </div>
        ) : summary ? (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <StatCard
                icon={FiActivity}
                label="Predictions"
                value={summary.counts?.predictions || 0}
                color="bg-gradient-to-br from-cyan-500 to-blue-600"
              />
              <StatCard
                icon={FiClipboard}
                label="Medications"
                value={summary.counts?.medications || 0}
                color="bg-gradient-to-br from-green-500 to-emerald-600"
              />
              <StatCard
                icon={FiCalendar}
                label="Appointments"
                value={summary.counts?.appointments || 0}
                color="bg-gradient-to-br from-purple-500 to-violet-600"
              />
              <StatCard
                icon={FiHeart}
                label="Journal Entries"
                value={summary.counts?.journal_entries || 0}
                color="bg-gradient-to-br from-pink-500 to-rose-600"
              />
            </div>

            {/* Report Preview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-8 border border-gray-100 dark:border-gray-700 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Report Preview</h2>
                  <div className="space-y-1.5 text-gray-600 dark:text-gray-400 text-sm">
                    <p><span className="font-semibold">Patient:</span> {summary.profile?.name || user?.name || "User"}</p>
                    <p><span className="font-semibold">Period:</span> Last {summary.period_days} days</p>
                    {summary.metrics?.bmi && (
                      <p><span className="font-semibold">BMI:</span> {summary.metrics.bmi}</p>
                    )}
                    {summary.metrics?.blood_pressure && (
                      <p><span className="font-semibold">Blood Pressure:</span> {summary.metrics.blood_pressure}</p>
                    )}
                    {summary.adherence && summary.adherence.total > 0 && (
                      <p>
                        <span className="font-semibold">Medication Adherence:</span>{" "}
                        {Math.round((summary.adherence.taken / summary.adherence.total) * 100)}%
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="text-6xl text-gray-300 dark:text-gray-600">
                    <FiFileText />
                  </div>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all duration-300 ${
                      downloading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-btn2 to-btn1 hover:from-btn1 hover:to-btn2 hover:shadow-xl hover:scale-105"
                    }`}
                  >
                    {downloading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FiDownload className="text-xl" />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-2xl p-8 border border-blue-100 dark:border-blue-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">What&apos;s Included in Your Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Patient demographics & contact info",
                  "Health metrics (BMI, blood pressure, etc.)",
                  "Active medications & adherence rate",
                  "Disease prediction history with symptoms",
                  "Appointment history with doctor details",
                  "Health journal entries & mood tracking",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="text-green-500 font-bold">✓</span>
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <FiFileText className="text-6xl mx-auto mb-4 opacity-30" />
            <p>No data available for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
