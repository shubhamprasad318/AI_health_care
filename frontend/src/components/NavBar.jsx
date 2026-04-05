import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CiMenuFries } from "react-icons/ci";
import { RxCross2 } from "react-icons/rx";
import { FaHome } from "react-icons/fa";  // ✅ FaHome is in 'fa', not 'fa6'
import { FaMoon, FaSun } from "react-icons/fa6";
import { MdLanguage } from "react-icons/md";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";

function NavBar() {
  const { loggedIn, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

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

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const menuSlide = {
    initial: {
      x: "-100%",
    },
    enter: {
      x: "0%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      x: "-100%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
  };

  const slide = {
    initial: {
      x: "-100%",
    },
    enter: {
      x: "0%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      x: "-100%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
  };

  return (
    <div className="w-full h-[70px] flex justify-between items-center z-50 font-text sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-5 shadow-md dark:shadow-gray-900/50 transition-all duration-300 border-b border-gray-100 dark:border-gray-800/50">
      <div className="flex items-center space-x-3 mx-1 md:mx-5">
        <div>
          <motion.button
            onClick={toggleMenu}
            whileTap={{ scale: 0.8 }}
            aria-expanded={isOpen}
            aria-controls="main-menu"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="flex items-center border-2 md:px-3 md:py-2 px-2 py-1 rounded-full border-btn1 cursor-pointer text-sm hover:bg-btn1 hover:text-white dark:text-gray-200 dark:border-btn1/50 dark:hover:bg-btn1 transition-all duration-200"
          >
            {isOpen ? <RxCross2 /> : <CiMenuFries />}
            <h1 className="capitalize px-2">{t("nav.menu")}</h1>
          </motion.button>

          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.ul
                id="main-menu"
                role="menu"
                variants={menuSlide}
                animate="enter"
                exit="exit"
                initial="initial"
                className="absolute top-20 left-0 z-50 bg-btn1/95 dark:bg-gray-800/95 backdrop-blur-xl text-white rounded-r-2xl shadow-2xl dark:shadow-black/50 overflow-hidden min-w-[250px] border-r border-t border-b border-white/10 dark:border-gray-700/50"
              >
                {menuItems.map((item, index) => (
                  <motion.li
                    variants={slide}
                    animate="enter"
                    exit="exit"
                    initial="initial"
                    className={`flex items-center py-3 px-5 cursor-pointer capitalize hover:bg-white/20 hover:text-white dark:hover:bg-white/10 dark:hover:text-white transition-all duration-200 border-b border-white/10 dark:border-gray-700/30 ${
                      item.id === 0 ? "bg-white/15 font-bold" : ""
                    }`}
                    key={item.id}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* ✅ Show Home icon for first item */}
                    {item.id === 0 && <FaHome className="mr-2" />}
                    
                    <Link
                      to={item.link}
                      onClick={() => {
                        setIsOpen(!isOpen);
                      }}
                      className="w-full"
                    >
                      {item.name}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="">
        <Link to="/">
          <motion.h1
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              ease: [0, 0.71, 0.2, 1.01],
              scale: {
                type: "spring",
                damping: 5,
                stiffness: 100,
                restDelta: 0.001,
              },
            }}
            className="cursor-pointer uppercase md:text-4xl text-3xl font-semibold tracking-wider font-logo text-lightText dark:text-gray-100 hover:scale-110 transition-all duration-200"
          >
            ai-he
          </motion.h1>
        </Link>
      </div>

      {loggedIn ? (
        <div className="flex items-center">
          <NotificationBell />
          <Link to="/profile">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              className="hover:scale-110 transition-transform"
            >
              <img 
                src="/user.png" 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-btn1 dark:border-btn1/60 object-cover ring-2 ring-transparent hover:ring-btn1/30 transition-all duration-200" 
              />
            </motion.button>
          </Link>
          <motion.button
            onClick={logout}
            whileTap={{ scale: 0.8 }}
            className="md:mx-2 mx-1 border-2 md:px-3 md:py-2 px-2 py-1 rounded-full border-btn1 cursor-pointer text-sm hover:bg-red-500 hover:text-white hover:border-red-500 dark:text-gray-200 dark:border-btn1/50 dark:hover:border-red-500 transition-all duration-200 font-semibold"
          >
            {t("nav.logout")}
          </motion.button>
          <motion.button
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "hi" : "en")}
            whileTap={{ scale: 0.9 }}
            className="md:mx-1 mx-0.5 border-2 md:px-2.5 md:py-2 px-2 py-1 rounded-full border-gray-300 dark:border-gray-600 cursor-pointer text-xs hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all duration-200 font-semibold flex items-center gap-1"
            title={i18n.language === "en" ? "हिन्दी में बदलें" : "Switch to English"}
          >
            <MdLanguage className="text-sm" />
            {i18n.language === "en" ? "HI" : "EN"}
          </motion.button>
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="md:mx-1 mx-0.5 border-2 md:px-2.5 md:py-2 px-2 py-1 rounded-full border-gray-300 dark:border-gray-600 cursor-pointer text-xs hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all duration-200 font-semibold"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <FaSun className="text-sm text-yellow-400" /> : <FaMoon className="text-sm" />}
          </motion.button>
        </div>
      ) : (
        <div className="flex items-center">
          <Link to="/login">
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="font-bold md:mx-2 mx-1 md:px-3 md:py-2 px-2 py-1 rounded-full bg-btn1 cursor-pointer text-white text-sm hover:bg-btn1/90 hover:shadow-lg transition-all duration-200"
            >
              {t("nav.login")}
            </motion.button>
          </Link>
          <Link to="/signup">
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="md:mx-2 mx-1 border-2 md:px-3 md:py-2 px-2 py-1 rounded-full border-btn1 cursor-pointer text-sm hover:bg-btn1 hover:text-white dark:text-gray-200 dark:border-btn1/50 transition-all duration-200"
            >
              {t("nav.register")}
            </motion.button>
          </Link>
          <motion.button
            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "hi" : "en")}
            whileTap={{ scale: 0.9 }}
            className="md:mx-1 mx-0.5 border-2 md:px-2.5 md:py-2 px-2 py-1 rounded-full border-gray-300 dark:border-gray-600 cursor-pointer text-xs hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all duration-200 font-semibold flex items-center gap-1"
            title={i18n.language === "en" ? "हिन्दी में बदलें" : "Switch to English"}
          >
            <MdLanguage className="text-sm" />
            {i18n.language === "en" ? "HI" : "EN"}
          </motion.button>
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="md:mx-1 mx-0.5 border-2 md:px-2.5 md:py-2 px-2 py-1 rounded-full border-gray-300 dark:border-gray-600 cursor-pointer text-xs hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 transition-all duration-200 font-semibold"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <FaSun className="text-sm text-yellow-400" /> : <FaMoon className="text-sm" />}
          </motion.button>
        </div>
      )}
    </div>
  );
}

export default NavBar;
