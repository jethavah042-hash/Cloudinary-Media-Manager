import React from 'react';
import { Cloud, LogOut, LogIn, User, ShieldCheck } from 'lucide-react';

export default function Navbar({ user, onOpenAuth, onLogout, onOpenAdmin }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Simple Project Title & Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
            <Cloud className="w-4 h-4" />
          </div>
          <span className="font-semibold text-gray-900 text-sm sm:text-base tracking-tight">
            Cloudinary Media Manager
          </span>
        </div>

        {/* Right: Auth Information & Admin Link */}
        <div className="flex items-center space-x-2.5">
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Admin Panel button if user is an admin */}
              {user.role === 'admin' && (
                <button
                  onClick={onOpenAdmin}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded border border-blue-200 transition-colors"
                  title="Open Admin Dashboard"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Admin Panel</span>
                </button>
              )}

              <div className="flex items-center space-x-1.5 text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                <User className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-medium max-w-[120px] sm:max-w-[160px] truncate">
                  {user.name || user.email}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center space-x-1 text-xs text-gray-600 hover:text-red-600 hover:bg-gray-100 px-2.5 py-1 rounded border border-gray-200 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-blue-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded border border-gray-300 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
