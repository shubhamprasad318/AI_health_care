import React from "react";

function Footer() {
  return (
    <div className="w-full md:h-[200px] h-[250px] bg-lightText font-text  ">
      <div className="w-full h-[80%] flex flex-col md:flex-row">
        <div className="md:w-1/3 w-full h-full flex flex-col justify-center items-center ">
          <h1 className="text-lg md:text-3xl font-bold text-white">
            Subscribe to our newsletter
          </h1>
          <p className="text-sm text-white px-5 mx-5 font-medium">
            Get exclusive health updates and articles delivered to your inbox.
            Subscribe now!
          </p>
        </div>
        <div className="md:w-2/3 w-full flex justify-center items-center h-full ">
          <form action="">
            <input
              type="email"
              placeholder="Email"
              className="px-10 py-3 bg-white rounded focus:outline-none "
            />
            <button className="bg-btn2 px-3 py-2 md:mx-3 mx-1 rounded-lg">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <div className="w-full justify-center items-center flex">
        <p className="text-xs font-bold text-white">
          © AI-HealthEngine 2024. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}

export default Footer;
