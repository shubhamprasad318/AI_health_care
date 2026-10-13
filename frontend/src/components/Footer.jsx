import React from "react";
import { Link } from "react-router-dom";
import { FaHeartPulse } from "react-icons/fa6";

const columns = [
  {
    title: "Features",
    links: [
      { name: "Symptom checker", to: "/predict" },
      { name: "Voice AI doctor", to: "/virtual-doctor" },
      { name: "Report analysis", to: "/report" },
      { name: "Health tools", to: "/tools" },
    ],
  },
  {
    title: "Care",
    links: [
      { name: "Find doctors", to: "/doctors" },
      { name: "Appointments", to: "/book" },
      { name: "Medications", to: "/medications" },
      { name: "Family profiles", to: "/family" },
    ],
  },
  {
    title: "Learn",
    links: [
      { name: "Health articles", to: "/article" },
      { name: "FAQ", to: "/#faq" },
      { name: "Contact", to: "/#contact" },
    ],
  },
];

const linkClass =
  "text-sm text-slate-600 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400";

function Footer() {
  return (
    <footer className="font-text border-t border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-5 md:px-10">
        <div className="md:col-span-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <FaHeartPulse />
            </span>
            <span className="font-display text-lg font-extrabold text-slate-900 dark:text-white">
              AI HealthEngine
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            AI-powered symptom checking, voice consultations and health records for you
            and your family.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l.name}>
                  {/* Hash links need a plain anchor so the browser scrolls to the section */}
                  {l.to.includes("#") ? (
                    <a href={l.to} className={linkClass}>
                      {l.name}
                    </a>
                  ) : (
                    <Link to={l.to} className={linkClass}>
                      {l.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-slate-500 md:flex-row md:px-10 dark:text-slate-500">
          <p>© {new Date().getFullYear()} AI HealthEngine. All rights reserved.</p>
          <p>For informational purposes only. Not a substitute for professional medical advice.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
