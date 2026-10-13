import { motion } from "framer-motion";
import React from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaMicrophone, FaShieldHalved, FaStethoscope } from "react-icons/fa6";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" },
});

// Illustrative sample shown in the hero mock card, not real patient data
const samplePredictions = [
  { name: "Influenza", score: 82 },
  { name: "Bronchitis", score: 11 },
  { name: "Common cold", score: 5 },
];

const stats = [
  { value: "49", label: "conditions covered" },
  { value: "99.7%", label: "top-1 test accuracy" },
  { value: "~1ms", label: "prediction time" },
  { value: "EN / हिं", label: "bilingual" },
];

function HeroSection() {
  return (
    <section className="relative overflow-hidden font-text bg-gradient-to-b from-brand-50 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      {/* Soft background accents */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-500/10" />
      <div className="pointer-events-none absolute top-40 -left-40 h-[380px] w-[380px] rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pt-16 pb-12 md:px-10 lg:grid-cols-2 lg:pt-24 lg:pb-20">
        {/* Copy */}
        <div>
          <motion.span
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm dark:border-brand-800 dark:bg-gray-900 dark:text-brand-300"
          >
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
            AI-powered health companion
          </motion.span>

          <motion.h1
            {...fadeUp(0.1)}
            className="mt-5 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
          >
            Understand your symptoms.{" "}
            <span className="bg-gradient-to-r from-brand-600 to-sky-600 bg-clip-text text-transparent dark:from-brand-300 dark:to-sky-400">
              Get care sooner.
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg dark:text-slate-300"
          >
            Check your symptoms with a clinically benchmarked AI model, talk to a
            voice doctor, analyse medical reports and keep your family's health
            records in one place.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/predict"
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-xl"
            >
              <FaStethoscope />
              Check symptoms
              <FaArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/virtual-doctor"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-800 shadow-sm transition hover:border-brand-300 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-brand-600"
            >
              <FaMicrophone className="text-brand-600 dark:text-brand-400" />
              Talk to AI doctor
            </Link>
          </motion.div>

          <motion.p
            {...fadeUp(0.4)}
            className="mt-5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
          >
            <FaShieldHalved className="text-brand-600 dark:text-brand-400" />
            Not a substitute for professional medical advice. Always consult a doctor.
          </motion.p>
        </div>

        {/* Product preview card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Symptom check
                </p>
                <p className="mt-1 font-display text-lg font-bold text-slate-900 dark:text-white">
                  Likely conditions
                </p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                Sample
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {["Fever", "Dry cough", "Body ache", "Fatigue"].map((s) => (
                <span
                  key={s}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {samplePredictions.map((p, i) => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-800 dark:text-gray-100">{p.name}</span>
                    <span className="font-semibold text-slate-500 dark:text-gray-400">{p.score}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.score}%` }}
                      transition={{ duration: 1, delay: 0.6 + i * 0.15, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        i === 0 ? "bg-gradient-to-r from-brand-500 to-sky-500" : "bg-slate-300 dark:bg-gray-600"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-gray-800/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                <FaStethoscope />
              </div>
              <div className="text-sm">
                <p className="font-semibold text-slate-800 dark:text-gray-100">Suggested specialist</p>
                <p className="text-slate-500 dark:text-gray-400">General Physician</p>
              </div>
            </div>
          </div>

          {/* Floating voice doctor chip */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:-left-10"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
              <span className="absolute inset-0 rounded-full bg-brand-500 animate-ping opacity-40" />
              <FaMicrophone className="relative text-sm" />
            </span>
            <div className="text-xs">
              <p className="font-semibold text-slate-800 dark:text-gray-100">Voice doctor</p>
              <p className="text-slate-500 dark:text-gray-400">Listening…</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats strip */}
      <div className="relative mx-auto max-w-7xl px-5 pb-16 md:px-10">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-4 dark:border-gray-800 dark:bg-gray-800">
          {stats.map((s) => (
            <div key={s.label} className="bg-white px-6 py-5 text-center dark:bg-gray-900">
              <p className="font-display text-2xl font-extrabold text-slate-900 md:text-3xl dark:text-white">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-gray-400">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
