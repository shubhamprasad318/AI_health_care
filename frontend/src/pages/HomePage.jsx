import React, { useEffect, useState } from "react";
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
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    // Observe all sections
    const sections = document.querySelectorAll("[data-animate]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-lightBackground via-white to-lightBackground overflow-hidden relative">
      {/* Animated background elements with better performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top-left gradient blob */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-btn2/10 to-sky-400/10 rounded-full blur-3xl animate-blob"></div>
        
        {/* Bottom-right gradient blob */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-btn1/10 to-purple-400/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        
        {/* Center gradient blob */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-lightText/5 to-blue-300/5 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-btn2/30 rounded-full animate-float"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-btn1/30 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-2/3 w-4 h-4 bg-sky-400/20 rounded-full animate-float animation-delay-4000"></div>
      </div>

      {/* Main content with relative positioning */}
      <div className="relative z-10">
        {/* Hero & About Section */}
        <div className="w-full min-h-screen flex flex-col">
          <div
            id="hero"
            data-animate
            className={`transition-all duration-1000 ${
              isVisible.hero
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <HeroSection />
          </div>
          
          <div
            id="about"
            data-animate
            className={`transition-all duration-1000 delay-200 ${
              isVisible.about
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <About />
          </div>
        </div>

        {/* Services Section */}
        <div
          id="services"
          data-animate
          className={`md:mx-10 mx-5 my-8 transform transition-all duration-700 ${
            isVisible.services
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-10 scale-95"
          }`}
        >
          <Service />
        </div>

        {/* Page Divider */}
        <div className="my-8">
          <PageDivider />
        </div>

        {/* Blog, Testimonials, FAQ Section */}
        <div className="md:mx-10 mx-5 space-y-12 py-8">
          {/* Blogs Section */}
          <div
            id="blogs"
            data-animate
            className={`transform transition-all duration-700 ${
              isVisible.blogs
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-10"
            } hover:scale-[1.01] hover:shadow-2xl rounded-2xl`}
          >
            <Blogs />
          </div>

          {/* Testimonials Section */}
          <div
            id="testimonials"
            data-animate
            className={`transform transition-all duration-700 ${
              isVisible.testimonials
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-10"
            } hover:scale-[1.01] hover:shadow-2xl rounded-2xl`}
          >
            <Testimonials />
          </div>

          {/* FAQ Section */}
          <div
            id="faq"
            data-animate
            className={`transform transition-all duration-700 ${
              isVisible.faq
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-10 scale-95"
            } hover:scale-[1.01] hover:shadow-2xl rounded-2xl`}
          >
            <FAQ />
          </div>
        </div>

        {/* Contact Section */}
        <div
          id="contact"
          data-animate
          className={`transform transition-all duration-700 ${
            isVisible.contact
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <Contact />
        </div>

        {/* Footer */}
        <div
          id="footer"
          data-animate
          className={`transition-all duration-700 ${
            isVisible.footer ? "opacity-100" : "opacity-0"
          }`}
        >
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default HomePage;
