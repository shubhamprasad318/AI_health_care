import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { signupSchema } from "../schema";
import { toast } from "react-toastify";
import { authAPI } from "../utils/api";

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
          // Validate and transform data to match backend requirements
          if (!values.first_name?.trim() || !values.last_name?.trim()) {
            toast.error("Please enter your first and last name");
            return;
          }

          if (!values.gender || !['Male', 'Female', 'Other'].includes(values.gender)) {
            toast.error("Please select a valid gender");
            return;
          }

          if (!values.age || isNaN(values.age) || parseInt(values.age, 10) < 1 || parseInt(values.age, 10) > 150) {
            toast.error("Please enter a valid age (1-150)");
            return;
          }

          if (!values.phone_number || String(values.phone_number).length < 10) {
            toast.error("Please enter a valid phone number (at least 10 digits)");
            return;
          }

          if (!values.city?.trim() || !values.state?.trim()) {
            toast.error("Please enter your city and state");
            return;
          }

          // Transform data to match backend requirements
          const signupData = {
            first_name: values.first_name.trim(),
            last_name: values.last_name.trim(),
            email: values.email.trim().toLowerCase(),
            password: values.password,
            phone_number: String(values.phone_number).trim(),
            age: parseInt(values.age, 10),
            gender: values.gender,
            city: values.city.trim(),
            state: values.state.trim(),
          };

          const data = await authAPI.signup(signupData);

          if (data.success) {
            // Show success message with email confirmation info
            toast.success(
              `🎉 ${data.message || "Registration successful!"}\n📧 Check your email (${values.email}) for welcome message!`,
              {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              }
            );
            setSignup(true);
            
            // Redirect after 2 seconds to let user see the toast
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          } else {
            setError(data.message || "Registration failed");
            toast.error(data.message || "Registration Failed!");
          }
        } catch (error) {
          console.error("Error during signup:", error);
          setError(error.message || "An error occurred during signup");
          toast.error(error.message || "Registration Failed!");
        }
      },
    });

  // Don't redirect immediately - let toast show first
  // Redirect is now handled with setTimeout in onSubmit
  
  return (
    <div className="relative flex flex-col justify-center items-center w-full md:h-[600px] font-text h-[700px] mt-20 md:mt-0">
      <div className="rounded shadow-md shadow-gray-400 mx-10">
        <div className="">
          <h1 className="font-semibold capitalize text-4xl justify-center items-center flex p-4 text-lightText">
            register
          </h1>
          <p className="text-xs px-3 py-2 text-gray-700 font-semibold flex justify-center">
            Join AIHealth Engine for personalized wellness with just a click –
            Register today!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col justify-center px-2">
            <div className="md:flex rounded-md mb-5 px-4 text-gray-500">
              <div className="flex flex-col px-2 py-2">
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
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2"
                />
                {errors.last_name && touched.last_name ? (
                  <p className="text-sm text-red-700">{errors.last_name}</p>
                ) : null}
              </div>
            </div>
            <div className="px-6 mb-5">
              <input
                name="phone_number"
                id="phone_number"
                type="number"
                placeholder="Phone Number"
                className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2 w-full"
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
              <input
                name="email"
                id="email"
                type="email"
                placeholder="Email"
                className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2 w-full"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="off"
              />
              {errors.email && touched.email ? (
                <p className="text-sm text-red-700">{errors.email}</p>
              ) : null}
            </div>
            <div className="md:flex rounded-md mb-5 px-4 text-gray-500">
              <div className="flex flex-col px-2 py-2">
                <input
                  name="age"
                  id="age"
                  type="number"
                  placeholder="Age"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2 w-full"
                  value={values.age}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                {errors.age && touched.age ? (
                  <p className="text-sm text-red-700">{errors.age}</p>
                ) : null}
              </div>
              <div className="flex flex-col px-2 py-2">
                <select
                  name="gender"
                  id="gender"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2 w-full"
                  value={values.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && touched.gender ? (
                  <p className="text-sm text-red-700">{errors.gender}</p>
                ) : null}
              </div>
            </div>
            <div className="md:flex rounded-md mb-5 px-4 text-gray-500">
              <div className="flex flex-col px-2 py-2">
                <input
                  name="city"
                  id="city"
                  type="text"
                  placeholder="City"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2 w-full"
                  value={values.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                {errors.city && touched.city ? (
                  <p className="text-sm text-red-700">{errors.city}</p>
                ) : null}
              </div>
              <div className="flex flex-col px-2 py-2">
                <input
                  name="state"
                  id="state"
                  type="text"
                  placeholder="State"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2 w-full"
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
            <div className="md:flex rounded-md mb-5 px-4">
              <div className="flex flex-col px-2 py-2">
                <input
                  name="password"
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
                {errors.password && touched.password ? (
                  <p className="text-sm text-red-700">{errors.password}</p>
                ) : null}
              </div>
              <div className="flex flex-col px-2 py-2">
                <input
                  name="confirm_password"
                  id="confirm_password"
                  type="password"
                  placeholder="Confirm Password"
                  className="bg-transparent shadow-sm focus:outline-none shadow-gray-400 font-medium px-4 py-2"
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
          <div className="flex justify-center text-gray-500">
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
            <button
              type="submit"
              className="capitalize bg-button font-semibold text-white bg-btn2 px-8 py-2 rounded hover:opacity-90 transition-opacity"
            >
              register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
