import React, { useState, useEffect } from 'react';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import UserDashboard from './components/user/UserDashboard';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminImages from './components/admin/AdminImages';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminSettings from './components/admin/AdminSettings';
import { authApi } from './services/api';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/login'
  );
  const [adminTab, setAdminTab] = useState('dashboard');
  const [regSuccessMessage, setRegSuccessMessage] = useState(null);

  // Sync state with browser location and load persisted auth on mount
  useEffect(() => {
    const savedUser = authApi.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setAuthChecking(false);

    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Path navigation helper with browser history update
  const navigate = (path) => {
    setCurrentPath(path);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  // Handle successful login
  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setRegSuccessMessage(null);
    if (loggedInUser.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  // Handle successful registration
  const handleRegisterSuccess = (msg) => {
    setRegSuccessMessage(msg);
    navigate('/login');
  };

  // Handle logout
  const handleLogout = () => {
    authApi.logout();
    setUser(null);
    navigate('/login');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  // 1. Unauthenticated routes: /register and /login
  if (!user) {
    if (currentPath === '/register') {
      return (
        <RegisterPage
          onNavigateToLogin={() => navigate('/login')}
          onRegisterSuccess={handleRegisterSuccess}
        />
      );
    }

    // Default unauthenticated view is /login
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => navigate('/register')}
        initialMessage={regSuccessMessage}
      />
    );
  }

  // 2. Authenticated Admin View: /admin
  if (currentPath.startsWith('/admin')) {
    if (user.role !== 'admin') {
      return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-['Inter',sans-serif]">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-sm w-full text-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Access Denied</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Admin account required to view <span className="font-mono text-gray-700 font-medium">/admin</span>.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors shadow-sm"
            >
              Go to User Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <AdminLayout
        activeTab={adminTab}
        setActiveTab={setAdminTab}
        onExitAdmin={() => navigate('/dashboard')}
        user={user}
        onLogout={handleLogout}
      >
        {adminTab === 'dashboard' && (
          <AdminDashboard onNavigateTab={(tab) => setAdminTab(tab)} />
        )}
        {adminTab === 'users' && <AdminUsers currentUserId={user.id || user._id} />}
        {adminTab === 'images' && <AdminImages />}
        {adminTab === 'analytics' && <AdminAnalytics />}
        {adminTab === 'settings' && <AdminSettings />}
      </AdminLayout>
    );
  }

  // 3. Authenticated User View: /dashboard (Default for authenticated users)
  return (
    <UserDashboard
      user={user}
      onLogout={handleLogout}
      onNavigateToAdmin={() => navigate('/admin')}
    />
  );
}
