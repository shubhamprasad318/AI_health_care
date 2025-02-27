import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { loginSchema } from "../schema";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

function Login() {
  const initialValues = {
    email: "",
    password: "",
  };

  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();


 const { values, errors, touched, handleSubmit, handleBlur, handleChange } =
    useFormik({
      initialValues: initialValues,
      validationSchema: loginSchema,
      onSubmit: async (values) => {
        try {
          const response = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
          });

          const data = await response.json();

          if (data.success) {
            // Handle successful login
            login(values.email)
            toast.success("Login successful!");
            navigate("/predict"); // Redirect to the predict page
          } else {
            setError(data.message);
            toast.error("Login failed. Please check your credentials.");
          }
        } catch (error) {
          console.error("Error during login:", error);
          setError("An error occurred during login");
          toast.error("An error occurred during login");
        }
      },
    });

    

  return (
    <div className="relative flex flex-col justify-center items-center  w-full md:h-[500px] bg-lightBackground font-text h-[700px]">
      <div className="rounded shadow-md shadow-gray-400 mx-10">
        <div className="">
          <h1 className="font-bold capitalize text-4xl justify-center items-center flex  p-7 text-lightText">
            login
          </h1>
          <p className="text-xs px-12 py-2 text-gray-700 font-semibold ">
            Welcome back to your health hub, where your well-being is our
            priority!
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col justify-center px-8">
            <input
              name="email"
              id="email"
              type="email"
              placeholder="Email"
              className="bg-transparent shadow-sm shadow-gray-400 rounded-md font-medium  px-6 py-3 mb-3 focus:outline-none"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.email && touched.email ? (
              <p className="text-sm text-red-700">{errors.email}</p>
            ) : null}

            <input
              name="password"
              id="password"
              type="password"
              placeholder="Password"
              className="bg-transparent shadow-sm shadow-gray-400 rounded-md font-medium  px-6 py-3  mb-5 focus:outline-none"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.password && touched.password ? (
              <p className="text-sm text-red-700">{errors.password}</p>
            ) : null}
          </div>

          <div className="flex justify-center text-gray-500 ">
            <p>
              New user?
              <Link to="/signup">
                <span className="p-2 capitalize text-btn1 font-semibold">
                  sign up
                </span>
              </Link>
            </p>
          </div>
          <div className="flex justify-center p-4">
            <Link>
              <button
                type="submit"
                onClick={handleSubmit}
                className="capitalize bg-btn2  font-semibold text-white px-8 py-2 rounded"
              >
                login
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
export default Login;
