const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure a folder for temporary video uploads if using disk storage
const videoUploadPath = path.join(__dirname, 'uploads/videos');
if (!fs.existsSync(videoUploadPath)) {
  fs.mkdirSync(videoUploadPath, { recursive: true });
}

// Security configurations
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo', // .avi
  'video/x-ms-wmv'   // .wmv
];

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mpeg', '.mov', '.avi', '.wmv'];

// Maximum file sizes (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB (reduced from 1GB for security)

// Storage engines
const imageStorage = multer.memoryStorage();
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoUploadPath);
  },
  filename: (req, file, cb) => {
    // Generate secure filename with hash
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const secureFilename = `${Date.now()}-${hash}${ext}`;
    cb(null, secureFilename);
  }
});

// Enhanced security file validation
const validateFileType = (file, allowedTypes, allowedExtensions) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  // Check MIME type
  if (!allowedTypes.includes(mimeType)) {
    return false;
  }

  // Check file extension
  if (!allowedExtensions.includes(fileExtension)) {
    return false;
  }

  return true;
};

// Enhanced file filters with security checks
const imageFilter = (req, file, cb) => {
  try {
    // Validate file type and extension
    if (!validateFileType(file, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS)) {
      return cb(new Error('Invalid image file type. Only JPEG, PNG, GIF, and WebP files are allowed.'));
    }

    // Check for suspicious filenames
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      return cb(new Error('Invalid filename detected.'));
    }

    // Check filename length
    if (file.originalname.length > 255) {
      return cb(new Error('Filename too long.'));
    }

    cb(null, true);
  } catch (error) {
    cb(new Error('File validation failed.'));
  }
};

const videoFilter = (req, file, cb) => {
  try {
    // Validate file type and extension
    if (!validateFileType(file, ALLOWED_VIDEO_TYPES, ALLOWED_VIDEO_EXTENSIONS)) {
      return cb(new Error('Invalid video file type. Only MP4, MPEG, MOV, AVI, and WMV files are allowed.'));
    }

    // Check for suspicious filenames
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
      return cb(new Error('Invalid filename detected.'));
    }

    // Check filename length
    if (file.originalname.length > 255) {
      return cb(new Error('Filename too long.'));
    }

    cb(null, true);
  } catch (error) {
    cb(new Error('File validation failed.'));
  }
};

// Enhanced upload error handling
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Please upload a smaller file.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Please upload fewer files.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error.'
        });
    }
  }
  
  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Export dedicated uploaders to be used per route with enhanced security
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { 
    fileSize: MAX_IMAGE_SIZE,
    files: 1, // Only allow 1 file at a time
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { 
    fileSize: MAX_VIDEO_SIZE,
    files: 1, // Only allow 1 file at a time
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});

// File cleanup utility for failed uploads
const cleanupTempFiles = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up temp file: ${filePath}`);
    } catch (error) {
      console.error(`Failed to cleanup temp file: ${filePath}`, error);
    }
  }
};

module.exports = { 
  uploadImage, 
  uploadVideo, 
  handleMulterError, 
  cleanupTempFiles,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE
};
