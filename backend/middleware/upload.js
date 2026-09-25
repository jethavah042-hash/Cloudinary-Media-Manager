const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mern-app',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => {
      // Generate clean unique filename
      const cleanFileName = file.originalname
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${Date.now()}-${cleanFileName}`;
    }
  }
});

// File filter for image MIME types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Only JPG, JPEG, PNG and WEBP images are allowed');
    error.name = 'InvalidFileTypeError';
    cb(error, false);
  }
};

// Base multer upload instance (5MB max)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max file size
  },
  fileFilter: fileFilter
});

// Middleware wrapper to handle Multer specific errors with proper HTTP status codes
const uploadSingle = (fieldName = 'image') => {
  const uploadMiddleware = upload.single(fieldName);

  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'File size must be less than 5MB'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else if (err) {
        if (err.name === 'InvalidFileTypeError' || err.message.includes('allowed')) {
          return res.status(400).json({
            success: false,
            message: err.message || 'Only JPG, JPEG, PNG and WEBP images are allowed'
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Image upload failed: ' + err.message
        });
      }
      next();
    });
  };
};

module.exports = {
  upload,
  uploadSingle
};
