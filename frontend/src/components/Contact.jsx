import React, { useState } from "react";
import { toast } from "react-toastify";
import { contactAPI } from "../utils/api";
import { FaEnvelope, FaLocationDot, FaPhone } from "react-icons/fa6";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    details: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendEmail = (e) => {
    e.preventDefault();

    // Validate form data before sending
    if (!formData.name || formData.name.trim().length === 0) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.email || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!formData.details || formData.details.trim().length < 10) {
      toast.error("Please enter at least 10 characters in the message field");
      return;
    }

    // Prepare data for backend (trim whitespace)
    const submitData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone ? formData.phone.trim() : null,
      details: formData.details.trim(),
    };

    // Sending data to backend (handles email sending)
    contactAPI
      .submit(submitData)
      .then((data) => {
        if (data.success) {
          toast.success(data.message || "Message sent successfully!");
          // Reset form only on success
          setFormData({
            name: "",
            email: "",
            phone: "",
            details: "",
          });
        } else {
          toast.error(data.message || "Failed to send message");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        const errorMessage = error.message || "Failed to send data to backend. Please try again.";
        toast.error(errorMessage);
      });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500";

  const contactInfo = [
    { icon: FaLocationDot, label: "Location", value: "Mumbai, India" },
    { icon: FaPhone, label: "Phone", value: "+91 9009009009" },
    { icon: FaEnvelope, label: "Email", value: "drmedsonnetwork@gmail.com" },
  ];

  return (
    <section id="contact" className="font-text bg-slate-50 py-20 dark:bg-gray-900/50">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Contact
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl dark:text-white">
            We're here to help
          </h2>
          <p className="mt-4 max-w-md text-slate-600 dark:text-slate-400">
            Questions about your account, a feature or a partnership? Send us a message
            and we'll get back to you.
          </p>

          <div className="mt-10 space-y-5">
            {contactInfo.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200 dark:bg-gray-900 dark:text-brand-400 dark:ring-gray-800">
                  <Icon />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="font-medium text-slate-800 dark:text-gray-200">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={sendEmail}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your name" className={inputClass} required />
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone (optional)" className={inputClass} />
          </div>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className={inputClass} required />
          <textarea rows="5" id="details" name="details" value={formData.details} onChange={handleChange} placeholder="How can we help?" className={inputClass} required></textarea>
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
          >
            Send message
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
