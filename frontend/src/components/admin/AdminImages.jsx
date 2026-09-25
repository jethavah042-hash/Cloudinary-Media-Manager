import React, { useState, useEffect } from 'react';
import {
  Search,
  Trash2,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  X,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & Action states
  const [viewImageModal, setViewImageModal] = useState(null);
  const [deleteModalImage, setDeleteModalImage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchImages = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await adminApi.getImages({
        search: search.trim() || undefined,
        format: formatFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (data.success) {
        setImages(data.images || []);
      }
    } catch (err) {
      console.error('Failed to load images:', err);
      setActionError(err.response?.data?.message || 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [formatFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchImages();
  };

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalImage) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminApi.deleteImage(deleteModalImage._id);
      setActionSuccess('Image deleted permanently from Cloudinary & Database');
      setImages((prev) => prev.filter((img) => img._id !== deleteModalImage._id));
      setDeleteModalImage(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete image');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Image Management</h2>
          <p className="text-xs text-gray-500">
            Moderate all Cloudinary media assets across all users.
          </p>
        </div>
        <button
          onClick={fetchImages}
          disabled={loading || actionLoading}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded bg-green-50 border border-green-200 text-green-800 text-xs">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
          {actionError}
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-64 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or public_id..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Format Filter */}
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Formats</option>
            <option value="jpg">JPG / JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WEBP</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
              title="From date"
            />
            <span>-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
              title="To date"
            />
          </div>

          {(search || formatFilter || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('');
                setFormatFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Image Grid / Table */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-xs">Loading media assets...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-gray-500 space-y-1">
          <ImageIcon className="w-8 h-8 mx-auto text-gray-300 mb-1" />
          <p className="text-sm font-medium text-gray-700">No images found</p>
          <p className="text-xs text-gray-400">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img._id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100 border-b border-gray-200 overflow-hidden group">
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <button
                    onClick={() => setViewImageModal(img)}
                    className="p-1 rounded bg-white/90 hover:bg-white text-gray-700 shadow-sm border border-gray-200"
                    title="View details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={img.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-white/90 hover:bg-white text-gray-700 shadow-sm border border-gray-200"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Details */}
              <div className="p-3 space-y-1.5 flex-1 text-xs">
                <h3 className="font-semibold text-gray-900 truncate" title={img.title}>
                  {img.title || 'Untitled'}
                </h3>

                <div className="text-[11px] text-gray-500 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Uploaded by:</span>
                    <span className="font-medium text-gray-800 truncate max-w-[120px]">
                      {img.uploadedBy ? img.uploadedBy.name || img.uploadedBy.email : 'Guest'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Format / Size:</span>
                    <span className="text-gray-700">
                      {img.format?.split('/')[1] || img.format || 'IMG'} •{' '}
                      {(img.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="text-gray-700">
                      {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-3 pb-3 pt-1 flex items-center justify-between gap-1.5 border-t border-gray-100">
                <button
                  onClick={() => handleCopyUrl(img.imageUrl, img._id)}
                  className="flex-1 flex items-center justify-center space-x-1 py-1 px-2 rounded text-[11px] font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200"
                >
                  {copiedId === img._id ? (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-green-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-gray-500" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setDeleteModalImage(img)}
                  className="p-1 rounded text-red-600 hover:text-red-800 hover:bg-red-50 border border-transparent hover:border-red-200"
                  title="Delete from Cloudinary and Database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Delete Image Modal */}
      {deleteModalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-sm w-full shadow-lg space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-gray-900">Delete Image as Admin</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900">"{deleteModalImage.title}"</strong>?
              This will destroy the asset on Cloudinary and remove its record.
            </p>
            <div className="p-2 bg-gray-50 border border-gray-200 rounded font-mono text-[10px] text-gray-600 break-all">
              Public ID: {deleteModalImage.cloudinaryPublicId}
            </div>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteModalImage(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Image</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Image Modal */}
      {viewImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-md w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 truncate pr-2">
                {viewImageModal.title || 'Image Metadata'}
              </h3>
              <button
                onClick={() => setViewImageModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-gray-100 rounded overflow-hidden border border-gray-200">
              <img
                src={viewImageModal.imageUrl}
                alt={viewImageModal.title}
                className="w-full h-full object-contain bg-slate-900"
              />
            </div>

            <div className="space-y-1 text-xs text-gray-600 font-mono text-[11px] bg-gray-50 p-3 rounded border border-gray-200">
              <div><strong className="text-gray-800">Public ID:</strong> {viewImageModal.cloudinaryPublicId}</div>
              <div><strong className="text-gray-800">Size:</strong> {(viewImageModal.size / (1024 * 1024)).toFixed(2)} MB</div>
              <div><strong className="text-gray-800">Format:</strong> {viewImageModal.format}</div>
              <div><strong className="text-gray-800">Uploaded by:</strong> {viewImageModal.uploadedBy?.name || 'Guest'} ({viewImageModal.uploadedBy?.email || 'N/A'})</div>
              <div><strong className="text-gray-800">Uploaded on:</strong> {new Date(viewImageModal.createdAt).toLocaleString()}</div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <a
                href={viewImageModal.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
              >
                Open Original
              </a>
              <button
                onClick={() => setViewImageModal(null)}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
