import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, AlertCircle, Cloud, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../services/api';

export default function ForgotPassword({ onNavigateToLogin, onOtpSent }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      if (response.success) {
        setSuccessMsg(response.message || 'OTP sent successfully!');
        setTimeout(() => {
          if (onOtpSent) {
            onOtpSent(email.toLowerCase().trim());
          }
        }, 800);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
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
          Forgot Password
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 max-w-xs mx-auto">
          Enter your registered email address and we will send you a 6-digit OTP code to reset your password.
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

        {/* Success Notification */}
        {successMsg && (
          <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Registered Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-300 rounded pl-9 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending OTP code...</span>
              </>
            ) : (
              <span>Send OTP Verification Code</span>
            )}
          </button>
        </form>

        {/* Footer Back Link */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center text-xs">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
