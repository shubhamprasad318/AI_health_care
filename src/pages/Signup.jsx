import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { signupSchema } from "../schema";
import { toast } from "react-toastify";

function Signup() {
  const initialValues = {
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    password: "",
    confirm_password: "",
    age: "",
    gender: "",
    city: "",
    state: "",
  };

  const navigate = useNavigate();
  const [signup, setSignup] = useState(false);
  const [error, setError] = useState(false);

  // distructuring the values.
  const { values, errors, touched, handleBlur, handleChange, handleSubmit } =
    useFormik({
      initialValues: initialValues,
      validationSchema: signupSchema,
      onSubmit: async (values) => {
        try {
          const response = await fetch("http://localhost:5000/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          });

          const data = await response.json();

          if (data.success) {
           
            toast.success("Registered successfully!");
            setSignup(true);
          } else {
            setError(data.message);
          }
        } catch (error) {
          // console.error("Error during signup:", error);
          setError("An error occurred during signup");
          toast.error("Registration Failed!");
        }
      },
    });

  // redirect to login page.
  if (signup) {
    navigate("/login");
    return null;
  }
  return (
    <div className="relative flex flex-col justify-center items-center  w-full md:h-[600px]  font-text h-[700px] mt-20 md:mt-0">
      <div className="rounded shadow-md shadow-gray-400 mx-10 ">
        <div className="">
          <h1 className="font-semibold capitalize text-4xl  justify-center items-center flex  p-4 text-lightText">
            register
          </h1>
          <p className="text-xs px-3 py-2 text-gray-700 font-semibold flex justify-center">
            Join AIHealth Engine for personalized wellness with just a click –
            Register today!
          </p>
        </div>

        <form>
          <div className="flex flex-col justify-center px-2 ">
            <div className=" md:flex rounded-md  mb-5 px-4 text-gray-500">
              {/* <label htmlFor="name" className="font-sans font-semibold uppercase">Name</label> */}
              <div className="flex flex-col px-2 py-2 ">
                <input
                  name="first_name"
                  id="first_name"
                  type="text"
                  placeholder="First Name"
                  value={values.first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2"
                />
                {errors.first_name && touched.first_name ? (
                  <p className="text-sm text-red-700">{errors.first_name}</p>
                ) : null}
              </div>
              <div className="flex flex-col px-2 py-2">
                <input
                  name="last_name"
                  id="last_name"
                  type="text"
                  placeholder="Last Name"
                  value={values.last_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium   px-4 py-2"
                />
                {errors.last_name && touched.last_name ? (
                  <p className="text-sm text-red-700">{errors.last_name}</p>
                ) : null}
              </div>
            </div>
            <div className="px-6 mb-5">
              {/* <label htmlFor="phone_number">Phone Number</label> */}
              <input
                name="phone_number"
                id="phone_number"
                type="number"
                placeholder="Phone Number"
                className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium    px-4 py-2 w-full"
                value={values.phone_number}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="off"
              />
              {errors.phone_number && touched.phone_number ? (
                <p className="text-sm text-red-700">{errors.phone_number}</p>
              ) : null}
            </div>
            <div className="px-6 mb-5">
              {/* <label htmlFor="email">Email Id</label> */}
              <input
                name="email"
                id="email"
                type="email"
                placeholder="Email"
                className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium    px-4 py-2 w-full"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="off"
              />
              {errors.email && touched.email ? (
                <p className="text-sm text-red-700">{errors.email}</p>
              ) : null}
            </div>{" "}
            <div className="md:flex rounded-md  mb-5 px-4 text-gray-500">
              <div className="flex flex-col px-2 py-2 ">
                <input
                  name="age"
                  id="age"
                  type="number"
                  placeholder="Age"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium    px-4 py-2 w-full"
                  value={values.age}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                {errors.age && touched.age ? (
                  <p className="text-sm text-red-700">{errors.age}</p>
                ) : null}
              </div>
              {/* Gender */}
              <div className="flex flex-col px-2 py-2 ">
                <input
                  name="gender"
                  id="gender"
                  type="text"
                  placeholder="Gender"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium    px-4 py-2 w-full"
                  value={values.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                {errors.gender && touched.gender ? (
                  <p className="text-sm text-red-700">{errors.gender}</p>
                ) : null}
              </div>
            </div>{" "}
            <div className="md:flex rounded-md  mb-5 px-4 text-gray-500">
              <div className="flex flex-col px-2 py-2 ">
                <input
                  name="city"
                  id="city"
                  type="text"
                  placeholder="City"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium    px-4 py-2 w-full"
                  value={values.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                {errors.city && touched.city ? (
                  <p className="text-sm text-red-700">{errors.city}</p>
                ) : null}
              </div>
              <div className="flex flex-col px-2 py-2 ">
                <input
                  name="state"
                  id="state"
                  type="text"
                  placeholder="State"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium    px-4 py-2 w-full"
                  value={values.state}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                {errors.state && touched.state ? (
                  <p className="text-sm text-red-700">{errors.state}</p>
                ) : null}
              </div>
            </div>
            <div className=" md:flex rounded-md  mb-5 px-4">
              <div className="flex flex-col px-2 py-2">
                {/* <label htmlFor="password">Password</label> */}
                <input
                  name="password"
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium    px-4 py-2"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                {errors.password && touched.password ? (
                  <p className="text-sm text-red-700">{errors.password}</p>
                ) : null}
              </div>
              {/* <label htmlFor="confirm_password" className="">
                Confirm Password
              </label> */}

              <div className="flex flex-col px-2 py-2">
                <input
                  name="confirm_password"
                  id="confirm_password"
                  type="password"
                  placeholder="Confirm Password"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium   px-4 py-2"
                  value={values.confirm_password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                {errors.confirm_password && touched.confirm_password ? (
                  <p className="text-sm text-red-700">
                    {errors.confirm_password}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex justify-center text-gray-500 first-line:">
            <p>
              Already have an account?
              <Link to="/login">
                <span className="p-2 capitalize text-btn1 font-semibold">
                  log in
                </span>
              </Link>
            </p>
          </div>
          <div className="flex justify-center p-4">
            <Link>
              <button
                type="submit"
                onClick={handleSubmit}
                className="capitalize bg-button font-semibold text-white bg-btn2 px-8 py-2 rounded"
              >
                register
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
export default Signup;
