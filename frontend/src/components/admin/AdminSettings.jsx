import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  FileCheck
} from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminSettings() {
  const [projectName, setProjectName] = useState('Cloudinary Media Manager');
  const [maxUploadSizeMB, setMaxUploadSizeMB] = useState(5);
  const [allowedFormats, setAllowedFormats] = useState(['jpg', 'jpeg', 'png', 'webp']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const formatOptions = ['jpg', 'jpeg', 'png', 'webp'];

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getSettings();
      if (data.success && data.settings) {
        setProjectName(data.settings.projectName || 'Cloudinary Media Manager');
        setMaxUploadSizeMB(data.settings.maxUploadSizeMB || 5);
        if (Array.isArray(data.settings.allowedFormats)) {
          setAllowedFormats(data.settings.allowedFormats);
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.response?.data?.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleFormatToggle = (format) => {
    if (allowedFormats.includes(format)) {
      if (allowedFormats.length === 1) return; // keep at least one format
      setAllowedFormats(allowedFormats.filter((f) => f !== format));
    } else {
      setAllowedFormats([...allowedFormats, format]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await adminApi.updateSettings({
        projectName,
        maxUploadSizeMB: Number(maxUploadSizeMB),
        allowedFormats
      });
      setSuccess(res.message || 'System settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Save settings error:', err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs text-gray-500">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">System Settings</h2>
        <p className="text-xs text-gray-500">
          Configure application parameters stored in MongoDB.
        </p>
      </div>

      {success && (
        <div className="p-3 rounded bg-green-50 border border-green-200 text-green-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-5">
        {/* Project Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Project Application Name
          </label>
          <input
            type="text"
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[11px] text-gray-400">Displayed in navbar and headers.</p>
        </div>

        {/* Max Upload Size */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-800">
            Maximum Upload Size Limit (MB)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="1"
              max="50"
              required
              value={maxUploadSizeMB}
              onChange={(e) => setMaxUploadSizeMB(e.target.value)}
              className="w-32 bg-gray-50 border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500 font-mono"
            />
            <span className="text-xs text-gray-500">Megabytes (MB)</span>
          </div>
          <p className="text-[11px] text-gray-400">
            Default: 5 MB. Files exceeding this size will be rejected.
          </p>
        </div>

        {/* Allowed Formats */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-800">
            Allowed Media MIME Formats
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {formatOptions.map((fmt) => {
              const isChecked = allowedFormats.includes(fmt);
              return (
                <label
                  key={fmt}
                  className={`flex items-center space-x-2 p-2.5 rounded border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleFormatToggle(fmt)}
                    className="rounded text-blue-600"
                  />
                  <span className="uppercase">{fmt}</span>
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400">
            Multer validation accepts selected image extensions.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-2 rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
