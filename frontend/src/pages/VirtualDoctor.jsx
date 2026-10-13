import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaUserMd,
  FaPhone,
  FaShieldAlt,
  FaClock,
  FaHeartbeat,
  FaBook,
  FaPills,
  FaCalendarPlus,
  FaTimes,
  FaExclamationTriangle,
  FaPhoneAlt,
  FaCheck,
} from "react-icons/fa";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { toast } from "react-toastify";
import { API_BASE_URL, consultationsAPI, timelineAPI } from "../utils/api";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const getToken = async () => {
  const response = await fetch(`${API_BASE_URL}/livekit/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.detail || "Failed to get token");
  return data.data;
};

function VoiceCallUI({ onEnd }) {
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (connectionState === "connected") {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [connectionState]);

  const toggleMute = useCallback(() => {
    if (localParticipant) {
      const newMuted = !isMuted;
      localParticipant.setMicrophoneEnabled(!newMuted);
      setIsMuted(newMuted);
    }
  }, [localParticipant, isMuted]);

  const endCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localParticipant) localParticipant.setMicrophoneEnabled(false);
    onEnd(duration);
  }, [localParticipant, onEnd, duration]);

  const isConnecting = connectionState === "connecting";
  const isConnected = connectionState === "connected";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="relative mb-8"
      >
        {isConnected && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-btn2/20"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 160, height: 160, top: -16, left: -16 }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-btn2/10"
              animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              style={{ width: 160, height: 160, top: -16, left: -16 }}
            />
          </>
        )}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-btn2 to-sky-500 flex items-center justify-center shadow-xl relative z-10">
          <FaUserMd className="text-white text-5xl" />
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1"
      >
        Dr. AI
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm mb-2"
      >
        {isConnecting && (
          <span className="text-amber-600 font-medium">Connecting...</span>
        )}
        {isConnected && (
          <span className="text-green-600 font-medium">Connected</span>
        )}
        {!isConnecting && !isConnected && (
          <span className="text-gray-500">Waiting...</span>
        )}
      </motion.p>

      {isConnected && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-mono text-gray-600 dark:text-gray-400 mb-8"
        >
          {formatTime(duration)}
        </motion.p>
      )}

      {isConnecting && (
        <div className="mb-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-btn2 border-t-transparent mx-auto" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-6"
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={toggleMute}
          disabled={!isConnected}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
            isMuted
              ? "bg-red-100 dark:bg-red-900/30 text-red-600 border-2 border-red-300 dark:border-red-700"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-btn2"
          } ${!isConnected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isMuted ? (
            <FaMicrophoneSlash className="text-xl" />
          ) : (
            <FaMicrophone className="text-xl" />
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all cursor-pointer"
        >
          <FaPhoneSlash className="text-xl" />
        </motion.button>
      </motion.div>
    </div>
  );
}

function ConsultationActionPanel({
  summary,
  consultationId,
  actions,
  setActions,
  navigate,
}) {
  const [busyIdx, setBusyIdx] = useState(null);

  const recordAction = async (idx, type, linkedId = null) => {
    try {
      const response = await consultationsAPI.markRecommendationAction(
        consultationId,
        idx,
        type,
        linkedId
      );
      const next = response?.data?.actions;
      if (Array.isArray(next)) setActions(next);
      else
        setActions((prev) => [
          ...prev,
          { idx, type, linked_id: linkedId, at: new Date().toISOString() },
        ]);
    } catch (err) {
      console.error("Failed to record action", err);
    }
  };

  const handleJournal = async (idx, text) => {
    if (busyIdx !== null) return;
    setBusyIdx(idx);
    try {
      const res = await timelineAPI.createJournal({
        title: "From AI consultation",
        content: text,
        mood: "neutral",
        tags: ["consultation"],
      });
      const newId =
        res?.data?.id || res?.data?._id || res?.data?.entry?._id || null;
      await recordAction(idx, "journaled", newId);
      toast.success("Saved to your health journal");
    } catch (err) {
      toast.error(err.message || "Could not save to journal");
    } finally {
      setBusyIdx(null);
    }
  };

  const handleMedication = async (idx, text) => {
    if (busyIdx !== null) return;
    setBusyIdx(idx);
    await recordAction(idx, "medication");
    setBusyIdx(null);
    navigate("/medications", {
      state: { prefillName: text, fromConsultation: consultationId },
    });
  };

  const handleAppointment = async (idx, text) => {
    if (busyIdx !== null) return;
    setBusyIdx(idx);
    await recordAction(idx, "appointment");
    setBusyIdx(null);
    navigate("/book", {
      state: { prefillNote: text, fromConsultation: consultationId },
    });
  };

  const handleDismiss = async (idx) => {
    if (busyIdx !== null) return;
    setBusyIdx(idx);
    await recordAction(idx, "dismissed");
    setBusyIdx(null);
  };

  if (!consultationId) return null;

  if (!summary) {
    return (
      <div className="my-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-sm">
        <span className="text-green-600 dark:text-green-400">✓</span>
        <span className="text-gray-700 dark:text-gray-300">
          Consultation saved — Dr. AI is writing the summary…
        </span>
      </div>
    );
  }

  if (summary.error) {
    return (
      <div className="my-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-sm">
        <span className="text-amber-600 dark:text-amber-400">!</span>
        <span className="text-gray-700 dark:text-gray-300">
          Summary unavailable. Full transcript still saved to your{" "}
          <a href="/timeline" className="font-semibold text-btn2 hover:underline">
            timeline
          </a>
          .
        </span>
      </div>
    );
  }

  const redFlags = Array.isArray(summary.red_flags) ? summary.red_flags : [];
  const recommendations = Array.isArray(summary.recommendations)
    ? summary.recommendations
    : [];
  const actionByIdx = new Map(actions.map((a) => [a.idx, a]));

  const labelForType = (type) =>
    ({
      journaled: "Saved to journal",
      medication: "Sent to medications",
      appointment: "Booking opened",
      dismissed: "Dismissed",
    }[type] || "Done");

  return (
    <div className="text-left space-y-4 mt-6 mb-6">
      {redFlags.length > 0 && (
        <div className="rounded-xl border-2 border-red-400 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-start gap-3 mb-3">
            <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-700 dark:text-red-300 mb-1">
                Red flags detected
              </h3>
              <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-200 space-y-1">
                {redFlags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
          <a
            href="tel:112"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            <FaPhoneAlt /> Call Emergency (112)
          </a>
        </div>
      )}

      {summary.chief_complaint && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Chief complaint
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-100">
            {summary.chief_complaint}
          </p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Suggested next steps
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => {
              const taken = actionByIdx.get(idx);
              const isBusy = busyIdx === idx;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    taken
                      ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 opacity-70"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }`}
                >
                  <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                    {rec}
                  </p>
                  {taken ? (
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                      <FaCheck /> {labelForType(taken.type)}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleJournal(idx, rec)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-btn2/10 hover:bg-btn2/20 text-btn2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaBook /> Save to journal
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleMedication(idx, rec)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaPills /> Add medication
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleAppointment(idx, rec)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaCalendarPlus /> Book follow-up
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDismiss(idx)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaTimes /> Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {summary.follow_up_advised && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-1">
            Follow-up advised
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-100">
            {summary.follow_up_advised}
          </p>
        </div>
      )}

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Full transcript saved to your{" "}
        <a href="/timeline" className="font-semibold text-btn2 hover:underline">
          health timeline
        </a>
        .
      </p>
    </div>
  );
}

