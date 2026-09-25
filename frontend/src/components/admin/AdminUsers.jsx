import React, { useState, useEffect } from 'react';
import {
  Search,
  UserCheck,
  UserX,
  Trash2,
  Shield,
  ShieldAlert,
  Eye,
  RefreshCw,
  Loader2,
  AlertTriangle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminUsers({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Action States
  const [viewUserModal, setViewUserModal] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await adminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setActionError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Toggle block/unblock status
  const handleToggleBlock = async (user) => {
    setActionLoading(true);
    setActionError(null);
    try {
      let res;
      if (user.isBlocked) {
        res = await adminApi.unblockUser(user._id);
      } else {
        res = await adminApi.blockUser(user._id);
      }
      setActionSuccess(res.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isBlocked: !user.isBlocked } : u))
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update user block status');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle user role (user <-> admin)
  const handleToggleRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminApi.changeRole(user._id, nextRole);
      setActionSuccess(res.message);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: nextRole } : u))
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User and all their Cloudinary assets
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await adminApi.deleteUser(deleteModalUser._id);
      setActionSuccess(res.message);
      setUsers((prev) => prev.filter((u) => u._id !== deleteModalUser._id));
      setDeleteModalUser(null);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  // Open view user details
  const handleOpenView = async (user) => {
    try {
      const res = await adminApi.getUserById(user._id);
      if (res.success) {
        setViewUserModal(res);
      }
    } catch (err) {
      setActionError('Failed to fetch user full details');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">User Management</h2>
          <p className="text-xs text-gray-500">
            View, filter, manage roles, block or delete users.
          </p>
        </div>
        <button
          onClick={fetchUsers}
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
      <div className="bg-white border border-gray-200 rounded-lg p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-300 rounded px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>

          {(search || roleFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('');
                setStatusFilter('');
              }}
              className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Uploads</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-gray-400">
                    No users match the search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUserId === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-[11px] text-gray-500">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            <Shield className="w-3 h-3 text-blue-600" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            User
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.isBlocked ? (
                          <span className="text-[11px] font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            Blocked
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {u.imageCount ?? 0}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* View button */}
                          <button
                            onClick={() => handleOpenView(u)}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded"
                            title="View User Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Block/Unblock button */}
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleBlock(u)}
                              className={`p-1 rounded ${
                                u.isBlocked
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-amber-600 hover:bg-amber-50'
                              }`}
                              title={u.isBlocked ? 'Unblock user' : 'Block user'}
                            >
                              {u.isBlocked ? (
                                <UserCheck className="w-3.5 h-3.5" />
                              ) : (
                                <UserX className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Toggle Role */}
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleRole(u)}
                              className="px-2 py-0.5 text-[10px] font-medium rounded border border-gray-300 hover:bg-gray-100 text-gray-700"
                              title="Toggle User/Admin Role"
                            >
                              {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                            </button>
                          )}

                          {/* Delete Button */}
                          {!isSelf && (
                            <button
                              onClick={() => setDeleteModalUser(u)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-sm w-full shadow-lg space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-gray-900">Delete User Account</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900">{deleteModalUser.email}</strong>?
              This will permanently delete their account and <strong>destroy all their images in Cloudinary</strong>.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
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
                  <span>Delete User</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {viewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-lg w-full shadow-lg space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">User Profile</h3>
                <p className="text-xs text-gray-500">{viewUserModal.user.email}</p>
              </div>
              <button
                onClick={() => setViewUserModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-400 block text-[10px]">Name</span>
                <span className="font-semibold text-gray-900">{viewUserModal.user.name}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-400 block text-[10px]">Role</span>
                <span className="font-semibold text-gray-900 capitalize">{viewUserModal.user.role}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-400 block text-[10px]">Account Status</span>
                <span className={viewUserModal.user.isBlocked ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                  {viewUserModal.user.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-400 block text-[10px]">Total Uploaded Media</span>
                <span className="font-semibold text-gray-900">{viewUserModal.totalImages} images</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-gray-800">Uploaded Images</h4>
              {viewUserModal.images.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No images uploaded by this user.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {viewUserModal.images.map((img) => (
                    <div key={img._id} className="border border-gray-200 rounded overflow-hidden">
                      <img src={img.imageUrl} alt={img.title} className="w-full h-16 object-cover" />
                      <p className="p-1 text-[10px] text-gray-600 truncate">{img.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 text-right">
              <button
                onClick={() => setViewUserModal(null)}
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
