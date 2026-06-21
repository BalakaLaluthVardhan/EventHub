const multer = require('multer');
const fs = require('fs');
const path = require('path');

let storage;

// Try to initialize Cloudinary storage if credentials exist
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_KEY &&
  process.env.CLOUDINARY_SECRET
) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'CollegeEventHub',
      allowed_formats: ['jpeg', 'png', 'jpg', 'webp']
    }
  });
  console.log('☁️  Multer configured with Cloudinary storage.');
} else {
  // Local storage fallback
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
  
  // Ensure the public/uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
  console.log('📂  Multer configured with local file storage: public/uploads/');
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const safeUploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, function (err) {
      if (err) {
        console.error(`⚠️  File upload failed for field '${fieldName}':`, err);
        req.fileUploadError = err;
      }
      next();
    });
  };
};

module.exports = {
  upload,
  safeUploadSingle
};
