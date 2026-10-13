import React from "react";
import { FaCircleCheck, FaHeartPulse } from "react-icons/fa6";

const highlights = [
  "AI symptom checker trained on 1M+ patient cases",
  "Voice consultations with saved summaries",
  "Reports, medications and family records in one place",
];

// Split-screen shell for login / signup: brand panel on the left, form on the right
function AuthLayout({ title, subtitle, children, wide = false }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] font-text lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-sky-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border-[56px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[28rem] w-[28rem] rounded-full border-[64px] border-white/5" />

        <div className="relative flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <FaHeartPulse />
          </span>
          <span className="font-display text-xl font-extrabold">AI HealthEngine</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Your health, understood.
          </h2>
          <ul className="mt-8 space-y-4">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3 text-brand-50">
                <FaCircleCheck className="mt-1 shrink-0 text-brand-200" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-100/70">
          For informational purposes only. Not a substitute for professional medical advice.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-white px-5 py-12 dark:bg-gray-950">
        <div className={`w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

export const authInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500";

export const authLabelClass = "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-gray-300";

export const authButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70";

export default AuthLayout;
