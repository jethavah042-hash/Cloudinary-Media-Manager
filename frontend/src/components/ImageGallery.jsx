import React, { useState, useRef } from 'react';
import {
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { uploadApi } from '../services/api';

export default function ImageGallery({
  images,
  loading,
  onRefresh,
  onDeleted,
  onUpdated
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [replaceModalItem, setReplaceModalItem] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replacePreview, setReplacePreview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const replaceFileInputRef = useRef(null);

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open replace modal for an item
  const openReplaceModal = (item) => {
    setReplaceModalItem(item);
    setReplaceFile(null);
    setReplacePreview(null);
    setActionError(null);
  };

  // Close replace modal and clean up preview URL
  const closeReplaceModal = () => {
    if (replacePreview) {
      URL.revokeObjectURL(replacePreview);
    }
    setReplaceModalItem(null);
    setReplaceFile(null);
    setReplacePreview(null);
    setActionError(null);
  };

  // Handle file chosen in replace modal
  const handleReplaceFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setActionError('Only JPG, JPEG, PNG, and WEBP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setActionError('Replacement file size cannot exceed 5MB.');
      return;
    }

    if (replacePreview) {
      URL.revokeObjectURL(replacePreview);
    }

    setActionError(null);
    setReplaceFile(file);
    setReplacePreview(URL.createObjectURL(file));
  };

  // Submit image replacement
  const handleConfirmReplace = async () => {
    if (!replaceFile || !replaceModalItem) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const response = await uploadApi.replace(replaceModalItem._id, replaceFile);
      if (onUpdated) {
        onUpdated(response.image);
      }
      closeReplaceModal();
    } catch (err) {
      console.error('Replace error:', err);
      let msg = err.response?.data?.message || err.message || 'Failed to replace image';
      if (err.message === 'Network Error' || !err.response) {
        msg = 'Network Error: Cannot connect to backend on http://localhost:5000.';
      }
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm and execute deletion
  const handleConfirmDelete = async () => {
    if (!deleteModalItem) return;

    setActionLoading(true);
    setActionError(null);

    try {
      await uploadApi.delete(deleteModalItem._id || deleteModalItem.cloudinaryPublicId);
      if (onDeleted) {
        onDeleted(deleteModalItem._id);
      }
      setDeleteModalItem(null);
    } catch (err) {
      console.error('Delete error:', err);
      let msg = err.response?.data?.message || err.message || 'Failed to delete image';
      if (err.message === 'Network Error' || !err.response) {
        msg = 'Network Error: Cannot connect to backend on http://localhost:5000.';
      }
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Gallery Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Your Images</h2>
          <p className="text-xs text-gray-500">
            {images.length} {images.length === 1 ? 'image' : 'images'} stored
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading || actionLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Error Notice if any */}
      {actionError && !replaceModalItem && !deleteModalItem && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse space-y-3"
            >
              <div className="w-full h-40 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : images.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700">No images uploaded yet.</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload your first image to get started.
          </p>
        </div>
      ) : (
        /* Image Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((item) => (
            <div
              key={item._id || item.cloudinaryPublicId}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video bg-gray-100 border-b border-gray-200 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title || 'Image'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <a
                  href={item.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded shadow-sm border border-gray-200 transition-colors"
                  title="Open original image"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Image Details */}
              <div className="p-3.5 space-y-2 flex-1">
                <h3
                  className="text-xs font-semibold text-gray-900 truncate"
                  title={item.title}
                >
                  {item.title || 'Untitled Image'}
                </h3>

                <div className="text-[11px] text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Format:</span>
                    <span className="font-medium text-gray-700 uppercase">
                      {item.format?.split('/')[1] || item.format || 'IMG'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span className="font-medium text-gray-700">
                      {item.size ? `${(item.size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="text-gray-700">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : 'Today'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-3 pb-3 pt-1 flex items-center justify-between gap-1.5 border-t border-gray-100">
                <button
                  onClick={() => handleCopyUrl(item.imageUrl, item._id)}
                  className="flex-1 flex items-center justify-center space-x-1 py-1 px-2 rounded text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                  title="Copy direct Cloudinary URL"
                >
                  {copiedId === item._id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-700 text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-[11px]">Copy URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => openReplaceModal(item)}
                  className="py-1 px-2 rounded text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                  title="Replace with another image"
                >
                  <span className="text-[11px]">Replace</span>
                </button>

                <button
                  onClick={() => setDeleteModalItem(item)}
                  className="p-1 rounded text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                  title="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-sm w-full shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Delete Image?</h3>
              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                Are you sure you want to delete this image? This will permanently remove it from Cloudinary and delete its record.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Image Modal */}
      {replaceModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-sm w-full shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Replace Image</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Select a new image file (JPG, PNG, WEBP — Max 5MB).
              </p>
            </div>

            {actionError && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                {actionError}
              </div>
            )}

            {/* Hidden Input */}
            <input
              ref={replaceFileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleReplaceFileChange}
              className="hidden"
            />

            {!replacePreview ? (
              <div
                onClick={() => replaceFileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-4 text-center cursor-pointer bg-gray-50"
              >
                <p className="text-xs font-medium text-gray-700">
                  Click to select replacement image
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Max 5MB file
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded p-3 bg-gray-50 flex items-center gap-3">
                <img
                  src={replacePreview}
                  alt="New preview"
                  className="w-14 h-14 object-cover rounded border border-gray-200"
                />
                <div className="flex-1 min-w-0 text-xs text-gray-600">
                  <p className="font-medium text-gray-800 truncate">
                    {replaceFile?.name}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {(replaceFile?.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="text-blue-600 hover:underline text-[11px] mt-0.5"
                  >
                    Change file
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={closeReplaceModal}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReplace}
                disabled={!replaceFile || actionLoading}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Replacing...</span>
                  </>
                ) : (
                  <span>Replace Image</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
