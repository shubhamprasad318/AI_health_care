import React from "react";
import { LiaEyeSolid } from "react-icons/lia";
// import { Link } from "react-router-dom";

function BlogCards({ article: { pic, title, link, views, author } }) {
  return (
    <a to={link}>
      <div className="mx-2 w-[300px] h-[350px] m-3 rounded overflow-hidden shadow-lg shadow-gray-500 dark:shadow-gray-900/50 dark:bg-gray-800 transition-all ease-in-out hover:scale-105 delay-100 duration-200">
        <div>
          <img src={pic} alt="img" />
          <h2 className="flex justify-center items-center py-2 px-3 tracking-wide font-semibold text-gray-800 dark:text-gray-100 text-xl">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 px-3 font-semibold">{author}</p>
          <div className="flex justify-end items-center px-2 font-bold text-gray-500 dark:text-gray-400">
            <LiaEyeSolid />
            <p className="px-2">{views}</p>
          </div>
        </div>
      </div>
    </a>
  );
}

export default BlogCards;
