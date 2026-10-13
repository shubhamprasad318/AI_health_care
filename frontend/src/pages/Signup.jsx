import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { signupSchema } from "../schema";
import { toast } from "react-toastify";
import { authAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext"; //  ADD THIS
import { FaSpinner } from "react-icons/fa6";
import AuthLayout, { authButtonClass, authInputClass, authLabelClass } from "../components/AuthLayout";

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
  const { login } = useAuth(); // ✅ ADD THIS
  const [signup, setSignup] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ✅ ADD THIS

  const { values, errors, touched, handleBlur, handleChange, handleSubmit } =
    useFormik({
      initialValues: initialValues,
      validationSchema: signupSchema,
      onSubmit: async (values) => {
        try {
          setIsLoading(true); // ✅ ADD THIS
          
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
            // ✅ FIX: Auto-login user after signup
            login(data.data.user || data.data, data.data.access_token);
            
            toast.success(
              `🎉 ${data.message || "Registration successful!"}`,
              {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              }
            );
            
            setSignup(true);
            
            // ✅ FIX: Redirect to dashboard instead of login
            setTimeout(() => {
              navigate("/dashboard");
            }, 1000);
          } else {
            setError(data.message || "Registration failed");
            toast.error(data.message || "Registration Failed!");
          }
        } catch (error) {
          console.error("Error during signup:", error);
          setError(error.message || "An error occurred during signup");
          toast.error(error.message || "Registration Failed!");
        } finally {
          setIsLoading(false); // ✅ ADD THIS
        }
      },
    });

  // Renders one labelled formik-bound field with its validation message
  const field = (name, label, props = {}) => (
    <div>
      <label htmlFor={name} className={authLabelClass}>
        {label}
      </label>
      <input
        name={name}
        id={name}
        className={authInputClass}
        value={values[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        autoComplete="off"
        disabled={isLoading}
        {...props}
      />
      {errors[name] && touched[name] ? (
        <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors[name]}</p>
      ) : null}
    </div>
  );

  return (
    <AuthLayout
      wide
      title="Create your account"
      subtitle="Join AI HealthEngine for personalised, AI-assisted care. It's free."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("first_name", "First name", { type: "text", placeholder: "Asha" })}
          {field("last_name", "Last name", { type: "text", placeholder: "Sharma" })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field("email", "Email", { type: "email", placeholder: "you@example.com" })}
          {field("phone_number", "Phone number", { type: "number", placeholder: "10-digit mobile" })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field("age", "Age", { type: "number", placeholder: "e.g. 32" })}
          <div>
            <label htmlFor="gender" className={authLabelClass}>
              Gender
            </label>
            <select
              name="gender"
              id="gender"
              className={authInputClass}
              value={values.gender}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && touched.gender ? (
              <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.gender}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field("city", "City", { type: "text", placeholder: "Mumbai" })}
          {field("state", "State", { type: "text", placeholder: "Maharashtra" })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field("password", "Password", { type: "password", placeholder: "Create a password" })}
          {field("confirm_password", "Confirm password", { type: "password", placeholder: "Repeat password" })}
        </div>

        <button type="submit" disabled={isLoading} className={authButtonClass}>
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Signup;
