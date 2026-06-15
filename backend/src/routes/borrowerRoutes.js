const express = require('express');
const router = express.Router();
const {
  createBorrower,
  getBorrowers,
  getBorrower,
  updateBorrower,
  deleteBorrower,
} = require('../controllers/borrowerController');
const { protect } = require('../middlewares/auth');
const { upload } = require('../config/cloudinary');

// All routes are protected
router.use(protect);

const uploadFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhaarFrontImage', maxCount: 1 },
  { name: 'aadhaarBackImage', maxCount: 1 },
  { name: 'panCardImage', maxCount: 1 },
]);

router.route('/')
  .get(getBorrowers)
  .post(uploadFields, createBorrower);

router.route('/:id')
  .get(getBorrower)
  .put(uploadFields, updateBorrower)
  .delete(deleteBorrower);

module.exports = router;
