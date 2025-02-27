import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CiMenuFries } from "react-icons/ci";
import { RxCross2 } from "react-icons/rx";
import { FaMoon, FaSun } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavBar() {
  const { loggedIn, logout } = useAuth();

  const menuItems = [
    {
      id: 1,
      name: "predict disease",
      link: "/predict",
    },
    {
      id: 2,
      name: "book appointments",
      link: "/book",
    },
    {
      id: 3,
      name: "read articles",
      link: "https://www.healthline.com/",
    },
  ];
  // const [mode, setMode] = useState("light");
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

  // useEffect(() => {
  //   if (mode === "dark") {
  //     document.documentElement.classList.add("dark");
  //   } else {
  //     document.documentElement.classList.remove("dark");
  //   }
  // }, [mode]);

  return (
    <div className="w-full h-[70px] flex justify-between items-center  z-20 font-text sticky top-0 bg-white p-5  ">
      <div className="flex items-center space-x-3 mx-1 md:mx-5">
        <div>
          <motion.button
            onClick={toggleMenu}
            whileTap={{ scale: 0.8 }}
            className="flex items-center border-2 md:px-3 md:py-2 px-2 py-1 rounded-full border-btn1 cursor-pointer text-sm"
          >
            {isOpen ? <RxCross2 /> : <CiMenuFries />}
            <h1 className="capitalize px-2 ">menu</h1>
          </motion.button>

          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.ul
                variants={menuSlide}
                animate="enter"
                exit="exit"
                initial="initial"
                className="absolute top-20 left-0 bg-btn1 justify-center text-justify bg-opacity-80"
              >
                {menuItems.map((item) => (
                  <motion.li
                    to={item.link}
                    variants={slide}
                    animate="enter"
                    exit="exit"
                    initial="initial"
                    className="flex justify-center py-2 px-3 cursor-pointer capitalize hover:bg-btn1"
                    key={item.id}
                  >
                    <Link
                      to={item.link}
                      onClick={() => {
                        setIsOpen(!isOpen);
                      }}
                    >
                      {item.name}
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {/* <div>
          <button
            onClick={() => setMode(mode === "light" ? "dark" : "light")}
            className="sm:mr-4 flex text-xl mr-10  rounded-full "
          >
            {mode === "dark" ? (
              <FaSun className="text-yellow-300 cursor-pointer" />
            ) : (
              <FaMoon className="text-black cursor-pointer" />
            )}
          </button>
        </div> */}
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
            className="cursor-pointer  uppercase md:text-4xl text-3xl font-semibold tracking-wider font-logo text-lightText"
          >
            ai-he
          </motion.h1>
        </Link>
      </div>
      {loggedIn ? (
        <div className="flex  items-center">
          <Link to="/profile">
            <motion.button whileTap={{ scale: 0.8 }} className="">
              <img src="public/user.png" alt="" className="w-10" />
            </motion.button>
          </Link>
          <button onClick={logout}>
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="md:mx-2 mx-1 border-2 md:px-3 md:py-2 px-2 py-1 rounded-full border-btn1 cursor-pointer text-sm"
            >
              Logout
            </motion.button>
          </button>
        </div>
      ) : (
        <div className="flex ">
          <Link to="/login">
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="font-bold md:mx-2 mx-1 md:px-3 md:py-2 px-2 py-1 rounded-full bg-btn1 cursor-pointer text-white text-sm"
            >
              Login
            </motion.button>
          </Link>
          <Link to="/signup">
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="md:mx-2 mx-1 border-2 md:px-3 md:py-2 px-2 py-1 rounded-full border-btn1 cursor-pointer text-sm"
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
