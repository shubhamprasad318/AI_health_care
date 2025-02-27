import React from "react";
import { FaHandPointRight } from "react-icons/fa";

function PageDivider() {
  return (
    <div className="hidden md:flex">
      <div className="h-[400px] flex w-full justify-start items-center ">
        <div className="bg-img1 w-full flex h-full justify-start items-center  bg-fixed">
          <div className="p-4 text-gray-200 font-medium text-4xl font-playfair bg-sky-900 bg-opacity-50 w-full h-full"></div>
        </div>
      </div>
    </div>
  );
}

export default PageDivider;
