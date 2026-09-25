const express = require('express');
const router = express.Router();
const {
  uploadImage,
  getAllImages,
  getImageById,
  replaceImage,
  deleteImage
} = require('../controllers/uploadController');
const { uploadSingle } = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware');

// Protect all user upload routes with JWT authentication
router.use(protect);

// @route   POST /api/upload
// @desc    Upload new image to Cloudinary & MongoDB
router.post('/', uploadSingle('image'), uploadImage);

// @route   GET /api/upload
// @desc    Get all images uploaded by current user
router.get('/', getAllImages);

// @route   GET /api/upload/:id
// @desc    Get single image by ID
router.get('/:id', getImageById);

// @route   PUT /api/upload/:id
// @desc    Update or replace image
router.put('/:id', uploadSingle('image'), replaceImage);

// @route   DELETE /api/upload/:id
// @desc    Delete image by ID or public ID
router.delete('/:id', deleteImage);

// @route   DELETE /api/upload/public_id/*
// @desc    Support deleting images with nested folder slashes in public_id
router.delete('/public_id/*', (req, res, next) => {
  req.params.id = req.params[0];
  deleteImage(req, res, next);
});

module.exports = router;
