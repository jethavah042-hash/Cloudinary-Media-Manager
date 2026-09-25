const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: 'Untitled Image'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required']
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'Cloudinary Public ID is required']
    },
    format: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Image', imageSchema);
