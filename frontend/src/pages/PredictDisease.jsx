import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "react-router-dom";
import {
  FaStar,
  FaStethoscope,
  FaBrain,
  FaShieldAlt,
  FaCheckCircle,
  FaInfoCircle,
  FaHeartbeat,
  FaUserMd,
  FaSearch,
  FaTrash,
  FaExclamationTriangle,
  FaPhoneAlt,
} from "react-icons/fa";
import { BsArrowDown } from "react-icons/bs";
import VoiceInput from "../components/VoiceInput";
import { predictionAPI } from "../utils/api";

const MAX_EVIDENCES = 30;

// Shown above the result when the backend flags warning signs
// (backend/services/red_flags.py), whatever condition the model predicts
function UrgentCareBanner({ redFlags }) {
  const emergency = redFlags.level === "emergency";
  return (
    <div
      role="alert"
      className={`mb-6 mt-6 p-5 rounded-2xl border-2 ${
        emergency
          ? "bg-red-50 border-red-400 dark:bg-red-950/40 dark:border-red-700"
          : "bg-amber-50 border-amber-400 dark:bg-amber-950/30 dark:border-amber-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <FaExclamationTriangle
          className={`mt-1 shrink-0 text-2xl ${
            emergency ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
          }`}
        />
        <div className="flex-1">
          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
            {emergency ? "Seek emergency care now" : "See a doctor today"}
          </h3>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{redFlags.message}</p>
          {redFlags.reasons?.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-gray-800 dark:text-gray-200">
              {redFlags.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="tel:112"
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold shadow ${
                emergency
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border-2 border-red-600 text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              }`}
            >
              <FaPhoneAlt /> Call 112
            </a>
            {!emergency && (
              <a
                href="/book"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 font-bold text-white shadow hover:bg-amber-700"
              >
                <FaUserMd /> Book a doctor today
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const LAYPERSON_NAMES = {
  "Acute COPD exacerbation / infection": "flare-up of long-term lung disease (COPD)",
  "Acute dystonic reactions": "sudden drug-induced muscle spasm",
  "Acute laryngitis": "voice box infection",
  "Acute otitis media": "middle ear infection",
  "Acute pulmonary edema": "sudden fluid build-up in the lungs",
  "Acute rhinosinusitis": "sinus infection",
  "Allergic sinusitis": "allergy-driven sinus inflammation",
  "Anaphylaxis": "severe whole-body allergic reaction",
  "Anemia": "low red blood cell count",
  "Atrial fibrillation": "irregular fast heartbeat",
  "Boerhaave": "torn esophagus (rare emergency)",
  "Bronchiectasis": "permanently damaged airways",
  "Bronchiolitis": "small-airway infection (common in children)",
  "Bronchitis": "inflamed breathing tubes (chest cold)",
  "Bronchospasm / acute asthma exacerbation": "asthma attack",
  "Chagas": "parasitic infection (from kissing bugs)",
  "Chronic rhinosinusitis": "long-term sinus inflammation",
  "Cluster headache": "severe one-sided headache (in clusters)",
  "Croup": "child's barking-cough airway infection",
  "Ebola": "Ebola virus disease",
  "Epiglottitis": "swelling above the voice box blocking breathing (emergency)",
  "GERD": "chronic acid reflux",
  "Guillain-Barré syndrome": "autoimmune nerve attack causing weakness",
  "HIV (initial infection)": "early HIV infection",
  "Influenza": "the flu",
  "Inguinal hernia": "groin hernia",
  "Larygospasm": "sudden voice-box spasm",
  "Localized edema": "swelling in one body part",
  "Myasthenia gravis": "autoimmune muscle-weakness disease",
  "Myocarditis": "inflammation of the heart muscle",
  "PSVT": "sudden episode of fast heartbeat",
  "Pancreatic neoplasm": "pancreatic tumor",
  "Panic attack": "intense anxiety episode",
  "Pericarditis": "inflammation of the sac around the heart",
  "Pneumonia": "lung infection",
  "Possible NSTEMI / STEMI": "possible heart attack",
  "Pulmonary embolism": "blood clot in the lungs",
  "Pulmonary neoplasm": "lung tumor",
  "SLE": "lupus (autoimmune disease affecting multiple organs)",
  "Sarcoidosis": "inflammatory disease forming small lumps in organs",
  "Scombroid food poisoning": "fish-toxin food poisoning",
  "Spontaneous pneumothorax": "collapsed lung",
  "Spontaneous rib fracture": "rib fracture without obvious injury",
  "Stable angina": "predictable chest pain from heart strain",
  "Tuberculosis": "TB — bacterial lung infection",
  "URTI": "upper respiratory infection (common cold)",
  "Unstable angina": "new or worsening chest pain (cardiac warning sign)",
  "Viral pharyngitis": "viral sore throat",
  "Whooping cough": "pertussis — severe coughing illness",
};

function ClinicalName({ name, size = "sm" }) {
  const layperson = LAYPERSON_NAMES[name];
  if (!layperson) return <>{name}</>;
  return (
    <span className="inline-flex items-baseline gap-1.5 group">
      <span>{name}</span>
      <span
        tabIndex={0}
        role="button"
        aria-label={`Plain language: ${layperson}`}
        className={`relative inline-block ${
          size === "lg" ? "text-base" : "text-xs"
        } text-gray-400 cursor-help focus:outline-none focus:text-btn2 hover:text-btn2 transition`}
      >
        <FaInfoCircle />
        <span className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 bg-gray-900 text-white text-xs font-normal not-italic text-left px-3 py-2 rounded-lg shadow-xl w-56 whitespace-normal pointer-events-none">
          <span className="block font-semibold mb-1 text-yellow-300">In plain English:</span>
          {layperson}
        </span>
      </span>
    </span>
  );
}

const SEARCH_STOPWORDS = new Set([
  "have", "having", "with", "since", "from", "that", "this", "feel", "feeling",
  "very", "some", "also", "days", "today", "yesterday", "week", "morning", "night",
]);

function PredictDisease() {
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  // Landing page hands off a symptom via ?q= so the search starts pre-filled
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") || "");
  const [tab, setTab] = useState("symptoms");

  const [selectedTokens, setSelectedTokens] = useState(new Set());
  const [categoricalSelections, setCategoricalSelections] = useState({});

  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [useEnhanced, setUseEnhanced] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tokenToQuestion = useRef({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await predictionAPI.getEvidences("en");
        if (cancelled) return;
        const evidences = response?.data?.evidences || [];
        const lookup = {};
        for (const ev of evidences) {
          lookup[ev.code] = ev.question;
          for (const v of ev.possible_values || []) {
            lookup[v.token] = `${ev.question} - ${v.label}`;
          }
        }
        tokenToQuestion.current = lookup;
        setCatalog(evidences);
      } catch (err) {
        console.warn("Failed to load evidence catalog:", err);
        toast.error("Could not load symptom catalog. Refresh and try again.");
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { symptomEvidences, antecedentEvidences } = useMemo(() => {
    const lower = search.trim().toLowerCase();
    // Free text ("fever and cough since yesterday") matches on any meaningful word
    const words = lower.split(/[^a-z\u0900-\u097f]+/).filter((w) => w.length >= 4 && !SEARCH_STOPWORDS.has(w));
    const filter = (e) => {
      if (!lower) return true;
      const q = e.question.toLowerCase();
      return q.includes(lower) || e.code.toLowerCase().includes(lower) || words.some((w) => q.includes(w));
    };
    return {
      symptomEvidences: catalog.filter((e) => !e.is_antecedent).filter(filter),
      antecedentEvidences: catalog.filter((e) => e.is_antecedent).filter(filter),
    };
  }, [catalog, search]);

  const selectedSummary = useMemo(() => {
    return [...selectedTokens]
      .map((t) => ({ token: t, label: tokenToQuestion.current[t] || t }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedTokens]);

  const toggleBinary = (code) => {
    const next = new Set(selectedTokens);
    if (next.has(code)) {
      next.delete(code);
    } else {
      if (next.size >= MAX_EVIDENCES) {
        toast.info(`Maximum ${MAX_EVIDENCES} evidences selected.`);
        return;
      }
      next.add(code);
    }
    setSelectedTokens(next);
  };

  const setCategoricalValue = (code, valueToken) => {
    const next = new Set(selectedTokens);
    const prevToken = categoricalSelections[code];
    if (prevToken) next.delete(prevToken);
    if (valueToken) {
      if (next.size >= MAX_EVIDENCES && !prevToken) {
        toast.info(`Maximum ${MAX_EVIDENCES} evidences selected.`);
        return;
      }
      next.add(valueToken);
    }
    setSelectedTokens(next);
    setCategoricalSelections({ ...categoricalSelections, [code]: valueToken });
  };

  const removeToken = (token) => {
    const next = new Set(selectedTokens);
    next.delete(token);
    setSelectedTokens(next);
    const cleanedCategoricals = { ...categoricalSelections };
    for (const [code, val] of Object.entries(cleanedCategoricals)) {
      if (val === token) delete cleanedCategoricals[code];
    }
    setCategoricalSelections(cleanedCategoricals);
  };

  const clearAll = () => {
    setSelectedTokens(new Set());
    setCategoricalSelections({});
  };

  const handleVoiceTranscript = (text) => {
    setSearch(text.trim());
  };

  const handlePredict = async () => {
    if (selectedTokens.size === 0) {
      toast.warn("Select at least one symptom or antecedent.");
      return;
    }
    const ageNum = age === "" ? undefined : parseInt(age, 10);
    if (age !== "" && (Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120)) {
      toast.error("Enter a valid age between 0 and 120.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        evidences: [...selectedTokens],
        age: ageNum,
        sex: sex || undefined,
        topK: 5,
      };
      const fn = useEnhanced ? predictionAPI.predictEnhanced : predictionAPI.predict;
      const response = await fn(payload);
      if (response?.success && response?.data) {
        setResult(response.data);
        setIsModalOpen(true);
        toast.success("Prediction complete.");
      } else {
        toast.error(response?.message || "Prediction failed.");
      }
    } catch (err) {
      console.error("Predict error:", err);
      toast.error(err?.message || "Prediction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeList = tab === "symptoms" ? symptomEvidences : antecedentEvidences;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen transition-colors duration-300">
      <div className="w-full h-[400px] bg-gradient-to-r from-btn2 via-sky-500 to-btn1 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 px-5">
          <div className="text-center max-w-4xl">
            <div className="mb-6 flex justify-center">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border-2 border-white/30">
                <FaStethoscope className="text-5xl text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-center drop-shadow-2xl">
              Differential Disease Prediction
            </h1>
            <p className="font-semibold text-xl md:text-3xl italic text-white/95 text-center mb-8 drop-shadow-lg">
              "Trained on DDXPlus, powered by gradient boosting"
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                <span className="flex items-center gap-2">
                  <FaShieldAlt className="text-yellow-300" />
                  <span className="font-semibold">99.7% Top-1 Accuracy</span>
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                <span className="flex items-center gap-2">
                  <FaBrain className="text-purple-300" />
                  <span className="font-semibold">49 Pathologies</span>
                </span>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30">
                <span className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-300" />
                  <span className="font-semibold">Calibrated Probabilities</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white flex flex-col items-center animate-bounce z-20">
          <p className="text-sm font-medium mb-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
            Scroll to predict
          </p>
          <BsArrowDown size={30} />
        </div>
      </div>

      <div className="w-full py-20 font-text">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-btn2 to-btn1 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 justify-center">
                <FaHeartbeat className="text-lg" />
                DIFFERENTIAL DIAGNOSIS
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4 bg-gradient-to-r from-btn2 via-sky-500 to-btn1 bg-clip-text text-transparent">
              Tell us what you're experiencing
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Pick everything that applies (symptoms and medical history). More evidence = better
              prediction. The model returns the top 5 most likely conditions ranked by probability.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl dark:shadow-gray-900/50 p-6 md:p-10 border-2 border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Age (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 focus:outline-none focus:border-btn2 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Sex (optional)
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 focus:outline-none focus:border-btn2 transition"
                >
                  <option value="">Prefer not to say</option>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Voice search
                </label>
                <div className="px-2 py-1">
                  <VoiceInput onTranscript={handleVoiceTranscript} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setTab("symptoms")}
                className={`px-4 py-2 rounded-xl font-bold transition ${
                  tab === "symptoms"
                    ? "bg-gradient-to-r from-btn2 to-btn1 text-white shadow"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                }`}
              >
                Symptoms
              </button>
              <button
                type="button"
                onClick={() => setTab("antecedents")}
                className={`px-4 py-2 rounded-xl font-bold transition ${
                  tab === "antecedents"
                    ? "bg-gradient-to-r from-btn2 to-btn1 text-white shadow"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                }`}
              >
                Medical history
              </button>
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 focus:outline-none focus:border-btn2 transition"
                />
              </div>
            </div>

            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
              <FaInfoCircle className="text-blue-500 mt-1 flex-shrink-0" />
              <span>
                Selected: <strong>{selectedTokens.size}</strong> / {MAX_EVIDENCES}.{" "}
                {catalogLoading
                  ? "Loading symptom catalog…"
                  : `${activeList.length} ${tab === "symptoms" ? "symptoms" : "history items"} matching.`}
              </span>
            </div>

            {selectedSummary.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" /> Selected
                  </p>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <FaTrash /> Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedSummary.map((s) => (
                    <button
                      key={s.token}
                      type="button"
                      onClick={() => removeToken(s.token)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow hover:opacity-90 flex items-center gap-2"
                      title="Click to remove"
                    >
                      {s.label}
                      <span className="text-white/80">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-[450px] overflow-y-auto pr-2 space-y-2 mb-6">
              {catalogLoading ? (
                <p className="text-center text-gray-500 py-10">Loading…</p>
              ) : activeList.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No matches.</p>
              ) : (
                activeList.map((ev) => {
                  const isCategorical = (ev.possible_values || []).length > 0;
                  const isSelected = isCategorical
                    ? Boolean(categoricalSelections[ev.code])
                    : selectedTokens.has(ev.code);
                  return (
                    <div
                      key={ev.code}
                      className={`p-3 rounded-xl border-2 transition ${
                        isSelected
                          ? "border-btn2 bg-blue-50 dark:bg-blue-950/30"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {!isCategorical ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBinary(ev.code)}
                            className="mt-1 w-5 h-5 accent-btn2"
                          />
                        ) : (
                          <span className="mt-1 text-gray-500 text-xs">⌄</span>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-100">
                            {ev.question}
                          </p>
                          {isCategorical && (
                            <select
                              value={categoricalSelections[ev.code] || ""}
                              onChange={(e) => setCategoricalValue(ev.code, e.target.value)}
                              className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:outline-none focus:border-btn2"
                            >
                              <option value="">Select…</option>
                              {(ev.possible_values || []).map((v) => (
                                <option key={v.token} value={v.token}>
                                  {v.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-2xl border-2 border-yellow-300 dark:border-yellow-700 hover:border-yellow-500 transition">
                <input
                  type="checkbox"
                  checked={useEnhanced}
                  onChange={(e) => setUseEnhanced(e.target.checked)}
                  className="w-5 h-5 accent-yellow-500"
                />
                <span className="text-base font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <FaStar className="text-yellow-500" />
                  Enhanced AI Analysis
                  <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                    PRO
                  </span>
                </span>
              </label>
              <button
                type="button"
                onClick={handlePredict}
                disabled={isLoading || selectedTokens.size === 0}
                className={`bg-gradient-to-r from-btn2 via-sky-500 to-btn1 text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-2xl hover:shadow-3xl hover:shadow-btn2/25 transition-all duration-300 hover:scale-105 ${
                  isLoading || selectedTokens.size === 0 ? "opacity-50 cursor-not-allowed hover:scale-100" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <>
                    <FaStethoscope className="text-xl" />
                    <span>Predict</span>
                    <FaBrain className="text-xl" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && result && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl border-4 border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
              aria-label="Close"
            >
              ×
            </button>

            {result.red_flags && <UrgentCareBanner redFlags={result.red_flags} />}

            <div className="mb-6 text-center">
              <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow mb-3">
                PREDICTION COMPLETE
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-btn2 via-sky-500 to-btn1 bg-clip-text text-transparent inline-flex items-baseline justify-center gap-2">
                <ClinicalName name={result.ml_prediction} size="lg" />
              </h2>
              {result.ml_icd10 && (
                <p className="text-sm text-gray-500 mt-1">ICD-10: {result.ml_icd10}</p>
              )}
              <div className="mt-4 max-w-md mx-auto">
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-btn2 to-btn1"
                    style={{ width: `${Math.round((result.ml_probability || 0) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Confidence: <strong>{((result.ml_probability || 0) * 100).toFixed(1)}%</strong>
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                <FaUserMd className="text-btn2" /> Differential Diagnosis
              </h3>
              <p className="-mt-2 mb-3 text-xs text-gray-500 dark:text-gray-400">
                Very unlikely conditions are not shown.
              </p>
              <div className="space-y-2">
                {(result.differential_diagnosis || []).map((item) => (
                  <div
                    key={item.rank}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 flex items-center gap-3"
                  >
                    <div className="bg-gradient-to-br from-btn2 to-btn1 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">
                      {item.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        <ClinicalName name={item.pathology} />
                      </p>
                      {item.icd10 && (
                        <p className="text-xs text-gray-500">ICD-10: {item.icd10}</p>
                      )}
                    </div>
                    <div className="w-32">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-btn2 to-btn1"
                          style={{ width: `${Math.round((item.probability || 0) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-right text-gray-600 dark:text-gray-400 mt-1">
                        {((item.probability || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.gemini_enhanced && result.gemini_analysis && (
              <div className="mb-6 p-5 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 rounded-2xl border-2 border-yellow-400 dark:border-yellow-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-xl">
                    <FaStar className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                      AI-Enhanced Analysis
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Powered by Google Gemini
                    </p>
                  </div>
                </div>
                <div className="text-sm bg-white dark:bg-gray-700/50 p-4 rounded-xl max-h-96 overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{result.gemini_analysis}</ReactMarkdown>
                </div>
              </div>
            )}

            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-4">
              <p className="text-xs text-red-700 dark:text-red-400 font-medium text-center">
                ⚕️ <strong>Medical Disclaimer:</strong> AI-generated predictions for educational
                purposes only. Always consult a qualified healthcare provider.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/book"
                className="bg-gradient-to-r from-btn2 to-btn1 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow hover:opacity-90"
              >
                <FaUserMd /> Book Appointment
              </a>
              <a
                href="/tools"
                className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow hover:opacity-90"
              >
                <FaStethoscope /> Health Tools
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictDisease;
