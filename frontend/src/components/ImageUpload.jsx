import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { uploadApi } from '../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function ImageUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  // Clean up object URL when component unmounts or previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (file) => {
    setError(null);
    setSuccessData(null);
    setUploadProgress(0);

    if (!file) return;

    // MIME type validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, JPEG, PNG, and WEBP images are allowed.');
      return;
    }

    // Size validation (Max 5MB)
    if (file.size > MAX_FILE_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`File size is ${sizeInMB}MB. Maximum allowed size is 5MB.`);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setTitle('');
    setDescription('');
    setError(null);
    setSuccessData(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an image to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessData(null);
    setUploadProgress(0);

    try {
      const response = await uploadApi.upload(
        selectedFile,
        { title, description },
        (progress) => setUploadProgress(progress)
      );

      setSuccessData(response);
      handleClear();
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }
    } catch (err) {
      console.error('Upload Error:', err);
      let serverMessage = err.response?.data?.message || err.message || 'Image upload failed';
      if (err.message === 'Network Error' || !err.response) {
        serverMessage = 'Network Error: Cannot reach the backend API. Please make sure the backend server is running on http://localhost:5000 (run: "npm run dev" in the backend folder).';
      }
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Upload Image</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          JPG, JPEG, PNG or WEBP — Maximum 5MB
        </p>
      </div>

      {/* Success Banner */}
      {successData && (
        <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>
              Image uploaded successfully to Cloudinary and saved to database.
            </span>
          </div>
          <button
            onClick={() => setSuccessData(null)}
            className="text-green-600 hover:text-green-800 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleInputChange}
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">
              Click to select or drag and drop image here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports JPG, JPEG, PNG, WEBP up to 5MB
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/40 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Image Preview */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded border border-gray-200 bg-white overflow-hidden flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="Selected Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* File Info & Inputs */}
              <div className="flex-1 w-full space-y-2.5">
                <div className="text-xs text-gray-600 space-y-0.5">
                  <p>
                    <span className="font-medium text-gray-800">File:</span>{' '}
                    {selectedFile?.name}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Size:</span>{' '}
                    {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Image title (optional)"
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Upload Progress Bar (Only shown during active upload) */}
            {loading && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Uploading to Cloudinary...</span>
                  <span className="font-medium text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-150 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                className="px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload Image</span>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
