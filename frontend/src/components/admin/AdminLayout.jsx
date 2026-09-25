import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  BarChart3,
  Settings,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  LogOut
} from 'lucide-react';

export default function AdminLayout({
  activeTab,
  setActiveTab,
  onExitAdmin,
  user,
  onLogout,
  children
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-800 flex flex-col font-['Inter',sans-serif]">
      {/* Top Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-3">
          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-1.5 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
            title="Open Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-sm tracking-tight">
                Admin Panel
              </span>
              <span className="ml-2 text-[10px] bg-blue-50 text-blue-700 font-medium px-1.5 py-0.5 rounded border border-blue-200">
                Superuser
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onExitAdmin}
            className="flex items-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-blue-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded border border-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to App</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1 text-xs text-gray-600 hover:text-red-600 hover:bg-gray-100 px-2.5 py-1.5 rounded border border-gray-200 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Wrapper (Sidebar + Content) */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-56 bg-white border-r border-gray-200 p-4 space-y-1 flex-shrink-0">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Mobile Drawer Backdrop */}
        {mobileDrawerOpen && (
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
          />
        )}

        {/* Mobile Drawer Content */}
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 p-4 space-y-2 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-xs text-gray-900">Admin Menu</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={onExitAdmin}
                className="w-full flex items-center justify-center space-x-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Exit Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Content Area */}
        <main className="flex-1 p-4 sm:p-6 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
