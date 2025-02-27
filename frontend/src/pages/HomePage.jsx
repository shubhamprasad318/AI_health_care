import React from "react";
import HeroSection from "../components/HeroSection";
import About from "../components/About";
import Service from "../components/Services";
import PageDivider from "../components/PD";
import Blogs from "../components/Articles";
import Testimonials from "../components/Testimonials";
import Contact from "../components/Contact";
import FAQ from "../components/FAQs";
import Footer from "../components/Footer";

function HomePage() {
  return (
    <div
      className="w-full h-full bg-lightBackground overflow-hidden 
    "
    >
      <div className="">
        <div className="w-full h-screen ">
          <HeroSection />
          <About />
        </div>
      </div>
      <div className="md:mx-10 mx-5">
        <Service />
      </div>
      <PageDivider />
      <div className="md:mx-10">
        <Blogs />
        <Testimonials />
        <FAQ />
      </div>
      <Contact />

      <Footer />
    </div>
  );
}

export default HomePage;
