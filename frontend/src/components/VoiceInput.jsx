import React, { useState, useRef, useCallback } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa6";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function VoiceInput({ onTranscript, language = "en-US", className = "" }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);

  const isSupported = !!SpeechRecognition;

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const current = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setTranscript(current);

      if (event.results[event.results.length - 1].isFinal) {
        onTranscript?.(current.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  if (!isSupported) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
          isListening
            ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
            : "bg-gradient-to-r from-btn2 to-sky-500 text-white hover:shadow-lg hover:scale-105"
        }`}
      >
        {isListening ? (
          <>
            <FaStop /> Stop Recording
          </>
        ) : (
          <>
            <FaMicrophone /> Voice Input
          </>
        )}
      </button>
      {isListening && transcript && (
        <span className="text-sm text-gray-500 dark:text-gray-400 italic max-w-xs truncate">
          "{transcript}"
        </span>
      )}
    </div>
  );
}

export default VoiceInput;
