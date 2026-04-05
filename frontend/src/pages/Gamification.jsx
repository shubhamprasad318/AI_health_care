import React, { useState, useEffect } from "react";
import { FaTrophy, FaFire, FaMedal, FaStar, FaLock, FaHeart, FaLightbulb, FaSpinner, FaChevronRight } from "react-icons/fa";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { gamificationAPI } from "../utils/api";

function Gamification() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGamification();
  }, []);

  const fetchGamification = async () => {
    setLoading(true);
    try {
      const json = await gamificationAPI.getData();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error(json.message || "Failed to load gamification data");
      }
    } catch (err) {
      toast.error("Failed to load gamification data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <FaSpinner className="animate-spin text-btn2 text-5xl mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { level, health_score, streak, adherence, badges, weekly_tip } = data;
  const xpProgress = Math.min((level.xp / level.next_level_xp) * 100, 100);

  return (
    <div className="w-full min-h-screen font-text bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Hero */}
      <div className="w-full h-[350px] bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-10 px-5">
          <div className="text-center max-w-4xl animate-fadeIn">
            <div className="mb-4 flex justify-center">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-full border-2 border-white/30">
                <FaTrophy className="text-5xl text-yellow-200" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-2xl animate-slideDown">
              Health Achievements
            </h1>
            <p className="font-semibold text-xl md:text-2xl text-white/90 animate-slideUp">
              Track your health journey and earn badges
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 -mt-8 relative z-20">
        {/* Level + Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slideUp">
          {/* Level Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-xl shadow-lg">
                <FaStar className="text-white text-3xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Level {level.current}</p>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{level.name}</h2>
              </div>
            </div>
            <div className="mb-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{level.xp} XP</span>
              <span>{level.next_level_xp} XP</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{level.next_level_xp - level.xp} XP to next level</p>
          </div>

          {/* Health Score Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="6" className="dark:stroke-gray-700" />
                  <motion.circle
                    cx="40" cy="40" r="35" fill="none"
                    stroke={health_score.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 35 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 35 * (1 - health_score.score / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold" style={{ color: health_score.color }}>
                    {health_score.score}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Health Score</p>
                <h2 className="text-xl font-bold" style={{ color: health_score.color }}>
                  {health_score.status}
                </h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{health_score.message}</p>
              </div>
            </div>
          </div>

          {/* Streak + Adherence Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-400 to-red-500 p-3 rounded-xl">
                  <FaFire className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Weekly Streak</p>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {streak.weeks} Week{streak.weeks !== 1 ? "s" : ""}
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl">
                  <FaHeart className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Med Adherence (30d)</p>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{adherence.percentage}%</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-700 mb-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl">
                <FaMedal className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Badges</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {badges.earned_count} of {badges.total} earned
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-btn2 to-btn1 text-white px-4 py-2 rounded-full text-sm font-bold">
              {Math.round((badges.earned_count / badges.total) * 100)}% Complete
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(badges.earned_count / badges.total) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
            />
          </div>

          {/* Earned Badges */}
          {badges.earned.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <FaTrophy className="text-yellow-500" /> Earned
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.earned.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.08 }}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-2xl p-5 border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 hover:shadow-lg transition-all text-center group"
                  >
                    <div className="text-4xl mb-3 group-hover:scale-125 transition-transform">
                      {badge.icon}
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-1">{badge.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                    <div className="mt-2 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs font-bold px-3 py-1 rounded-full inline-block">
                      Earned
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Badges */}
          {badges.locked.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <FaLock className="text-gray-400 dark:text-gray-500" /> Locked
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badges.locked.map((badge, index) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all text-center relative overflow-hidden"
                  >
                    <div className="text-4xl mb-3 grayscale opacity-40">{badge.icon}</div>
                    <h4 className="font-bold text-gray-600 dark:text-gray-300 text-sm mb-1">{badge.name}</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{badge.description}</p>
                    {badge.threshold && badge.progress !== undefined && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all"
                            style={{ width: `${Math.min((badge.progress / badge.threshold) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {badge.progress}/{badge.threshold}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Weekly Health Tip */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-8 mb-12 animate-fadeIn text-white">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl flex-shrink-0">
              <FaLightbulb className="text-2xl text-yellow-200" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Weekly Health Tip</h3>
              <p className="text-white/90 text-lg leading-relaxed">{weekly_tip}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gamification;
