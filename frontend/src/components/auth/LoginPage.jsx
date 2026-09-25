import React, { useState } from 'react';
import {
  User,
  Shield,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { authApi } from '../../services/api';

export default function LoginPage({ onLoginSuccess, onNavigateToRegister, initialMessage }) {
  const [loginType, setLoginType] = useState('user'); // 'user' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(initialMessage || null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await authApi.login(email, password, loginType);
      if (response.success && response.user) {
        onLoginSuccess(response.user);
      }
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setLoginType('admin');
    setEmail('cloudinary@gmail.com');
    setPassword('Cloudinary@123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center items-center px-4 py-12 font-['Inter',sans-serif]">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white mx-auto mb-2.5 shadow-sm">
          <Cloud className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Cloudinary Media Manager
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Sign in to access your media dashboard
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white border border-gray-200 rounded-lg max-w-md w-full p-6 shadow-sm">
        {/* User / Admin Login Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-lg mb-5">
          <button
            type="button"
            onClick={() => {
              setLoginType('user');
              setError(null);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 rounded text-xs font-medium transition-colors ${
              loginType === 'user'
                ? 'bg-white text-gray-900 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>User Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType('admin');
              setError(null);
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 rounded text-xs font-medium transition-colors ${
              loginType === 'admin'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Success Banner (e.g. from registration redirect) */}
        {successMsg && (
          <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {loginType === 'admin' ? 'Admin Email Address' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginType === 'admin' ? 'admin@gmail.com' : 'user@example.com'}
                className="w-full bg-gray-50 border border-gray-300 rounded pl-9 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {loginType === 'admin' ? 'Admin Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                <span>Verifying credentials...</span>
              </>
            ) : (
              <span>{loginType === 'admin' ? 'Sign In to Admin Panel' : 'Sign In to Dashboard'}</span>
            )}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          {loginType === 'admin' ? (
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="text-blue-600 hover:underline font-medium flex items-center space-x-1"
            >
              <Shield className="w-3 h-3" />
              <span>Fill Admin Demo</span>
            </button>
          ) : (
            <div className="text-gray-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-blue-600 hover:underline font-medium"
              >
                Register here
              </button>
            </div>
          )}

          {loginType === 'admin' && (
            <button
              type="button"
              onClick={() => {
                setLoginType('user');
                setError(null);
              }}
              className="text-gray-500 hover:text-gray-800"
            >
              Switch to User Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
