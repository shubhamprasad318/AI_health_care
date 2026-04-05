import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaShieldHalved, FaCheck, FaXmark, FaKey, FaCopy } from "react-icons/fa6";
import { authAPI } from "../utils/api";

export default function TwoFactorSettings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("status");
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState(["", "", "", "", "", ""]);
  const [disableCode, setDisableCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const codeRefs = useRef([]);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await authAPI.get2FAStatus();
      if (res.success) setStatus(res.data);
    } catch {
      toast.error("Failed to load 2FA status");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      setSubmitting(true);
      const res = await authAPI.setup2FA();
      if (res.success) {
        setSetupData(res.data);
        setStep("setup");
      }
    } catch (err) {
      toast.error(err.message || "Failed to start 2FA setup");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verifyCode];
    newCode[index] = value.slice(-1);
    setVerifyCode(newCode);
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !verifyCode[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...verifyCode];
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
    setVerifyCode(newCode);
  };

  const handleVerifySetup = async () => {
    const code = verifyCode.join("");
    if (code.length !== 6) { toast.error("Enter all 6 digits"); return; }

    try {
      setSubmitting(true);
      const res = await authAPI.verifySetup2FA(code);
      if (res.success) {
        setRecoveryCodes(res.data.recovery_codes);
        setStep("recovery");
        toast.success("2FA enabled successfully!");
        fetchStatus();
      }
    } catch (err) {
      toast.error(err.message || "Invalid code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode || disableCode.length !== 6) { toast.error("Enter 6-digit code"); return; }

    try {
      setSubmitting(true);
      const res = await authAPI.disable2FA(disableCode);
      if (res.success) {
        toast.success("2FA disabled");
        setStep("status");
        setDisableCode("");
        fetchStatus();
      }
    } catch (err) {
      toast.error(err.message || "Failed to disable 2FA");
    } finally {
      setSubmitting(false);
    }
  };

  const copyRecoveryCodes = () => {
    if (recoveryCodes) {
      navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast.success("Recovery codes copied!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-24 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-btn2 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-2xl mb-4 shadow-lg">
            <FaShieldHalved />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Two-Factor Authentication</h1>
          <p className="text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
        </motion.div>

        {step === "status" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${status?.enabled ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                {status?.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            {status?.enabled ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recovery codes remaining: <span className="font-bold text-btn2">{status.recovery_codes_remaining}</span></p>
                <button
                  onClick={() => setStep("disable")}
                  className="w-full mt-4 py-3 rounded-xl font-bold text-red-600 border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <FaXmark /> Disable 2FA
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Protect your account with TOTP-based two-factor authentication. You&apos;ll need an authenticator app like Google Authenticator or Authy.</p>
                <button
                  onClick={handleSetup}
                  disabled={submitting}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <FaShieldHalved />}
                  Enable 2FA
                </button>
              </>
            )}
          </motion.div>
        )}

        {step === "setup" && setupData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Scan QR Code</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Scan this QR code with your authenticator app, then enter the 6-digit code below.</p>

            <div className="flex justify-center mb-4">
              <img src={setupData.qr_code} alt="2FA QR Code" className="rounded-xl border-2 border-gray-200 dark:border-gray-600" />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Manual entry key:</p>
              <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 select-all">{setupData.secret}</p>
            </div>

            <div className="flex justify-center gap-2 mb-6" onPaste={handleCodePaste}>
              {verifyCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (codeRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-btn2 focus:ring-4 focus:ring-btn2/20 outline-none transition-all bg-white dark:bg-gray-700 dark:text-gray-100"
                />
              ))}
            </div>

            <button
              onClick={handleVerifySetup}
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <FaCheck />}
              Verify & Enable
            </button>

            <button onClick={() => { setStep("status"); setVerifyCode(["", "", "", "", "", ""]); }} className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 font-medium">
              Cancel
            </button>
          </motion.div>
        )}

        {step === "recovery" && recoveryCodes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-4">
              <FaKey className="text-3xl text-amber-500 mx-auto mb-2" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Save Recovery Codes</h2>
              <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">Save these codes in a safe place. Each code can only be used once.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, i) => (
                <div key={i} className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 text-center py-1 bg-white dark:bg-gray-600 rounded-lg">{code}</div>
              ))}
            </div>

            <button onClick={copyRecoveryCodes} className="w-full py-2 rounded-xl font-semibold text-btn2 border-2 border-btn2/30 hover:bg-btn2/10 transition-all flex items-center justify-center gap-2 mb-4">
              <FaCopy /> Copy All Codes
            </button>

            <button
              onClick={() => { setStep("status"); setRecoveryCodes(null); }}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-md"
            >
              I've Saved My Codes
            </button>
          </motion.div>
        )}

        {step === "disable" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Disable 2FA</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Enter a code from your authenticator app to confirm.</p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit code"
              className="w-full text-center text-xl font-mono border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 mb-4 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
            />

            <button
              onClick={handleDisable}
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-rose-500 hover:to-red-500 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <FaXmark />}
              Confirm Disable
            </button>

            <button onClick={() => { setStep("status"); setDisableCode(""); }} className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 font-medium">
              Cancel
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
