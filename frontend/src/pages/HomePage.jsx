import React from "react";
import HeroSection from "../components/HeroSection";
import About from "../components/About";
import Service from "../components/Services";
import PageDivider from "../components/PD";
import Contact from "../components/Contact";
import FAQ from "../components/FAQs";
import Footer from "../components/Footer";

// Each section animates itself on scroll with framer-motion
function HomePage() {
  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <HeroSection />
      <Service />
      <About />
      <PageDivider />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}

export default HomePage;
