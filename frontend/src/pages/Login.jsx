import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { loginSchema } from "../schema";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { authAPI } from "../utils/api";
import { FaEnvelope, FaLock, FaSpinner, FaShieldHalved } from "react-icons/fa6";

function Login() {
  const initialValues = {
    email: "",
    password: "",
  };

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAEmail, setTwoFAEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const otpRefs = useRef([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otpCode];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtpCode(newOtp);
    const nextEmpty = Math.min(pasted.length, 5);
    otpRefs.current[nextEmpty]?.focus();
  };

  const handle2FAVerify = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const code = useRecovery ? recoveryCode.trim() : otpCode.join("");
      if (!useRecovery && code.length !== 6) {
        setError("Please enter all 6 digits");
        return;
      }
      if (useRecovery && !code) {
        setError("Please enter a recovery code");
        return;
      }

      const data = await authAPI.verify2FA(twoFAEmail, code, useRecovery);
      if (data.success) {
        login(data.data.user || data.data);
        toast.success("Login successful!");
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      setError(err.message || "Verification failed");
      toast.error(err.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  const { values, errors, touched, handleSubmit, handleBlur, handleChange } =
    useFormik({
      initialValues: initialValues,
      validationSchema: loginSchema,
      onSubmit: async (values) => {
        try {
          setIsLoading(true);
          setError(null);
          
          const data = await authAPI.login(values.email, values.password);

          if (data.success || data.data?.requires_2fa) {
            if (data.data?.requires_2fa) {
              setRequires2FA(true);
              setTwoFAEmail(data.data.email);
              setIsLoading(false);
              return;
            }

            login(data.data.user || data.data, data.data.access_token);
            
            toast.success(`${data.message || "Login successful!"}`, {
              position: "top-center",
              autoClose: 3000,
            });
            
            setTimeout(() => {
              navigate("/dashboard");
            }, 1000);
          } else {
            setError(data.message || "Login failed");
            toast.error(data.message || "Login failed. Please check your credentials.");
          }
        } catch (error) {
          console.error("Error during login:", error);
          const errorMessage = error.message || "An error occurred during login";
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      },
    });

  if (requires2FA) {
    return (
      <div className="relative flex flex-col justify-center items-center w-full min-h-[500px] bg-lightBackground dark:bg-gray-900 font-text mt-20 md:mt-0">
        <div className="rounded-2xl shadow-xl shadow-gray-300 dark:shadow-gray-800 mx-10 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 overflow-hidden max-w-md w-full">
          <div className="bg-gradient-to-r from-btn2 to-sky-500 p-8 text-center">
            <FaShieldHalved className="text-4xl text-white mx-auto mb-2" />
            <h1 className="font-extrabold text-2xl text-white">Two-Factor Authentication</h1>
            <p className="text-sm text-white/90 mt-1">Enter the code from your authenticator app</p>
          </div>

          <div className="p-8">
            {!useRecovery ? (
              <>
                <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                  {otpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-btn2 focus:ring-4 focus:ring-btn2/20 outline-none transition-all bg-white dark:bg-gray-700 dark:text-gray-100"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setUseRecovery(true)}
                  className="text-sm text-btn2 hover:text-sky-600 font-semibold block mx-auto mb-4"
                >
                  Use recovery code instead
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="Enter recovery code"
                  className="w-full text-center text-lg font-mono border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 mb-4 focus:border-btn2 focus:ring-4 focus:ring-btn2/20 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
                  disabled={isLoading}
                />
                <button
                  onClick={() => { setUseRecovery(false); setRecoveryCode(""); }}
                  className="text-sm text-btn2 hover:text-sky-600 font-semibold block mx-auto mb-4"
                >
                  Use authenticator code instead
                </button>
              </>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-3 mb-4">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium text-center">{error}</p>
              </div>
            )}

            <button
              onClick={handle2FAVerify}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-btn2 to-sky-500 font-bold text-white px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <><FaSpinner className="animate-spin" /> Verifying...</>
              ) : (
                "Verify"
              )}
            </button>

            <button
              onClick={() => { setRequires2FA(false); setOtpCode(["", "", "", "", "", ""]); setRecoveryCode(""); setError(null); }}
              className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-center items-center w-full md:h-[500px] bg-lightBackground dark:bg-gray-950 font-text h-[700px] mt-20 md:mt-0">
      <div className="rounded-2xl shadow-xl shadow-gray-300 dark:shadow-gray-900/50 mx-10 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300">
        <div className="bg-gradient-to-r from-btn2 to-btn1 p-8">
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
              <label htmlFor="email" className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FaEnvelope className="text-btn2" />
                Email Address
              </label>
              <div className="relative">
                <input
                  name="email"
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-transparent shadow-sm shadow-gray-300 dark:shadow-gray-700 rounded-xl font-medium px-6 py-3.5 focus:outline-none focus:ring-4 focus:ring-btn2/20 focus:border-btn2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 transition-all group-hover:border-gray-300 dark:group-hover:border-gray-500"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                />
              </div>
              {errors.email && touched.email ? (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1 font-medium">
                  <span className="text-red-600">⚠️</span> {errors.email}
                </p>
              ) : null}
            </div>

            {/* Password Input */}
            <div className="flex flex-col group">
              <label htmlFor="password" className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <FaLock className="text-btn2" />
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full bg-transparent shadow-sm shadow-gray-300 dark:shadow-gray-700 rounded-xl font-medium px-6 py-3.5 focus:outline-none focus:ring-4 focus:ring-btn2/20 focus:border-btn2 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 transition-all group-hover:border-gray-300 dark:group-hover:border-gray-500"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                />
              </div>
              {errors.password && touched.password ? (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center gap-1 font-medium">
                  <span className="text-red-600">⚠️</span> {errors.password}
                </p>
              ) : null}
            </div>

            {/* General Error Message */}
            {error && !errors.email && !errors.password && (
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium text-center">
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
              className={`w-full capitalize bg-gradient-to-r from-btn2 to-btn1 font-bold text-white px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:shadow-btn2/20 transition-all duration-300 flex items-center justify-center gap-2 ${
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
          <div className="flex justify-center text-gray-600 dark:text-gray-400 mt-6 pt-6 border-t-2 border-gray-100 dark:border-gray-700">
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
