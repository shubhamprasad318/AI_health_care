import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CiMenuFries } from "react-icons/ci";
import { RxCross2 } from "react-icons/rx";
import { FaHome } from "react-icons/fa";  // ✅ FaHome is in 'fa', not 'fa6'
import { FaMoon, FaSun } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavBar() {
  const { loggedIn, logout } = useAuth();

  // ✅ UPDATED: Added "Home" as first menu item
  const menuItems = [
    {
      id: 0,
      name: "home",
      link: "/",
    },
    {
      id: 1,
      name: "dashboard",
      link: "/dashboard",
    },
    {
      id: 2,
      name: "predict disease",
      link: "/predict",
    },
    {
      id: 3,
      name: "prediction history",
      link: "/history",
    },
    {
      id: 4,
      name: "book appointments",
      link: "/book",
    },
    {
      id: 5,
      name: "health tools",
      link: "/tools",
    },
    {
      id: 6,
      name: "read articles",
      link: "/article",  // ✅ Changed from external link to internal route
    },
  ];

  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    console.log(isOpen);
  };

  const menuSlide = {
    initial: {
      x: "-100%",
    },
    enter: {
      x: "0%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      x: "-100%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
  };

  const slide = {
    initial: {
      x: "-100%",
    },
    enter: {
      x: "0%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      x: "-100%",
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
  };

  return (
    <div className="w-full h-[70px] flex justify-between items-center z-20 font-text sticky top-0 bg-white p-5 shadow-md">
      <div className="flex items-center space-x-3 mx-1 md:mx-5">
        <div>
          <motion.button
            onClick={toggleMenu}
            whileTap={{ scale: 0.8 }}
            className="flex items-center border-2 md:px-3 md:py-2 px-2 py-1 rounded-full border-btn1 cursor-pointer text-sm hover:bg-btn1 hover:text-white transition-all"
          >
            {isOpen ? <RxCross2 /> : <CiMenuFries />}
            <h1 className="capitalize px-2">menu</h1>
          </motion.button>

          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.ul
                variants={menuSlide}
                animate="enter"
                exit="exit"
                initial="initial"
                className="absolute top-20 left-0 bg-btn1 text-white rounded-r-2xl shadow-2xl overflow-hidden min-w-[250px]"
              >
                {menuItems.map((item, index) => (
                  <motion.li
                    variants={slide}
                    animate="enter"
                    exit="exit"
                    initial="initial"
                    className={`flex items-center py-3 px-5 cursor-pointer capitalize hover:bg-white hover:text-btn1 transition-all border-b border-white/20 ${
                      item.id === 0 ? "bg-white/10 font-bold" : ""
                    }`}
                    key={item.id}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* ✅ Show Home icon for first item */}
                    {item.id === 0 && <FaHome className="mr-2" />}
                    
                    <Link
                      to={item.link}
                      onClick={() => {
                        setIsOpen(!isOpen);
                      }}
                      className="w-full"
                    >
                      {item.name}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="">
        <Link to="/">
          <motion.h1
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.3,
              ease: [0, 0.71, 0.2, 1.01],
              scale: {
                type: "spring",
                damping: 5,
                stiffness: 100,
                restDelta: 0.001,
              },
            }}
            className="cursor-pointer uppercase md:text-4xl text-3xl font-semibold tracking-wider font-logo text-lightText hover:scale-110 transition-transform"
          >
            ai-he
          </motion.h1>
        </Link>
      </div>

      {loggedIn ? (
        <div className="flex items-center">
          <Link to="/profile">
            <motion.button 
              whileTap={{ scale: 0.8 }}
              className="hover:scale-110 transition-transform"
            >
              <img 
                src="/user.png" 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-btn1 object-cover" 
              />
            </motion.button>
          </Link>
          <motion.button
            onClick={logout}
            whileTap={{ scale: 0.8 }}
            className="md:mx-2 mx-1 border-2 md:px-3 md:py-2 px-2 py-1 rounded-full border-btn1 cursor-pointer text-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all font-semibold"
          >
            Logout
          </motion.button>
        </div>
      ) : (
        <div className="flex">
          <Link to="/login">
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="font-bold md:mx-2 mx-1 md:px-3 md:py-2 px-2 py-1 rounded-full bg-btn1 cursor-pointer text-white text-sm hover:bg-btn1/80 transition-all"
            >
              Login
            </motion.button>
          </Link>
          <Link to="/signup">
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="md:mx-2 mx-1 border-2 md:px-3 md:py-2 px-2 py-1 rounded-full border-btn1 cursor-pointer text-sm hover:bg-btn1 hover:text-white transition-all"
            >
              Register
            </motion.button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default NavBar;
