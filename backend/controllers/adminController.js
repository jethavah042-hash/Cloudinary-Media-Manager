const User = require('../models/User');
const Image = require('../models/Image');
const Setting = require('../models/Setting');
const cloudinary = require('../config/cloudinary');

// @desc    Get dashboard summary statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isBlocked: false });
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const totalImages = await Image.countDocuments();

    // Calculate total storage
    const storageAgg = await Image.aggregate([
      {
        $group: {
          _id: null,
          totalBytes: { $sum: '$size' }
        }
      }
    ]);
    const totalBytes = storageAgg.length > 0 ? storageAgg[0].totalBytes : 0;
    const totalStorageMB = (totalBytes / (1024 * 1024)).toFixed(2);

    // Images uploaded today (since 00:00:00)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const imagesToday = await Image.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // Recent 5 uploads with populated uploader
    const recentImages = await Image.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'name email');

    // Recent 5 registered users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalImages,
        totalStorage: `${totalStorageMB} MB`,
        totalBytes,
        imagesToday,
        activeUsers,
        blockedUsers
      },
      recentImages,
      recentUsers
    });
  } catch (error) {
    console.error('[Admin Stats Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard statistics: ' + error.message
    });
  }
};

// @desc    Get all users with search & filters
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = {};

    // Search by name or email
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Role filter
    if (role && ['user', 'admin'].includes(role)) {
      query.role = role;
    }

    // Status filter (active or blocked)
    if (status === 'active') {
      query.isBlocked = false;
    } else if (status === 'blocked') {
      query.isBlocked = true;
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    // Aggregate image count per user
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const imageCount = await Image.countDocuments({ uploadedBy: u._id });
        return {
          ...u.toObject(),
          imageCount
        };
      })
    );

    res.json({
      success: true,
      count: usersWithCounts.length,
      users: usersWithCounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users: ' + error.message
    });
  }
};

// @desc    Get single user details & their images
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const images = await Image.find({ uploadedBy: user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      user,
      images,
      totalImages: images.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details: ' + error.message
    });
  }
};

// @desc    Block a user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent blocking self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block your own admin account'
      });
    }

    user.isBlocked = true;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.email} has been blocked successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to block user: ' + error.message
    });
  }
};

// @desc    Unblock a user
// @route   PUT /api/admin/users/:id/unblock
// @access  Private/Admin
const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBlocked = false;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.email} has been unblocked successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user: ' + error.message
    });
  }
};

// @desc    Change user role (user <-> admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Determine target role
    let newRole = role;
    if (!newRole) {
      newRole = user.role === 'admin' ? 'user' : 'admin';
    }

    if (!['user', 'admin'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Allowed roles: user, admin'
      });
    }

    // Prevent removing own admin role
    if (user._id.toString() === req.user._id.toString() && newRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot revoke admin privileges from your own account'
      });
    }

    user.role = newRole;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${newRole}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user role: ' + error.message
    });
  }
};

// @desc    Delete user + delete all their Cloudinary images + MongoDB records
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account'
      });
    }

    // Find all images uploaded by this user
    const userImages = await Image.find({ uploadedBy: user._id });

    // Destroy each image in Cloudinary
    let destroyedCount = 0;
    for (const img of userImages) {
      if (img.cloudinaryPublicId) {
        try {
          await cloudinary.uploader.destroy(img.cloudinaryPublicId);
          destroyedCount++;
        } catch (cErr) {
          console.warn(`[Cloudinary Warning] Failed destroying ${img.cloudinaryPublicId}:`, cErr.message);
        }
      }
    }

    // Delete image records from MongoDB
    await Image.deleteMany({ uploadedBy: user._id });

    // Delete user account
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: `User ${user.email} and ${userImages.length} associated images were permanently deleted`,
      deletedImagesCount: userImages.length,
      cloudinaryDestroyedCount: destroyedCount
    });
  } catch (error) {
    console.error('[Admin Delete User Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user: ' + error.message
    });
  }
};

// @desc    Get all images with search, format filters, and populated user
// @route   GET /api/admin/images
// @access  Private/Admin
const getAllImages = async (req, res) => {
  try {
    const { search, format, user: userId, startDate, endDate } = req.query;
    let query = {};

    // Search by title or filename
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { cloudinaryPublicId: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // Format filter
    if (format && format.trim() !== '') {
      query.format = { $regex: format.trim(), $options: 'i' };
    }

    // Filter by specific user
    if (userId) {
      query.uploadedBy = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email role');

    res.json({
      success: true,
      count: images.length,
      images
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch images: ' + error.message
    });
  }
};

// @desc    Get image details by ID
// @route   GET /api/admin/images/:id
// @access  Private/Admin
const getImageById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id).populate('uploadedBy', 'name email role');
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.json({
      success: true,
      image
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch image details: ' + error.message
    });
  }
};

// @desc    Delete image as Admin (Cloudinary + MongoDB)
// @route   DELETE /api/admin/images/:id
// @access  Private/Admin
const deleteImageAsAdmin = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Destroy in Cloudinary
    let cloudResult = null;
    if (image.cloudinaryPublicId) {
      try {
        cloudResult = await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (cErr) {
        console.warn(`[Cloudinary Destroy Error]:`, cErr.message);
      }
    }

    // Delete from MongoDB
    await Image.findByIdAndDelete(image._id);

    res.json({
      success: true,
      message: 'Image deleted permanently by admin',
      cloudinaryResult: cloudResult,
      deletedImageId: image._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete image: ' + error.message
    });
  }
};

// @desc    Get analytics data (uploads per day, user registrations, format breakdown)
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // 1. Uploads per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const uploadsPerDayAgg = await Image.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalBytes: { $sum: '$size' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format distribution (JPG, PNG, WEBP, etc.)
    const formatAgg = await Image.aggregate([
      {
        $group: {
          _id: '$format',
          count: { $sum: 1 },
          totalBytes: { $sum: '$size' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // User growth (registrations over last 7 days)
    const userGrowthAgg = await User.aggregate([
      {
        $match: { createdAt: { $gte: sevenDaysAgo } }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      analytics: {
        uploadsPerDay: uploadsPerDayAgg,
        formatDistribution: formatAgg,
        userGrowth: userGrowthAgg
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics: ' + error.message
    });
  }
};

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        projectName: 'Cloudinary Media Manager',
        maxUploadSizeMB: 5,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp']
      });
    }

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings: ' + error.message
    });
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    const { projectName, maxUploadSizeMB, allowedFormats } = req.body;
    let settings = await Setting.findOne();

    if (!settings) {
      settings = new Setting({});
    }

    if (projectName) settings.projectName = projectName;
    if (maxUploadSizeMB !== undefined) settings.maxUploadSizeMB = Number(maxUploadSizeMB);
    if (Array.isArray(allowedFormats)) settings.allowedFormats = allowedFormats;
    settings.updatedBy = req.user._id;

    await settings.save();

    res.json({
      success: true,
      message: 'System settings updated successfully',
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update settings: ' + error.message
    });
  }
};

module.exports = {
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
};
