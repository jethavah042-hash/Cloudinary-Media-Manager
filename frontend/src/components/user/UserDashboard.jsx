import React, { useState, useEffect } from 'react';
import Navbar from '../Navbar';
import ImageUpload from '../ImageUpload';
import ImageGallery from '../ImageGallery';
import { uploadApi } from '../../services/api';
import { Image, Calendar, HardDrive, Sparkles } from 'lucide-react';

export default function UserDashboard({ user, onLogout, onNavigateToAdmin }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const data = await uploadApi.getAll();
      if (data.success && Array.isArray(data.images)) {
        setImages(data.images);
      }
    } catch (err) {
      console.error('Failed to load user images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newImageData) => {
    if (newImageData.image) {
      setImages((prev) => [newImageData.image, ...prev]);
    } else {
      fetchImages();
    }
  };

  const handleImageDeleted = (deletedId) => {
    setImages((prev) => prev.filter((img) => img._id !== deletedId));
  };

  const handleImageUpdated = (updatedImage) => {
    setImages((prev) =>
      prev.map((img) => (img._id === updatedImage._id ? updatedImage : img))
    );
  };

  // Metrics for current authenticated user
  const totalImages = images.length;
  
  const todayStr = new Date().toDateString();
  const uploadedToday = images.filter(
    (img) => img.createdAt && new Date(img.createdAt).toDateString() === todayStr
  ).length;

  const totalBytes = images.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const storageFormatted =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(totalBytes / 1024).toFixed(1)} KB`;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-800 flex flex-col font-['Inter',sans-serif]">
      {/* Navbar */}
      <Navbar
        user={user}
        onLogout={onLogout}
        onOpenAdmin={onNavigateToAdmin}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
              <span>Welcome, {user?.name || 'User'}</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200 capitalize">
                {user?.role || 'user'}
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload, replace, delete, and manage your personal cloud media assets.
            </p>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded self-start sm:self-auto font-mono text-[11px]">
            {user?.email}
          </div>
        </div>

        {/* 3 Summary Statistic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center space-x-3 shadow-sm">
            <div className="p-2 rounded bg-blue-50 text-blue-600">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Your Images</p>
              <p className="text-base font-semibold text-gray-900">{totalImages}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center space-x-3 shadow-sm">
            <div className="p-2 rounded bg-gray-100 text-gray-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Uploaded Today</p>
              <p className="text-base font-semibold text-gray-900">{uploadedToday}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center space-x-3 shadow-sm">
            <div className="p-2 rounded bg-gray-100 text-gray-600">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Storage Used</p>
              <p className="text-base font-semibold text-gray-900">{storageFormatted}</p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <section>
          <ImageUpload onUploadSuccess={handleUploadSuccess} />
        </section>

        {/* User's Gallery Section */}
        <section>
          <ImageGallery
            images={images}
            loading={loading}
            onRefresh={fetchImages}
            onDeleted={handleImageDeleted}
            onUpdated={handleImageUpdated}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-500 bg-white">
        <p>Cloudinary Media Manager &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
