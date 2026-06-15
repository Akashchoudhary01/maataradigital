const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for borrower documents
const borrowerDocStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'loan-management/borrowers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

const upload = multer({
  storage: borrowerDocStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
    }
  },
});

/**
 * Delete a file from Cloudinary by URL
 * @param {string} url - Cloudinary URL
 */
const deleteFromCloudinary = async (url) => {
  try {
    if (!url) return;
    // Extract public_id from URL
    const parts = url.split('/');
    const fileName = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `loan-management/borrowers/${fileName}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
  }
};

module.exports = { cloudinary, upload, deleteFromCloudinary };
