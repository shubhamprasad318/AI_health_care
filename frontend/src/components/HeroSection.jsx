import { motion } from "framer-motion";
import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";


function HeroSection() {
  return (
    <div className="w-full min-h-[600px] md:h-[500px] overflow-hidden font-text relative bg-gradient-to-br from-white via-lightBackground to-btn2/5">
      {/* Animated floating decorative images */}
      <motion.img 
        className="absolute top-5 right-52 w-16 h-16 md:w-20 md:h-20 opacity-60" 
        src="/pill.png" 
        alt=""
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.img 
        className="absolute top-10 left-52 w-16 h-16 md:w-20 md:h-20 opacity-60" 
        src="/y_pill.png" 
        alt=""
        animate={{
          y: [0, 15, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      <motion.img
        className="absolute top-52 right-64 w-12 h-12 md:w-16 md:h-16 opacity-50 hidden md:block"
        src="/prevent.png"
        alt=""
        animate={{
          y: [0, -15, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.img
        className="absolute top-[300px] left-[350px] w-12 h-12 md:w-16 md:h-16 opacity-50 hidden md:block"
        src="/pill2.png"
        alt=""
        animate={{
          y: [0, 20, 0],
          rotate: [0, 15, 0],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5
        }}
      />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-lightBackground/50 via-transparent to-transparent"></div>

      <div className="w-full h-full relative z-10">
        <div className="w-full flex items-center justify-center flex-col h-full px-10 py-20">
          <motion.span
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="md:text-6xl text-4xl font-bold bg-gradient-to-r from-lightText via-btn2 to-lightText bg-clip-text text-transparent mb-4 drop-shadow-lg"
          >
            AI HealthEngine
          </motion.span>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="md:text-xl text-sm font-medium text-gray-700 text-center max-w-2xl leading-relaxed mb-8"
          >
            "Where technology meets healthcare for a healthier future."
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <Link to='/login' className="mt-2 inline-block">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(147, 198, 231, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-btn2 to-sky-400 text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Get Started
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </motion.button>
            </Link>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-6 h-10 border-2 border-btn2 rounded-full flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-3 bg-btn2 rounded-full mt-2"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
