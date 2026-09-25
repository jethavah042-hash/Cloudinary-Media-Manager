const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  changeUserRole,
  deleteUser,
  getAllImages,
  getImageById,
  deleteImageAsAdmin,
  getAnalytics,
  getSettings,
  updateSettings
} = require('../controllers/adminController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Protect all admin routes with authentication and admin role check
router.use(protect, adminOnly);

// Dashboard Statistics & Analytics
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// User Management Routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/unblock', unblockUser);
router.put('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);

// Image Management Routes
router.get('/images', getAllImages);
router.get('/images/:id', getImageById);
router.delete('/images/:id', deleteImageAsAdmin);

// Settings Routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
