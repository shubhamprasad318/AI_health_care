import React from "react";
import { motion } from "framer-motion";
import { FaHandPointRight } from "react-icons/fa";

function PageDivider() {
  return (
    <div className="hidden md:flex relative overflow-hidden">
      <div className="h-[400px] flex w-full justify-start items-center relative">
        <div className="bg-img1 w-full flex h-full justify-start items-center bg-fixed bg-cover bg-center relative">
          {/* Gradient overlay with animation */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-sky-900/70 via-sky-900/60 to-sky-900/70"
            animate={{
              background: [
                "linear-gradient(to right, rgba(14, 116, 144, 0.7), rgba(14, 116, 144, 0.6), rgba(14, 116, 144, 0.7))",
                "linear-gradient(to right, rgba(14, 116, 144, 0.6), rgba(14, 116, 144, 0.7), rgba(14, 116, 144, 0.6))",
                "linear-gradient(to right, rgba(14, 116, 144, 0.7), rgba(14, 116, 144, 0.6), rgba(14, 116, 144, 0.7))",
              ]
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          
          {/* Animated particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/30 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * 400,
                  opacity: 0,
                }}
                animate={{
                  y: [null, -400],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
          
          {/* Content overlay */}
          <div className="relative z-10 p-4 text-gray-200 font-medium text-4xl font-playfair w-full h-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h3 className="text-5xl font-bold mb-4 drop-shadow-lg">Your Health Journey Starts Here</h3>
              <p className="text-xl font-light">Empowering you with AI-driven healthcare solutions</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageDivider;
