import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, AlertCircle, Cloud, CheckCircle2, ShieldCheck } from 'lucide-react';
import { authApi } from '../../services/api';

export default function ResetPassword({ email, resetToken, onNavigateToLogin, onResetSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.resetPassword(email, resetToken, newPassword, confirmPassword);
      if (response.success) {
        if (onResetSuccess) {
          onResetSuccess(response.message || 'Password reset successful! You can now log in with your new password.');
        }
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
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
          Create New Password
        </h1>
        <p className="text-xs text-gray-500 mt-0.5 max-w-xs mx-auto">
          Please enter a secure new password for <span className="font-semibold text-gray-800">{email}</span>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className="w-full bg-gray-50 border border-gray-300 rounded pl-9 pr-10 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 6 && (
              <p className="text-[11px] text-amber-600 mt-1">
                Must be at least 6 characters (currently {newPassword.length})
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full bg-gray-50 border border-gray-300 rounded pl-9 pr-10 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-[11px] text-green-600 mt-1 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Passwords match</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
            className="w-full py-2.5 rounded text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-sm mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating password...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Reset Password & Save</span>
              </>
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
            <span>Cancel and return to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
