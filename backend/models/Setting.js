const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      default: 'Cloudinary Media Manager'
    },
    maxUploadSizeMB: {
      type: Number,
      default: 5
    },
    allowedFormats: {
      type: [String],
      default: ['jpg', 'jpeg', 'png', 'webp']
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Setting', settingSchema);
