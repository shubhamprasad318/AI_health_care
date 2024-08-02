import { motion } from "framer-motion";
import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";


function HeroSection() {
  return (
    <div className="w-full h-[450px] overflow-hidden font-text relative ">
      <img className="absolute top-5 right-52" src="public/pill.png" alt="" />
      <img className="absolute top-10 left-52" src="public/y_pill.png" alt="" />
      <img
        className="absolute top-52 right-64"
        src="public/prevent.png"
        alt=""
      />
      <img
        className="absolute top-[300px] left-[350px]"
        src="public/pill2.png"
        alt=""
      />
      <div className="w-full h-full">
        <div className="w-full flex items-center justify-center flex-col  h-full px-10">
          <motion.span
            // variants={fadeIn("down", 0.1)}
            // initial="hidden"
            // whileInView="show"
            // viewport={{ once: false, amount: 0.2 }}
            className="md:text-5xl text-3xl font-bold"
          >
            {" "}
            AI HealthEngine
          </motion.span>
          <motion.h1
            // variants={fadeIn("down", 0.2)}
            // initial="hidden"
            // whileInView="show"
            // viewport={{ once: false, amount: 0.2 }}
            className="md:text-2xl text-xs font-medium text-gray-600 "
          >
            "Where technology meets healthcare for a healthier future."
          </motion.h1>
          <Link to='/login' className="mt-2 ">
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="px-5 py-2 rounded-full bg-btn2 flex items-center hover:bg-sky-400"
            >
              Get Started
              <FaArrowRight className="ml-2" />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
