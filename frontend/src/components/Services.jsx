import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarCheck,
  FaFileMedical,
  FaMicrophone,
  FaPills,
  FaStethoscope,
  FaUsers,
} from "react-icons/fa6";

const features = [
  {
    title: "Disease prediction",
    details:
      "Answer a few questions about your symptoms and get a ranked list of likely conditions from a model trained on over a million DDXPlus patient cases.",
    icon: FaStethoscope,
    link: "/predict",
    tint: "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300",
  },
  {
    title: "Voice AI doctor",
    details:
      "Describe how you feel out loud. The AI doctor asks follow-up questions and saves a summary of every consultation.",
    icon: FaMicrophone,
    link: "/virtual-doctor",
    tint: "bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300",
  },
  {
    title: "Report analysis",
    details:
      "Upload lab reports and get a plain-language explanation of what each value means and what to ask your doctor.",
    icon: FaFileMedical,
    link: "/report",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    title: "Medications & interactions",
    details:
      "Track your medicines with reminders and check for drug interactions before you take something new.",
    icon: FaPills,
    link: "/medications",
    tint: "bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300",
  },
  {
    title: "Doctors & appointments",
    details:
      "Find the right specialist for your symptoms and book and manage appointments from your calendar.",
    icon: FaCalendarCheck,
    link: "/doctors",
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    title: "Family profiles",
    details:
      "Keep allergies, conditions and medications for everyone in your family, and export records as FHIR or PDF.",
    icon: FaUsers,
    link: "/family",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
];

const Service = () => {
  return (
    <section id="features" className="font-text py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Everything in one place
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">
            Your complete health toolkit
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            From the first symptom to the follow-up appointment, AI HealthEngine helps
            at every step.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <ServiceCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Service;

const ServiceCard = ({ feature, index }) => {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
    >
      <Link
        to={feature.link}
        className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/60 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-800 dark:hover:shadow-black/30"
      >
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${feature.tint}`}>
          <Icon />
        </span>
        <h3 className="mt-5 font-display text-lg font-bold text-slate-900 dark:text-white">
          {feature.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {feature.details}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
          Open
          <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </motion.div>
  );
};
