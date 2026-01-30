import React from "react";
import { motion } from "framer-motion";
import { fadeIn } from "../variants";

function About() {
  return (
    <div className="md:mx-10 mx-5 -mt-8 relative z-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-gradient-to-r from-btn1 via-btn1/95 to-btn1 rounded-2xl shadow-xl shadow-gray-400/50 hover:shadow-2xl transition-all duration-300 overflow-hidden relative"
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Animated border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-btn2/20 via-transparent to-btn2/20 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
        
        <motion.p 
          className="relative px-6 md:px-8 font-sans text-justify flex justify-center items-center py-6 md:py-8 text-gray-900 dark:text-dark_text text-sm md:text-base font-text leading-relaxed"
        >
          Welcome to our AI Health Engine, a revolutionary platform integrating
          cutting-edge artificial intelligence with healthcare expertise. Our
          system seamlessly predicts diseases, recommends specialized doctors,
          and assists users through an intuitive chatbot interface. Utilizing
          advanced algorithms, it analyzes extensive medical data to deliver
          accurate disease predictions and personalized recommendations. Whether
          you seek preventive care or need guidance on existing health concerns,
          our AI Health Engine is your trusted companion. With a focus on
          user-centric design and seamless interaction, we empower individuals
          to take control of their health journey, ensuring informed decisions
          and timely interventions for a healthier tomorrow. Welcome to the
          future of healthcare.
        </motion.p>
      </motion.div>
    </div>
  );
}

export default About;
