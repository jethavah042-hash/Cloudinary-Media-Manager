const cloudinary = require('../config/cloudinary');
const Image = require('../models/Image');

// @desc    Upload an image to Cloudinary & save to MongoDB
// @route   POST /api/upload
// @access  Public / Protected (supports authenticated user or guest)
const uploadImage = async (req, res) => {
  try {
    // Check if file was uploaded by multer
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image'
      });
    }

    // req.file is populated by multer-storage-cloudinary
    // req.file.path contains the secure Cloudinary URL
    // req.file.filename contains the Cloudinary public_id
    const imageUrl = req.file.path || req.file.secure_url;
    const cloudinaryPublicId = req.file.filename || req.file.public_id;
    const { title, description } = req.body;

    if (!imageUrl || !cloudinaryPublicId) {
      return res.status(500).json({
        success: false,
        message: 'Image upload to Cloudinary failed to return URL or Public ID'
      });
    }

    // Save image metadata in MongoDB
    const image = await Image.create({
      title: title || req.file.originalname || 'Uploaded Image',
      description: description || '',
      imageUrl: imageUrl,
      cloudinaryPublicId: cloudinaryPublicId,
      format: req.file.mimetype || req.file.format,
      size: req.file.size || req.file.bytes,
      uploadedBy: req.user ? req.user._id : null
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

// @desc    Get all uploaded images
// @route   GET /api/upload
// @access  Public
const getAllImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 }).populate('uploadedBy', 'name email');
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

// @desc    Get single image by ID
// @route   GET /api/upload/:id
// @access  Public
const getImageById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
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

// @desc    Replace / Update existing image
// @route   PUT /api/upload/:id
// @access  Public / Protected
const replaceImage = async (req, res) => {
  try {
    const imageId = req.params.id;

    // Find the existing image document in MongoDB
    const existingImage = await Image.findById(imageId);
    if (!existingImage) {
      return res.status(404).json({
        success: false,
        message: 'Existing image not found'
      });
    }

    // Check if a new file is uploaded
    if (!req.file) {
      // If only title or description are being updated
      if (req.body.title) existingImage.title = req.body.title;
      if (req.body.description !== undefined) existingImage.description = req.body.description;
      await existingImage.save();

      return res.json({
        success: true,
        message: 'Image details updated successfully',
        image: existingImage
      });
    }

    // A new file was uploaded to Cloudinary by multer middleware
    const newImageUrl = req.file.path || req.file.secure_url;
    const newPublicId = req.file.filename || req.file.public_id;
    const oldPublicId = existingImage.cloudinaryPublicId;

    // Delete the old image from Cloudinary
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
        console.log(`[Cloudinary] Old image ${oldPublicId} deleted successfully`);
      } catch (cloudErr) {
        console.warn(`[Cloudinary Warning] Failed to delete old image ${oldPublicId}:`, cloudErr.message);
      }
    }

    // Update MongoDB document with new image details
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

// @desc    Delete image by MongoDB ID or Cloudinary Public ID
// @route   DELETE /api/upload/:id
// @access  Public / Protected
const deleteImage = async (req, res) => {
  try {
    const identifier = req.params.id;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Public ID or Image ID is required for deletion'
      });
    }

    // Try finding image by MongoDB ObjectId first, or by cloudinaryPublicId
    let imageDoc = null;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      imageDoc = await Image.findById(identifier);
    }

    if (!imageDoc) {
      // Find by exact or decoded public_id
      imageDoc = await Image.findOne({
        $or: [
          { cloudinaryPublicId: identifier },
          { cloudinaryPublicId: decodeURIComponent(identifier) }
        ]
      });
    }

    const publicIdToDelete = imageDoc ? imageDoc.cloudinaryPublicId : identifier;

    // Delete image from Cloudinary using public_id
    let cloudinaryResult;
    try {
      cloudinaryResult = await cloudinary.uploader.destroy(publicIdToDelete);
      console.log(`[Cloudinary Delete Result]:`, cloudinaryResult);
    } catch (cloudErr) {
      console.error(`[Cloudinary Destroy Error]:`, cloudErr);
      return res.status(500).json({
        success: false,
        message: 'Cloudinary deletion failed: ' + cloudErr.message
      });
    }

    // Remove document from MongoDB if it exists
    if (imageDoc) {
      await Image.findByIdAndDelete(imageDoc._id);
    } else {
      // Also try deleting by public_id just in case
      await Image.findOneAndDelete({
        $or: [
          { cloudinaryPublicId: identifier },
          { cloudinaryPublicId: decodeURIComponent(identifier) }
        ]
      });
    }

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
