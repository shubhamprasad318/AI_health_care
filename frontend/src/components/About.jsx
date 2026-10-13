import React from "react";
import { motion } from "framer-motion";
import { FaClipboardList, FaRobot, FaUserDoctor } from "react-icons/fa6";

const steps = [
  {
    icon: FaClipboardList,
    title: "Tell us how you feel",
    details: "Pick your symptoms, or just describe them to the voice doctor.",
  },
  {
    icon: FaRobot,
    title: "Get an AI assessment",
    details: "See the most likely conditions with confidence scores and an explanation from Gemini.",
  },
  {
    icon: FaUserDoctor,
    title: "Take the next step",
    details: "Get matched to the right specialist, book an appointment and track your recovery.",
  },
];

function About() {
  return (
    <section id="how-it-works" className="font-text bg-slate-50 py-20 dark:bg-gray-900/50">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">
            From symptoms to answers in three steps
          </h2>
        </motion.div>

        <div className="relative mt-14 grid gap-8 md:grid-cols-3">
          {/* Connector line on desktop */}
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden h-px bg-gradient-to-r from-brand-200 via-sky-200 to-brand-200 md:block dark:from-brand-800 dark:via-sky-800 dark:to-brand-800" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative text-center"
              >
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl text-brand-600 shadow-lg shadow-slate-200 ring-1 ring-slate-200 dark:bg-gray-900 dark:text-brand-400 dark:shadow-black/30 dark:ring-gray-800">
                  <Icon />
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {step.details}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default About;
