import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CiMenuFries } from "react-icons/ci";
import { RxCross2 } from "react-icons/rx";
import { FaHeartPulse, FaMoon, FaSun } from "react-icons/fa6";
import { MdLanguage } from "react-icons/md";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";

const iconBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800";

function NavBar() {
  const { loggedIn, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const menuRef = useRef(null);

  const menuItems = [
    { id: 0, name: t("nav.home"), link: "/" },
    { id: 1, name: t("nav.dashboard"), link: "/dashboard" },
    { id: 2, name: t("nav.predictDisease"), link: "/predict" },
    { id: 3, name: t("nav.predictionHistory"), link: "/history" },
    { id: 4, name: t("nav.bookAppointments"), link: "/book" },
    { id: 5, name: t("nav.healthTools"), link: "/tools" },
    { id: 6, name: t("nav.readArticles"), link: "/article" },
    { id: 7, name: t("nav.virtualDoctor"), link: "/virtual-doctor" },
    { id: 8, name: t("nav.medications"), link: "/medications" },
    { id: 9, name: t("nav.timeline"), link: "/timeline" },
    { id: 10, name: t("nav.report"), link: "/report" },
    { id: 11, name: t("nav.familyProfiles"), link: "/family" },
    { id: 12, name: t("nav.doctors"), link: "/doctors" },
    { id: 13, name: t("nav.calendar"), link: "/calendar" },
    { id: 14, name: t("nav.achievements"), link: "/achievements" },
    { id: 15, name: t("nav.exportData"), link: "/export" },
    { id: 16, name: t("nav.security"), link: "/security" },
    { id: 17, name: t("nav.admin"), link: "/admin" },
  ];

  // Most-used pages, shown inline on desktop
  const quickLinks = [
    { name: t("nav.predictDisease"), link: "/predict" },
    { name: t("nav.virtualDoctor"), link: "/virtual-doctor" },
    { name: t("nav.healthTools"), link: "/tools" },
    { name: t("nav.doctors"), link: "/doctors" },
  ];

  const [isOpen, setIsOpen] = useState(false);

  // Close the menu on navigation and on outside click
  useEffect(() => setIsOpen(false), [location.pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isOpen]);

  const toggleLanguage = () => i18n.changeLanguage(i18n.language === "en" ? "hi" : "en");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 font-text backdrop-blur-xl transition-colors duration-300 dark:border-gray-800/70 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-10">
        {/* Left: menu + logo */}
        <div className="flex items-center gap-3" ref={menuRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="main-menu"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className={iconBtn}
          >
            {isOpen ? <RxCross2 /> : <CiMenuFries />}
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-sky-600 text-white shadow-md shadow-brand-600/30">
              <FaHeartPulse />
            </span>
            <span className="hidden font-display text-lg font-extrabold tracking-tight text-slate-900 sm:inline dark:text-white">
              AI<span className="text-brand-600 dark:text-brand-400">HealthEngine</span>
            </span>
          </Link>

          <AnimatePresence>
            {isOpen && (
              <motion.nav
                id="main-menu"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute left-4 top-[4.25rem] z-50 max-h-[75vh] w-[min(92vw,520px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/40 md:left-10 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/50"
              >
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {menuItems.map((item) => (
                    <li key={item.id}>
                      <NavLink
                        to={item.link}
                        end={item.link === "/"}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                            isActive
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                              : "text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          }`
                        }
                      >
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        {/* Center: quick links (desktop) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {quickLinks.map((l) => (
            <NavLink
              key={l.link}
              to={l.link}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                }`
              }
            >
              {l.name}
            </NavLink>
          ))}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className={`${iconBtn} w-auto gap-1 px-2.5 text-xs font-semibold`}
            title={i18n.language === "en" ? "हिन्दी में बदलें" : "Switch to English"}
          >
            <MdLanguage className="text-sm" />
            {i18n.language === "en" ? "HI" : "EN"}
          </button>
          <button
            onClick={toggleTheme}
            className={iconBtn}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <FaSun className="text-yellow-400" /> : <FaMoon />}
          </button>

          {loggedIn ? (
            <>
              <NotificationBell />
              <Link to="/profile" title={t("nav.profile")}>
                <img
                  src="/user.png"
                  alt="Profile"
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-brand-500/40 transition hover:ring-brand-500"
                />
              </Link>
              <button
                onClick={logout}
                className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600 sm:px-3 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-3 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {t("nav.login")}
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700 sm:px-4"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default NavBar;
