import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, ArrowLeft, Loader2, AlertCircle, Cloud, RotateCcw, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../services/api';

export default function VerifyOtp({ email, onNavigateToLogin, onNavigateBack, onOtpVerified }) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('OTP verification code sent to your email.');
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef([]);

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus the first input on initial mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index, value) => {
    // Only accept numeric input
    const cleanVal = value.replace(/\D/g, '');

    if (!cleanVal) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // If pasted multi-digit string
    if (cleanVal.length > 1) {
      const pasteArray = cleanVal.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasteArray.forEach((d, i) => {
        if (index + i < 6) {
          newDigits[index + i] = d;
        }
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(index + pasteArray.length, 5);
      if (inputRefs.current[nextFocus]) {
        inputRefs.current[nextFocus].focus();
      }
      return;
    }

    // Single digit input
    const singleChar = cleanVal.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleChar;
    setOtpDigits(newDigits);

    // Auto advance to next box
    if (singleChar && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);
    const nextFocus = Math.min(pastedData.length, 5);
    if (inputRefs.current[nextFocus]) {
      inputRefs.current[nextFocus].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await authApi.verifyOTP(email, fullOtp);
      if (response.success && response.resetToken) {
        if (onOtpVerified) {
          onOtpVerified(email, response.resetToken);
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;

    setError(null);
    setResendLoading(true);
    setSuccessMsg(null);

    try {
      const response = await authApi.resendOTP(email);
      if (response.success) {
        setSuccessMsg(response.message || 'A fresh OTP code has been sent to your email.');
        setCountdown(60);
        setOtpDigits(['', '', '', '', '', '']);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to resend OTP.';
      setError(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center items-center px-4 py-12 font-['Inter',sans-serif]">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white mx-auto mb-2.5 shadow-sm">
          <Cloud className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Enter Verification Code
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 max-w-xs mx-auto">
          We sent a 6-digit security code to{' '}
          <span className="font-semibold text-gray-800">{email}</span>
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-lg max-w-md w-full p-6 shadow-sm">
        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Success / Info Notification */}
        {successMsg && (
          <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 text-center mb-3">
              6-Digit OTP Code
            </label>

            <div className="flex justify-center items-center gap-2" onPaste={handlePaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-12 text-center text-lg font-bold bg-gray-50 border border-gray-300 rounded focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 transition-colors"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otpDigits.join('').length < 6}
            className="w-full py-2.5 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying code...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                <span>Verify & Continue</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Cooldown Section */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col items-center space-y-2 text-xs">
          <div className="flex items-center space-x-1 text-gray-500">
            <span>Didn't receive code?</span>
            {countdown > 0 ? (
              <span className="font-semibold text-gray-700">Resend in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-blue-600 font-semibold hover:underline flex items-center space-x-1"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend OTP</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <button
              type="button"
              onClick={onNavigateBack}
              className="text-gray-500 hover:text-gray-800 text-xs"
            >
              Change email address
            </button>
            <span className="text-gray-300">•</span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-gray-500 hover:text-gray-800 text-xs flex items-center space-x-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Login</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