function VirtualDoctor() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState("pre-call");
  const [roomToken, setRoomToken] = useState(null);
  const [livekitUrl, setLivekitUrl] = useState(null);
  const [finalDuration, setFinalDuration] = useState(0);
  const [consultationId, setConsultationId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [actions, setActions] = useState([]);
  const [pollAttempts, setPollAttempts] = useState(0);

  const startConsultation = async () => {
    setSessionState("connecting");
    setSummary(null);
    setActions([]);
    setPollAttempts(0);
    try {
      const { token, livekit_url, consultation_id } = await getToken();
      setRoomToken(token);
      setLivekitUrl(livekit_url);
      setConsultationId(consultation_id || null);
      setSessionState("in-call");
    } catch (err) {
      toast.error(err.message || "Failed to start consultation");
      setSessionState("pre-call");
    }
  };

  useEffect(() => {
    if (sessionState !== "post-call" || !consultationId) return;
    if (summary?.chief_complaint || summary?.error) return;
    if (pollAttempts >= 8) return;
    const timer = setTimeout(async () => {
      try {
        const resp = await consultationsAPI.get(consultationId);
        const fetched = resp?.data?.summary;
        if (fetched && (fetched.chief_complaint || fetched.error)) {
          setSummary(fetched);
          setActions(resp?.data?.actions || []);
        } else {
          setPollAttempts((n) => n + 1);
        }
      } catch (err) {
        console.error("Polling consultation failed", err);
        setPollAttempts((n) => n + 1);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [sessionState, consultationId, summary, pollAttempts]);

  const handleDisconnect = useCallback(
    (duration) => {
      setFinalDuration(duration || 0);
      setRoomToken(null);
      setLivekitUrl(null);
      setSessionState("post-call");
    },
    []
  );

  const features = [
    { icon: FaClock, label: "24/7 Available", desc: "Consult anytime, anywhere" },
    { icon: FaShieldAlt, label: "Private & Secure", desc: "End-to-end encrypted calls" },
    { icon: FaHeartbeat, label: "Health Guidance", desc: "General wellness advice" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-24 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {sessionState === "pre-call" && (
            <motion.div
              key="pre-call"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-btn2 to-btn1 flex items-center justify-center mx-auto mb-6 shadow-xl"
              >
                <FaUserMd className="text-white text-5xl" />
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                Virtual Doctor Consultation
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
                Talk to our AI-powered health assistant
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {features.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700"
                  >
                    <f.icon className="text-btn2 text-2xl mb-2 mx-auto" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                      {f.label}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">{f.desc}</p>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                onClick={startConsultation}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-btn2 to-btn1 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-btn2/25 transition-all cursor-pointer"
              >
                <FaPhone />
                Start Consultation
              </motion.button>

              <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                ⚕️ Dr. AI provides evidence-based clinical guidance and can recommend OTC medications with dosages. It is NOT a substitute for in-person medical examination. For emergencies, call 112/911 immediately. For prescriptions, lab orders, or complex conditions, consult a physician in person.
              </p>
            </motion.div>
          )}

          {sessionState === "connecting" && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-btn2 border-t-transparent mx-auto" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-10 h-10 bg-btn2 rounded-full animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
                Connecting to Dr. AI...
              </p>
            </motion.div>
          )}

          {sessionState === "in-call" && roomToken && livekitUrl && (
            <motion.div
              key="in-call"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LiveKitRoom
                serverUrl={livekitUrl}
                token={roomToken}
                connect={true}
                audio={true}
                video={false}
                onDisconnected={() => handleDisconnect(0)}
              >
                <RoomAudioRenderer />
                <VoiceCallUI onEnd={handleDisconnect} />
              </LiveKitRoom>
            </motion.div>
          )}

          {sessionState === "post-call" && (
            <motion.div
              key="post-call"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6"
              >
                <FaHeartbeat className="text-green-600 text-4xl" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Consultation Ended
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-1">Session Duration</p>
              <p className="text-3xl font-mono font-bold text-btn2 mb-4">
                {formatTime(finalDuration)}
              </p>

              <ConsultationActionPanel
                summary={summary}
                consultationId={consultationId}
                actions={actions}
                setActions={setActions}
                navigate={navigate}
              />

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => {
                    setConsultationId(null);
                    setSummary(null);
                    setActions([]);
                    setPollAttempts(0);
                    setSessionState("pre-call");
                  }}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-btn2 to-btn1 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-btn2/25 transition-all cursor-pointer"
                >
                  <FaPhone />
                  Start New Consultation
                </motion.button>
              </div>

              <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                For serious concerns, please consult a real healthcare
                professional.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default VirtualDoctor;
