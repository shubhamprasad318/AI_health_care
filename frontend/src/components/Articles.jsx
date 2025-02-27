import React from "react";
import BlogCards from "./BlogCards";

function Blogs() {
  const articles = [
    {
      id: 1,
      title: "4 Foods From Your Kitchen Shelf to Lose Belly Fat!",
      pic: "https://www.practostatic.com/fit/0b9332b0fe13467ab99841c08f5bc05277b51aeb",
      author: "Ms.Huda Shaikh",
      views: "32K",
      link: "https://www.practo.com/healthfeed/4-foods-from-your-kitchen-shelf-to-lose-belly-fat-26114/post",
    },
    {
      id: 2,
      title: "Common Oral Conditions and Its Management",
      pic: "https://www.practostatic.com/fit/2586553a2ecfdb0830fe0f6106d45954f09dbbc5",
      author: "Dr.Yogesh Rao",
      views: "51K",
      link: "https://www.practo.com/healthfeed/common-oral-conditions-and-its-management-17569/post",
    },
    {
      id: 3,
      title: "7 Fruits That Improve Your Skin",
      pic: "https://www.practostatic.com/fit/4515aea15d660c88a08ae2f34b089105f585d0bc",
      author: "Dr.Mukesh Batra",
      views: "42K",
      link: "https://www.practo.com/healthfeed/7-fruits-that-improve-your-skin-25774/post",
    },
    {
      id: 4,
      title: "7 Fruits That Improve Your Skin",
      pic: "https://www.practostatic.com/fit/4515aea15d660c88a08ae2f34b089105f585d0bc",
      author: "Dr.Mukesh Batra",
      views: "42K",
      link: "https://www.practo.com/healthfeed/7-fruits-that-improve-your-skin-25774/post",
    },
  ];

  return (
    <div className="md:h-screen h-full flex justify-center items-center flex-col w-full ">
      <div className="w-full flex justify-center items-center md:my-10">
        <h1 className="md:text-3xl text-lg text-gray-800 font-bold  tracking-wide ">
          Read top articles from health experts
        </h1>
      </div>
      <div className="flex md:w-[1000px] w-[400px] md:mx-10 md:space-x-5  my-5 overflow-x-scroll ">
        {articles.map((article) => (
          <BlogCards key={article.id} article={article} />
        ))}
      </div>
      <div className="flex justify-center items-center">
        <button className="flex justify-center items-center px-3 py-2 bg-btn2 rounded text-white font-semibold">
          More articles
        </button>
      </div>
    </div>
  );
}

export default Blogs;
