import React, { useState } from "react";
import { GrNext, GrPrevious } from "react-icons/gr";

const testimonialsData = [
  {
    name: "Tom Hardy",
    username: "@thom.hardy",
    image: "https://randomuser.me/api/portraits/men/1.jpg",
    text: "To get social media testimonials like these, keep your customers engaged with your social media accounts by posting regularly yourself.",
  },
  {
    name: "Jane Doe",
    username: "@jane.doe",
    image: "https://randomuser.me/api/portraits/women/2.jpg",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod justo ac erat sagittis, a dictum ipsum consequat.",
  },
  // Add more testimonial data as needed
];

function Testimonials() {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  const handleNextClick = () => {
    setCurrentTestimonialIndex((prevIndex) =>
      prevIndex === testimonialsData.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevClick = () => {
    setCurrentTestimonialIndex((prevIndex) =>
      prevIndex === 0 ? testimonialsData.length - 1 : prevIndex - 1
    );
  };

  const { name, username, image, text } =
    testimonialsData[currentTestimonialIndex];

  return (
    <div className="my-20 relative">
      <div className="w-full flex flex-col md:flex-row items-center justify-center px-5 py-5">
        <div className="md:w-1/3  w-full flex justify-center items-center">
          <h1 className="md:text-5xl text-3xl capitalize font-bold ml-5 mb-20 md:mb-0">
            our happy <span className="text-lightText">clients</span>{" "}
          </h1>
        </div>
        <div className="bg-purple-500 h-[300px] w-[300px] absolute bg-opacity-15 rounded-full blur-xl top-0 right-[15%] animate-pulse"></div>
        <div className="bg-sky-500 h-[300px] w-[300px] absolute bg-opacity-15 rounded-full blur-xl top-5 right-0 animate-pulse"></div>
        <div className="w-2/3 ">
          <div className="w-full max-w-xl px-5 pt-5 pb-10 mx-auto text-gray-800 border  border-btn2 rounded-lg shadow-lg ">
            <div className="w-full pt-1 pb-5 mx-auto -mt-16 text-center">
              <a href="#" className="relative block">
                <img
                  alt="profil"
                  src={image}
                  className="mx-auto object-cover rounded-full h-20 w-20 shadow-md shadow-gray-400"
                />
              </a>
            </div>
            <div className="w-full mb-10">
              <div className="h-3 text-3xl leading-tight text-left  text-btn1">
                “
              </div>
              <p className="px-5 text-sm text-center text-gray-600 ">{text}</p>
              <div className="h-3 -mt-3 text-3xl leading-tight text-right text-btn1">
                ”
              </div>
            </div>
            <div className="w-full">
              <p className="font-bold text-center  text-btn1 text-md">{name}</p>
              <p className="text-xs text-center text-gray-500 ">{username}</p>
            </div>
          </div>
          <div className="flex justify-center mt-5">
            <button
              className="mr-2 px-4 py-4 text-btn2 border-2 border-btn2 rounded-full"
              onClick={handlePrevClick}
            >
              <GrPrevious />
            </button>
            <button
              className="px-4 py-4 text-btn2 border-2 border-btn2 rounded-full"
              onClick={handleNextClick}
            >
              <GrNext />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Testimonials;
