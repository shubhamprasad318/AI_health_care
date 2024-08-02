import React from "react";
import { motion } from "framer-motion";
import { fadeIn } from "../variants";

function About() {
  return (
    <div className="md:mx-10 mx-5">
      <motion.div
        // variants={fadeIn("down", 0.1)}
        // initial="hidden"
        // whileInView="show"
        // viewport={{ once: false, amount: 0.6 }}
        className="bg-btn1 my-2 rounded shadow-md shadow-gray-400"
      >
        <motion.p className=" px-4 font-sans  text-justify flex justify-center items-center py-5 text-gray-900 dark:text-dark_text text-xs md:text-sm font-text  ">
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
