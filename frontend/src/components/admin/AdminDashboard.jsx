import React, { useEffect, useState } from 'react';
import {
  Users,
  Image as ImageIcon,
  HardDrive,
  Calendar,
  ShieldCheck,
  UserCheck,
  UserX,
  ExternalLink,
  RefreshCw,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminDashboard({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [recentImages, setRecentImages] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getStats();
      if (data.success) {
        setStats(data.stats);
        setRecentImages(data.recentImages || []);
        setRecentUsers(data.recentUsers || []);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs text-gray-500">Loading dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-xs text-gray-500">
            System overview and Cloudinary storage health.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>Total Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {stats?.totalUsers ?? 0}
            </span>
            <span className="text-[11px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
              {stats?.activeUsers ?? 0} Active
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>Total Images</span>
            <ImageIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {stats?.totalImages ?? 0}
            </span>
            <span className="text-[11px] text-gray-500">Synced to DB</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>Total Storage</span>
            <HardDrive className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {stats?.totalStorage ?? '0 MB'}
            </span>
            <span className="text-[11px] text-gray-500">Cloudinary</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs">
            <span>Today's Uploads</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-gray-900">
              {stats?.imagesToday ?? 0}
            </span>
            <span className="text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              Last 24h
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Uploads & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Media Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-900">Recent Uploads</h3>
            <button
              onClick={() => onNavigateTab('images')}
              className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentImages.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No recent uploads</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentImages.map((img) => (
                <div key={img._id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={img.imageUrl}
                      alt={img.title}
                      className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {img.title || 'Image'}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {img.uploadedBy ? img.uploadedBy.name || img.uploadedBy.email : 'Guest'}
                        {' • '}
                        {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : 'Today'}
                      </p>
                    </div>
                  </div>
                  <a
                    href={img.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-gray-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registered Users */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-900">Registered Users</h3>
            <button
              onClick={() => onNavigateTab('users')}
              className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
            >
              <span>Manage Users</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentUsers.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No users registered yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentUsers.map((u) => (
                <div key={u._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs font-medium text-gray-900">{u.name}</p>
                      {u.role === 'admin' ? (
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-medium px-1 rounded border border-blue-200">
                          Admin
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded">
                          User
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">{u.email}</p>
                  </div>
                  <div>
                    {u.isBlocked ? (
                      <span className="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
