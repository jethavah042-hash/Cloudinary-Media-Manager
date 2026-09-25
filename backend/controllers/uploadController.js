const cloudinary = require('../config/cloudinary');
const Image = require('../models/Image');

// @desc    Upload an image to Cloudinary & save to MongoDB (associated with logged in user)
// @route   POST /api/upload
// @access  Private
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image'
      });
    }

    const imageUrl = req.file.path || req.file.secure_url;
    const cloudinaryPublicId = req.file.filename || req.file.public_id;
    const { title, description } = req.body;

    if (!imageUrl || !cloudinaryPublicId) {
      return res.status(500).json({
        success: false,
        message: 'Image upload to Cloudinary failed to return URL or Public ID'
      });
    }

    // Save image associated with authenticated user
    const image = await Image.create({
      title: title || req.file.originalname || 'Uploaded Image',
      description: description || '',
      imageUrl: imageUrl,
      cloudinaryPublicId: cloudinaryPublicId,
      format: req.file.mimetype || req.file.format,
      size: req.file.size || req.file.bytes,
      uploadedBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: image.imageUrl,
      cloudinaryPublicId: image.cloudinaryPublicId,
      image: image
    });
  } catch (error) {
    console.error('[Upload Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Image upload failed: ' + error.message
    });
  }
};

// @desc    Get only images uploaded by the currently authenticated user
// @route   GET /api/upload
// @access  Private
const getAllImages = async (req, res) => {
  try {
    // Return only images belonging to the authenticated user
    const images = await Image.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name email');

    return res.json({
      success: true,
      count: images.length,
      images
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching images: ' + error.message
    });
  }
};

// @desc    Get single image by ID (only if owned by user or if admin)
// @route   GET /api/upload/:id
// @access  Private
const getImageById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check ownership
    if (image.uploadedBy && !image.uploadedBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this resource.'
      });
    }

    return res.json({
      success: true,
      image
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving image: ' + error.message
    });
  }
};

// @desc    Replace / Update user's own image
// @route   PUT /api/upload/:id
// @access  Private
const replaceImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    const existingImage = await Image.findById(imageId);
    if (!existingImage) {
      return res.status(404).json({
        success: false,
        message: 'Existing image not found'
      });
    }

    // Check ownership
    if (existingImage.uploadedBy && !existingImage.uploadedBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this resource.'
      });
    }

    // If updating only metadata
    if (!req.file) {
      if (req.body.title) existingImage.title = req.body.title;
      if (req.body.description !== undefined) existingImage.description = req.body.description;
      await existingImage.save();

      return res.json({
        success: true,
        message: 'Image details updated successfully',
        image: existingImage
      });
    }

    // New file uploaded to Cloudinary
    const newImageUrl = req.file.path || req.file.secure_url;
    const newPublicId = req.file.filename || req.file.public_id;
    const oldPublicId = existingImage.cloudinaryPublicId;

    // Delete old image from Cloudinary
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
        console.log(`[Cloudinary] Old image ${oldPublicId} destroyed`);
      } catch (cloudErr) {
        console.warn(`[Cloudinary Warning] Failed to delete old image ${oldPublicId}:`, cloudErr.message);
      }
    }

    existingImage.imageUrl = newImageUrl;
    existingImage.cloudinaryPublicId = newPublicId;
    if (req.body.title) existingImage.title = req.body.title;
    if (req.body.description !== undefined) existingImage.description = req.body.description;
    existingImage.format = req.file.mimetype || req.file.format;
    existingImage.size = req.file.size || req.file.bytes;

    await existingImage.save();

    return res.json({
      success: true,
      message: 'Image replaced successfully',
      imageUrl: existingImage.imageUrl,
      cloudinaryPublicId: existingImage.cloudinaryPublicId,
      image: existingImage
    });
  } catch (error) {
    console.error('[Replace Image Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update/replace image: ' + error.message
    });
  }
};

// @desc    Delete user's own image (destroys from Cloudinary & deletes from MongoDB)
// @route   DELETE /api/upload/:id
// @access  Private
const deleteImage = async (req, res) => {
  try {
    const identifier = req.params.id;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Image ID or Public ID is required for deletion'
      });
    }

    let imageDoc = null;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      imageDoc = await Image.findById(identifier);
    }

    if (!imageDoc) {
      imageDoc = await Image.findOne({
        $or: [
          { cloudinaryPublicId: identifier },
          { cloudinaryPublicId: decodeURIComponent(identifier) }
        ]
      });
    }

    if (!imageDoc) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check ownership
    if (imageDoc.uploadedBy && !imageDoc.uploadedBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this resource.'
      });
    }

    const publicIdToDelete = imageDoc.cloudinaryPublicId;

    // Delete from Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await cloudinary.uploader.destroy(publicIdToDelete);
    } catch (cloudErr) {
      console.error(`[Cloudinary Destroy Error]:`, cloudErr);
      return res.status(500).json({
        success: false,
        message: 'Cloudinary deletion failed: ' + cloudErr.message
      });
    }

    // Remove from MongoDB
    await Image.findByIdAndDelete(imageDoc._id);

    return res.json({
      success: true,
      message: 'Image deleted successfully',
      cloudinaryResult: cloudinaryResult,
      deletedPublicId: publicIdToDelete
    });
  } catch (error) {
    console.error('[Delete Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete image: ' + error.message
    });
  }
};

module.exports = {
  uploadImage,
  getAllImages,
  getImageById,
  replaceImage,
  deleteImage
};
