import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaChevronDown } from "react-icons/fa6";

const faqs = [
  {
    q: "How accurate is the disease prediction?",
    a: "The model is a calibrated LightGBM classifier trained on the DDXPlus benchmark. It reaches 99.7% top-1 accuracy on a held-out test set of synthetic patients. Real-world accuracy can be lower, so treat results as guidance, not a diagnosis.",
  },
  {
    q: "Does this replace a visit to the doctor?",
    a: "No. AI HealthEngine helps you understand your symptoms and decide what to do next. Always consult a qualified doctor for diagnosis and treatment, and seek emergency care for severe symptoms.",
  },
  {
    q: "How does the voice AI doctor work?",
    a: "You talk to it in real time through your browser. It asks follow-up questions like a doctor would, and when the call ends it saves a summary with symptoms, possible conditions, red flags and recommendations.",
  },
  {
    q: "Is my health data private?",
    a: "Your data is tied to your account and protected with token-based authentication. You can enable two-factor authentication and export your records at any time.",
  },
  {
    q: "Which languages are supported?",
    a: "The app is available in English and Hindi. Switch languages any time from the top bar.",
  },
];

function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="font-text py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-10 lg:grid-cols-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            FAQ
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">
            Questions, answered
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Can't find what you're looking for? Send us a message using the form below.
          </p>
        </div>

        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white lg:col-span-2 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-semibold text-slate-900 dark:text-gray-100">{item.q}</span>
                  <FaChevronDown
                    className={`shrink-0 text-sm text-slate-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-brand-600" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
