import React, { useState } from "react";
import emailjs from "emailjs-com";
import { toast } from "react-toastify";

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

    // Sending email using emailjs
    emailjs
      .sendForm(
        "service_r2al8yc",
        "template_xcl5fwg",
        e.target,
        "-NVl8nEcxsB-UMHHZ"
      )
      .then(
        (result) => {
          console.log(result.text);
          toast.success("Mail sent successfully");
        },
        (error) => {
          console.log(error.text);
          toast.error("Failed to send mail. Please try again.");
        }
      );

    // Sending data to localhost:5000
    fetch("http://localhost:5000/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        toast.success("Mail sent to backend successfully");
      })
      .catch((error) => {
        console.error("Error:", error);
        toast.error("Failed to send data to backend. Please try again.");
      });

    // Resetting form data
    setFormData({
      name: "",
      email: "",
      phone: "",
      details: "",
    });
  };

  return (
    <section className="relative h-screen font-text items-center flex justify-center text-black py-20 md:py-11 bg-white mt-20">
      <div className="container mb-52 md:mb-0">
        <div className="-mx-4 flex flex-wrap md:mt-20 lg:justify-between">
          <div className="w-full px-4 lg:w-1/2 xl:w-6/12">
            <div className="mb-10 max-w-[570px] lg:mb-0 px-4">
              <span className="mb-4 px-8 md:block md:text-4xl text-3xl text-lightText font-bold justify-center flex">
                Contact Us
              </span>
              <p className="mb-9 text-gray-600 dark:text-gray-400 text-sm font-feedback font-medium leading-relaxed text-body-color px-8 text-justify">
                Reach out for personalized assistance and inquiries. We're here to help you navigate your health journey with expert guidance and support.
              </p>
              <div className="mb-8 flex w-full max-w-[370px]">
                <div className="mr-6 flex h-[60px] w-full max-w-[60px] items-center justify-center overflow-hidden rounded sm:h-[70px] sm:max-w-[70px]">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M30.6 11.8002L17.7 3.5002C16.65 2.8502 15.3 2.8502 14.3 3.5002L1.39998 11.8002C0.899983 12.1502 0.749983 12.8502 1.04998 13.3502C1.39998 13.8502 2.09998 14.0002 2.59998 13.7002L3.44998 13.1502V25.8002C3.44998 27.5502 4.84998 28.9502 6.59998 28.9502H25.4C27.15 28.9502 28.55 27.5502 28.55 25.8002V13.1502L29.4 13.7002C29.6 13.8002 29.8 13.9002 30 13.9002C30.35 13.9002 30.75 13.7002 30.95 13.4002C31.3 12.8502 31.15 12.1502 30.6 11.8002ZM13.35 26.7502V18.5002C13.35 18.0002 13.75 17.6002 14.25 17.6002H17.75C18.25 17.6002 18.65 18.0002 18.65 18.5002V26.7502H13.35ZM26.3 25.8002C26.3 26.3002 25.9 26.7002 25.4 26.7002H20.9V18.5002C20.9 16.8002 19.5 15.4002 17.8 15.4002H14.3C12.6 15.4002 11.2 16.8002 11.2 18.5002V26.7502H6.69998C6.19998 26.7502 5.79998 26.3502 5.79998 25.8502V11.7002L15.5 5.4002C15.8 5.2002 16.2 5.2002 16.5 5.4002L26.3 11.7002V25.8002Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="w-full">
                  <h4 className="mb-1 md:text-xl text-lg font-semibold text-dark">Our Location</h4>
                  <p className="text-sm italic text-gray-700">Mumbai</p>
                </div>
              </div>

              <div className="mb-8 flex w-full max-w-[370px]">
                <div className="mr-6 flex h-[60px] w-full max-w-[60px] items-center justify-center overflow-hidden rounded sm:h-[70px] sm:max-w-[70px]">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clip-path="url(#clip0_941_17577)">
                      <path
                        d="M24.3 31.1499C22.95 31.1499 21.4 30.7999 19.7 30.1499C16.3 28.7999 12.55 26.1999 9.19997 22.8499C5.84997 19.4999 3.24997 15.7499 1.89997 12.2999C0.39997 8.59994 0.54997 5.54994 2.29997 3.84994C2.34997 3.79994 2.44997 3.74994 2.49997 3.69994L6.69997 1.19994C7.74997 0.599942 9.09997 0.899942 9.79997 1.89994L12.75 6.29994C13.45 7.34994 13.15 8.74994 12.15 9.44994L10.35 10.6999C11.65 12.7999 15.35 17.9499 21.25 21.6499L22.35 20.0499C23.2 18.8499 24.55 18.4999 25.65 19.2499L30.05 22.1999C31.05 22.8999 31.35 24.2499 30.75 25.2999L28.25 29.4999C28.2 29.5999 28.15 29.6499 28.1 29.6999C27.2 30.6499 25.9 31.1499 24.3 31.1499ZM3.79997 5.54994C2.84997 6.59994 2.89997 8.74994 3.99997 11.4999C5.24997 14.6499 7.64997 18.0999 10.8 21.2499C13.9 24.3499 17.4 26.7499 20.5 27.9999C23.25 29.0999 25.4 29.1499 26.45 28.1999L28.75 24.4999L24.5 21.7499L22.95 23.9499C22.6 24.4999 21.9 24.6499 21.25 24.2999C14.55 20.4499 10.05 14.3999 8.24997 11.1999C7.89997 10.5499 8.04997 9.79994 8.59997 9.44994L10.8 7.89994L8.04997 3.64994L3.79997 5.54994Z"
                        fill="currentColor"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_941_17577">
                        <rect width="32" height="32" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <div className="w-full">
                  <h4 className="mb-1 md:text-xl text-lg font-semibold text-dark">Phone Number</h4>
                  <p className="text-sm italic text-gray-700">+91 9009009009</p>
                </div>
              </div>

              <div className="mb-8 flex w-full max-w-[370px]">
                <div className="mr-6 flex h-[60px] w-full max-w-[60px] items-center justify-center overflow-hidden rounded sm:h-[70px] sm:max-w-[70px]">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M27.2 4.79994H4.8C3.25 4.79994 2 6.04994 2 7.59994V24.3999C2 25.9499 3.25 27.1999 4.8 27.1999H27.2C28.75 27.1999 30 25.9499 30 24.3999V7.59994C30 6.04994 28.75 4.79994 27.2 4.79994ZM27.2 7.39994L16 13.9999L4.8 7.39994H27.2ZM4.8 24.5999V7.99994L15.2 14.9999C15.65 15.2499 16.35 15.2499 16.8 14.9999L27.2 7.99994V24.5999H4.8Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div className="w-full">
                  <h4 className="mb-1 md:text-xl text-lg font-semibold text-dark">Email Address</h4>
                  <p className="text-sm italic text-gray-700">drmedsonnetwork@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full px-4 lg:w-1/2 xl:w-5/12">
            <div className="relative rounded-lg bg-white p-8 shadow-lg sm:p-12">
              <form onSubmit={sendEmail}>
                <div className="mb-6">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Name"
                    className="w-full rounded border border-gray-300 py-3 px-4 text-base font-medium text-body-color placeholder-body-color outline-none focus:border-primary focus-visible:shadow-none"
                    required
                  />
                </div>
                <div className="mb-6">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full rounded border border-gray-300 py-3 px-4 text-base font-medium text-body-color placeholder-body-color outline-none focus:border-primary focus-visible:shadow-none"
                    required
                  />
                </div>
                <div className="mb-6">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                    className="w-full rounded border border-gray-300 py-3 px-4 text-base font-medium text-body-color placeholder-body-color outline-none focus:border-primary focus-visible:shadow-none"
                    required
                  />
                </div>
                <div className="mb-6">
                  <textarea
                    rows="6"
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    placeholder="Details"
                    className="w-full rounded border border-gray-300 py-3 px-4 text-base font-medium text-body-color placeholder-body-color outline-none focus:border-primary focus-visible:shadow-none"
                    required
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full bg-btn2 rounded border border-primary p-3 transition hover:bg-opacity-90"
                  >
                    <span className="text-white  text-base font-semibold">
                      Send Message
                    </span>
                  </button>
                </div>
              </form>
              <div>
                <span className="absolute -top-10 -right-9 z-[-1]">
                  <svg
                    width="100"
                    height="134"
                    viewBox="0 0 100 134"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M74 133.1c29.1 0 52.7-23.5 52.7-52.7S103.1 27.7 74 27.7 21.3 51.2 21.3 80.4 44.9 133.1 74 133.1z"
                      fill="#E3DFFF"
                    />
                  </svg>
                </span>
                <span className="absolute -top-10 -left-4 z-[-1]">
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 44 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="22" cy="22" r="22" fill="#E3DFFF" />
                  </svg>
                </span>
                <span className="absolute -bottom-10 -right-4 z-[-1]">
                  <svg
                    width="74"
                    height="74"
                    viewBox="0 0 74 74"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="37" cy="37" r="37" fill="#E3DFFF" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
