import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  HardDrive,
  RefreshCw,
  Loader2,
  Calendar
} from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAnalytics();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs text-gray-500">Loading system analytics...</p>
      </div>
    );
  }

  const uploadsPerDay = analytics?.uploadsPerDay || [];
  const formatDistribution = analytics?.formatDistribution || [];
  const userGrowth = analytics?.userGrowth || [];

  const maxUploadCount = Math.max(...uploadsPerDay.map((d) => d.count), 5);
  const maxUserCount = Math.max(...userGrowth.map((d) => d.count), 5);

  const totalFormatUploads = formatDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">System Analytics</h2>
          <p className="text-xs text-gray-500">
            Upload traffic trends, storage distribution, and user acquisition metrics.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
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

      {/* Grid: 2 Main Visual Analytics Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uploads per Day (Bar Chart) */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-semibold text-gray-900">Uploads (Last 7 Days)</h3>
            </div>
            <span className="text-[11px] text-gray-500">Count / Day</span>
          </div>

          {uploadsPerDay.length === 0 ? (
            <p className="text-xs text-gray-400 py-12 text-center">No upload data recorded in the last 7 days.</p>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="h-44 flex items-end gap-3 px-2 border-b border-gray-200 pb-2">
                {uploadsPerDay.map((item) => {
                  const barHeight = Math.max(Math.round((item.count / maxUploadCount) * 100), 8);
                  return (
                    <div key={item._id} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] font-semibold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.count}
                      </span>
                      <div
                        className="w-full bg-blue-600 hover:bg-blue-700 rounded-t transition-all duration-300"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-[10px] text-gray-500 truncate w-full text-center">
                        {item._id.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Growth (Last 7 Days) */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="text-xs font-semibold text-gray-900">New User Registrations</h3>
            </div>
            <span className="text-[11px] text-gray-500">Registrations / Day</span>
          </div>

          {userGrowth.length === 0 ? (
            <p className="text-xs text-gray-400 py-12 text-center">No new registrations in the last 7 days.</p>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="h-44 flex items-end gap-3 px-2 border-b border-gray-200 pb-2">
                {userGrowth.map((item) => {
                  const barHeight = Math.max(Math.round((item.count / maxUserCount) * 100), 8);
                  return (
                    <div key={item._id} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] font-semibold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.count}
                      </span>
                      <div
                        className="w-full bg-green-600 hover:bg-green-700 rounded-t transition-all duration-300"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-[10px] text-gray-500 truncate w-full text-center">
                        {item._id.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Format Breakdown & Storage Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <PieChart className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-semibold text-gray-900">File Format Distribution</h3>
        </div>

        {formatDistribution.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No formats data available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {formatDistribution.map((item, idx) => {
              const formatLabel = item._id ? item._id.toUpperCase() : 'UNKNOWN';
              const percent = Math.round((item.count / totalFormatUploads) * 100);
              const mb = (item.totalBytes / (1024 * 1024)).toFixed(2);

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-2"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-800">{formatLabel}</span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>{item.count} files</span>
                    <span>{mb} MB</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
