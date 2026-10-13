import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { loginSchema } from "../schema";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { authAPI } from "../utils/api";
import { FaSpinner, FaShieldHalved } from "react-icons/fa6";
import AuthLayout, { authButtonClass, authInputClass, authLabelClass } from "../components/AuthLayout";

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
  const location = useLocation();

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
      <AuthLayout
        title="Two-factor authentication"
        subtitle="Enter the 6-digit code from your authenticator app."
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
          <FaShieldHalved />
        </div>

        {!useRecovery ? (
          <>
            <div className="mb-6 flex gap-2" onPaste={handleOtpPaste}>
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
                  className="h-14 w-12 rounded-xl border border-slate-200 bg-white text-center text-2xl font-bold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  disabled={isLoading}
                />
              ))}
            </div>
            <button
              onClick={() => setUseRecovery(true)}
              className="mb-4 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Use a recovery code instead
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
              placeholder="Enter recovery code"
              className={`${authInputClass} mb-4 text-center font-mono text-lg`}
              disabled={isLoading}
            />
            <button
              onClick={() => { setUseRecovery(false); setRecoveryCode(""); }}
              className="mb-4 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Use authenticator code instead
            </button>
          </>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <button onClick={handle2FAVerify} disabled={isLoading} className={authButtonClass}>
          {isLoading ? (
            <><FaSpinner className="animate-spin" /> Verifying...</>
          ) : (
            "Verify"
          )}
        </button>

        <button
          onClick={() => { setRequires2FA(false); setOtpCode(["", "", "", "", "", ""]); setRecoveryCode(""); setError(null); }}
          className="mt-4 w-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Back to login
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your health dashboard.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className={authLabelClass}>
            Email address
          </label>
          <input
            name="email"
            id="email"
            type="email"
            placeholder="you@example.com"
            className={authInputClass}
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
          />
          {errors.email && touched.email ? (
            <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={authLabelClass}>
              Password
            </label>
            <Link
              to="/forgot-password"
              className="mb-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>
          <input
            name="password"
            id="password"
            type="password"
            placeholder="Enter your password"
            className={authInputClass}
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
          />
          {errors.password && touched.password ? (
            <p className="mt-1.5 text-sm font-medium text-red-600 dark:text-red-400">{errors.password}</p>
          ) : null}
        </div>

        {/* General Error Message */}
        {error && !errors.email && !errors.password && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading} className={authButtonClass}>
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Log in</span>
          )}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-gray-400">
          New to AI HealthEngine?{" "}
          <Link to="/signup" state={location.state} className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;
