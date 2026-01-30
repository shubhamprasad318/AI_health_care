import React from "react";
// import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn } from "../variants";

const Service = () => {
  return (
    <section className="font-text my-10 relative py-12">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-btn2/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-btn1/10 rounded-full blur-2xl"></div>
      </div>
      
      <div className="container mx-auto relative z-10">
        <div className="-mx-2 flex flex-wrap">
          <div className="w-full px-4 font-nunito text-light_text dark:text-dark_text">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-auto mb-12 max-w-[510px] text-center lg:mb-10"
            >
              <h2 className="text-lightText mb-3 text-3xl font-extrabold sm:text-4xl md:text-[40px] font-playfair bg-gradient-to-r from-lightText via-btn2 to-lightText bg-clip-text text-transparent">
                What We Offer?
              </h2>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                Elevate well-being with our AI HealthEngine module: personalized
                insights, proactive guidance, and seamless wellness at your
                fingertips.
              </p>
            </motion.div>
          </div>
        </div>

        <div className="-mx-4 flex flex-wrap">
          <ServiceCard
            title="Disease Prediction Model"
            details="Our system, driven by advanced algorithms, foresees potential diseases through thorough health data analysis. This foresight enables proactive interventions, reshaping preventive healthcare for personalized and optimal well-being."
            icon="/health-report.gif"
          />

          <ServiceCard
            title="Chatbot Assistant"
            details="Introducing your personalized health assistant: Our chatbot utilizes advanced algorithms to provide instant health insights and guidance. Seamlessly interactive, it's your dedicated partner for a healthier, more informed lifestyle."
            icon="/chat-bot.gif"
          />
          <ServiceCard
            title="Medical Reports Storage"
            details="Empower yourself with easy access to your health history, effortlessly organize and secure your medical reports. Our advanced system ensures easy access, empowering you to take control of your health history for informed decision-making."
            icon="/server.gif"
          />

          <ServiceCard
            title="Book an Appointment "
            details="Effortlessly schedule your next appointment with our streamlined booking system. Take control of your health journey – book, confirm, and manage appointments with ease, ensuring timely access to personalized care."
            icon="/appointment.gif"
          />

          <ServiceCard
            title="AI Health Tools"
            details="Advanced AI-powered health tools including symptom analysis, drug interaction checker, medical term explanations, and personalized health plans powered by Google Gemini AI."
            icon="/chat-bot.gif"
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
        className="w-full md:px-10 px-5 md:w-1/2"
      >
        <motion.div
          whileHover={{ y: -10, scale: 1.02 }}
          className="mx-6 md:mx-0 mb-9 rounded-[20px] border-2 border-lightText/30 shadow-xl shadow-gray-400/50 p-10 transform transition-all duration-500 hover:shadow-2xl hover:shadow-btn2/30 hover:border-btn2 md:px-7 font-nunito flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-white via-lightBackground/50 to-white relative overflow-hidden group"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-btn2/10 via-transparent to-btn1/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Decorative corner element */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-btn2/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10 my-2 flex justify-between h-[50px] md:w-full items-center rounded-2xl">
            <motion.img 
              src={icon} 
              alt="" 
              className="w-20 mix-blend-multiply group-hover:scale-110 transition-transform duration-500" 
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="relative z-10">
            <h4 className="text-2xl font-semibold text-dark mb-2 group-hover:text-lightText transition-colors duration-300">{title}</h4>
            <p className="text-gray-800 text-justify text-xs leading-relaxed">{details}</p>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};
