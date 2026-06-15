const Borrower = require('../models/Borrower');
const Loan = require('../models/Loan');
const { deleteFromCloudinary } = require('../config/cloudinary');

/**
 * @route   POST /api/borrowers
 * @desc    Create a new borrower
 * @access  Private
 */
const createBorrower = async (req, res, next) => {
  try {
    const borrowerData = { ...req.body };

    // Handle uploaded files from Cloudinary
    if (req.files) {
      if (req.files.photo) borrowerData.photo = req.files.photo[0].path;
      if (req.files.aadhaarFrontImage) borrowerData.aadhaarFrontImage = req.files.aadhaarFrontImage[0].path;
      if (req.files.aadhaarBackImage) borrowerData.aadhaarBackImage = req.files.aadhaarBackImage[0].path;
      if (req.files.panCardImage) borrowerData.panCardImage = req.files.panCardImage[0].path;
    }

    // Parse nested address if sent as JSON string
    if (typeof borrowerData.address === 'string') {
      borrowerData.address = JSON.parse(borrowerData.address);
    }

    const borrower = await Borrower.create(borrowerData);

    res.status(201).json({
      success: true,
      message: 'Borrower created successfully',
      data: borrower,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/borrowers
 * @desc    Get all borrowers with search and pagination
 * @access  Private
 */
const getBorrowers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, gender, state } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { aadhaarNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (gender) query.gender = gender;
    if (state) query['address.state'] = { $regex: state, $options: 'i' };

    const total = await Borrower.countDocuments(query);
    const borrowers = await Borrower.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: borrowers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/borrowers/:id
 * @desc    Get single borrower with loans
 * @access  Private
 */
const getBorrower = async (req, res, next) => {
  try {
    const borrower = await Borrower.findById(req.params.id);
    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Borrower not found' });
    }

    // Get loans for this borrower
    const loans = await Loan.find({ borrowerId: req.params.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { ...borrower.toObject(), loans },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/borrowers/:id
 * @desc    Update borrower
 * @access  Private
 */
const updateBorrower = async (req, res, next) => {
  try {
    const borrower = await Borrower.findById(req.params.id);
    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Borrower not found' });
    }

    const updateData = { ...req.body };

    // Handle file uploads - replace old files
    if (req.files) {
      if (req.files.photo) {
        if (borrower.photo) await deleteFromCloudinary(borrower.photo);
        updateData.photo = req.files.photo[0].path;
      }
      if (req.files.aadhaarFrontImage) {
        if (borrower.aadhaarFrontImage) await deleteFromCloudinary(borrower.aadhaarFrontImage);
        updateData.aadhaarFrontImage = req.files.aadhaarFrontImage[0].path;
      }
      if (req.files.aadhaarBackImage) {
        if (borrower.aadhaarBackImage) await deleteFromCloudinary(borrower.aadhaarBackImage);
        updateData.aadhaarBackImage = req.files.aadhaarBackImage[0].path;
      }
      if (req.files.panCardImage) {
        if (borrower.panCardImage) await deleteFromCloudinary(borrower.panCardImage);
        updateData.panCardImage = req.files.panCardImage[0].path;
      }
    }

    if (typeof updateData.address === 'string') {
      updateData.address = JSON.parse(updateData.address);
    }

    const updated = await Borrower.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Borrower updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/borrowers/:id
 * @desc    Delete borrower
 * @access  Private
 */
const deleteBorrower = async (req, res, next) => {
  try {
    const borrower = await Borrower.findById(req.params.id);
    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Borrower not found' });
    }

    // Check if borrower has active loans
    const activeLoans = await Loan.findOne({ borrowerId: req.params.id, status: 'ACTIVE' });
    if (activeLoans) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete borrower with active loans',
      });
    }

    // Delete Cloudinary files
    await Promise.all([
      borrower.photo && deleteFromCloudinary(borrower.photo),
      borrower.aadhaarFrontImage && deleteFromCloudinary(borrower.aadhaarFrontImage),
      borrower.aadhaarBackImage && deleteFromCloudinary(borrower.aadhaarBackImage),
      borrower.panCardImage && deleteFromCloudinary(borrower.panCardImage),
    ]);

    await borrower.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Borrower deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBorrower, getBorrowers, getBorrower, updateBorrower, deleteBorrower };
