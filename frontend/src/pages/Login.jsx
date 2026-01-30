import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { loginSchema } from "../schema";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { authAPI } from "../utils/api";
import { FaEnvelope, FaLock, FaSpinner } from "react-icons/fa";

function Login() {
  const initialValues = {
    email: "",
    password: "",
  };

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { values, errors, touched, handleSubmit, handleBlur, handleChange } =
    useFormik({
      initialValues: initialValues,
      validationSchema: loginSchema,
      onSubmit: async (values) => {
        try {
          setIsLoading(true);
          setError(null);
          
          const data = await authAPI.login(values.email, values.password);

          if (data.success) {
            const userEmail = data.data?.email || values.email;
            login(userEmail);
            
            toast.success(`🎉 ${data.message || "Login successful!"}`, {
              position: "top-center",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
            });
            
            // Redirect after short delay
            setTimeout(() => {
              navigate("/predict");
            }, 1000);
          } else {
            setError(data.message || "Login failed");
            toast.error(data.message || "Login failed. Please check your credentials.", {
              position: "top-center",
              autoClose: 4000,
            });
          }
        } catch (error) {
          console.error("Error during login:", error);
          const errorMessage = error.message || "An error occurred during login";
          setError(errorMessage);
          toast.error(errorMessage, {
            position: "top-center",
            autoClose: 4000,
          });
        } finally {
          setIsLoading(false);
        }
      },
    });

  return (
    <div className="relative flex flex-col justify-center items-center w-full md:h-[500px] bg-lightBackground font-text h-[700px] mt-20 md:mt-0">
      <div className="rounded-2xl shadow-xl shadow-gray-300 mx-10 bg-white border-2 border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-btn2 to-sky-500 p-8">
          <h1 className="font-extrabold capitalize text-4xl justify-center items-center flex text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-white/90 font-medium text-center px-4">
            Welcome back to your health hub, where your well-being is our priority!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex flex-col justify-center space-y-5">
            {/* Email Input */}
            <div className="flex flex-col group">
              <label htmlFor="email" className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FaEnvelope className="text-btn2" />
                Email Address
              </label>
              <div className="relative">
                <input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-transparent shadow-sm shadow-gray-300 rounded-xl font-medium px-6 py-3.5 focus:outline-none focus:ring-4 focus:ring-btn2/20 focus:border-btn2 border-2 border-gray-200 transition-all group-hover:border-gray-300"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                />
              </div>
              {errors.email && touched.email ? (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1 font-medium">
                  <span className="text-red-600">⚠️</span> {errors.email}
                </p>
              ) : null}
            </div>

            {/* Password Input */}
            <div className="flex flex-col group">
              <label htmlFor="password" className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FaLock className="text-btn2" />
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full bg-transparent shadow-sm shadow-gray-300 rounded-xl font-medium px-6 py-3.5 focus:outline-none focus:ring-4 focus:ring-btn2/20 focus:border-btn2 border-2 border-gray-200 transition-all group-hover:border-gray-300"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                />
              </div>
              {errors.password && touched.password ? (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1 font-medium">
                  <span className="text-red-600">⚠️</span> {errors.password}
                </p>
              ) : null}
            </div>

            {/* General Error Message */}
            {error && !errors.email && !errors.password && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 font-medium text-center">
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end mt-3">
            <Link to="/forgot-password" className="text-sm text-btn2 hover:text-sky-600 font-semibold transition-colors">
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full capitalize bg-gradient-to-r from-btn2 to-sky-500 font-bold text-white px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                isLoading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:from-sky-500 hover:to-btn2 hover:scale-105 transform"
              }`}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin text-xl" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="flex justify-center text-gray-600 mt-6 pt-6 border-t-2 border-gray-100">
            <p className="text-sm font-medium">
              New user?
              <Link to="/signup">
                <span className="ml-2 capitalize text-btn2 font-bold hover:text-sky-600 transition-colors">
                  Sign up
                </span>
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
