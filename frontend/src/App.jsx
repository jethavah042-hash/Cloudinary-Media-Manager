import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ImageUpload from './components/ImageUpload';
import ImageGallery from './components/ImageGallery';
import AuthModal from './components/AuthModal';
import { uploadApi, authApi } from './services/api';
import { Image, Calendar, HardDrive } from 'lucide-react';

export default function App() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const savedUser = authApi.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
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
      console.error('Failed to load images:', err);
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

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
  };

  // Metrics calculation
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
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page Title & Subtitle */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Media Manager
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload and manage your images.
          </p>
        </div>

        {/* Small Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center space-x-3 shadow-sm">
            <div className="p-2 rounded bg-blue-50 text-blue-600">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Images</p>
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
              <p className="text-xs text-gray-500">Storage / Files</p>
              <p className="text-base font-semibold text-gray-900">{storageFormatted}</p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <section>
          <ImageUpload onUploadSuccess={handleUploadSuccess} />
        </section>

        {/* Gallery Section */}
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

      {/* Simple Footer */}
      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-500 bg-white">
        <p>Cloudinary Media Manager &copy; {new Date().getFullYear()}</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(loggedInUser) => setUser(loggedInUser)}
      />
    </div>
  );
}
