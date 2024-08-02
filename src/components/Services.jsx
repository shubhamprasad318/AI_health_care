import React from "react";
// import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn } from "../variants";

const Service = () => {
  return (
    <section className="font-text my-10">
      <div className="container mx-auto">
        <div className="-mx-2 flex flex-wrap">
          <div className="w-full px-4 font-nunito text-light_text dark:text-dark_text">
            <div className="mx-auto mb-12 max-w-[510px] text-center lg:mb-10">
              <h2 className="text-lightText mb-3 text-3xl font-extrabold  sm:text-4xl md:text-[40px] font-playfair">
                What We Offer?
              </h2>
              <p className="text-xs md:text-sm text-gray-700 ">
                Elevate well-being with our AI HealthEngine module: personalized
                insights, proactive guidance, and seamless wellness at your
                fingertips.
              </p>
            </div>
          </div>
        </div>

        <div className="-mx-4 flex flex-wrap">
          <ServiceCard
            title="Disease Prediction Model"
            details="Our system, driven by advanced algorithms, foresees potential diseases through thorough health data analysis. This foresight enables proactive interventions, reshaping preventive healthcare for personalized and optimal well-being."
            icon="public/health-report.gif"
          />

          <ServiceCard
            title="Chatbot Assistant"
            details="Introducing your personalized health assistant: Our chatbot utilizes advanced algorithms to provide instant health insights and guidance. Seamlessly interactive, it's your dedicated partner for a healthier, more informed lifestyle."
            icon="public/chat-bot.gif"
          />
          <ServiceCard
            title="Medical Reports Storage"
            details="Empower yourself with easy access to your health history, effortlessly organize and secure your medical reports. Our advanced system ensures easy access, empowering you to take control of your health history for informed decision-making."
            icon="public/server.gif"
          />

          <ServiceCard
            title="Book an Appointment "
            details="Effortlessly schedule your next appointment with our streamlined booking system. Take control of your health journey – book, confirm, and manage appointments with ease, ensuring timely access to personalized care."
            icon="public/appointment.gif"
          />
        </div>
      </div>
    </section>
  );
};

export default Service;

const ServiceCard = ({ icon, title, details }) => {
  return (
    <>
      <motion.div
        variants={fadeIn("up", 0)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.9 }}
        className="w-full  md:px-10 px-5  md:w-1/2 "
      >
        <div className="mx-6 md:mx-0 mb-9 rounded-[20px]  border-2 border-lightText shadow shadow-gray-400 p-10 transform transition duration-300 hover:scale-110 md:px-7 font-nunito flex flex-col md:flex-row items-center justify-center">
          <div className="my-2 flex justify-between h-[50px] md:w-full items-center rounded-2xl ">
            <img src={icon} alt="" className="w-20 mix-blend-multiply " />
          </div>
          <div>
            <h4 className="text-2xl font-semibold text-dark ">{title}</h4>
            <p className="text-gray-800 text-justify  text-xs">{details}</p>
          </div>
        </div>
      </motion.div>
    </>
  );
};
