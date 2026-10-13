import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";

function PageDivider() {
  return (
    <section className="font-text px-5 py-10 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-sky-800 px-8 py-14 text-center shadow-2xl shadow-brand-900/20 md:px-16"
      >
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border-[40px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full border-[48px] border-white/5" />

        <h2 className="relative font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Your health journey starts here
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-brand-50/90">
          Create a free account to save your predictions, consultations and reports,
          and share them with your doctor.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50"
          >
            Create free account
            <FaArrowRight className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/predict"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
          >
            Try a symptom check
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export default PageDivider;
