const Loan = require('../models/Loan');
const Repayment = require('../models/Repayment');
const Borrower = require('../models/Borrower');
const Notification = require('../models/Notification');
const { calculateLoan, generateRepaymentSchedule } = require('../utils/loanCalculator');

/**
 * @route   POST /api/loans
 * @desc    Create a new loan and generate repayment schedule
 * @access  Private
 */
const createLoan = async (req, res, next) => {
  try {
    const { borrowerId, principalAmount, monthlyInterestRate, loanDurationMonths, startDate, notes } = req.body;

    // Verify borrower exists
    const borrower = await Borrower.findById(borrowerId);
    if (!borrower) {
      return res.status(404).json({ success: false, message: 'Borrower not found' });
    }

    // Check for existing active loan
    const existingActiveLoan = await Loan.findOne({ borrowerId, status: 'ACTIVE' });
    if (existingActiveLoan) {
      return res.status(400).json({
        success: false,
        message: 'Borrower already has an active loan. Close it before creating a new one.',
      });
    }

    // Calculate loan values
    const { totalInterest, totalPayableAmount, emiAmount, remainingAmount } = calculateLoan(
      principalAmount,
      monthlyInterestRate,
      loanDurationMonths
    );

    // Create loan
    const loan = await Loan.create({
      borrowerId,
      principalAmount,
      monthlyInterestRate,
      loanDurationMonths,
      startDate: startDate || Date.now(),
      totalInterest,
      totalPayableAmount,
      emiAmount,
      remainingAmount,
      notes,
      createdBy: req.admin._id,
    });

    // Generate repayment schedule
    const schedule = generateRepaymentSchedule(
      loan._id,
      borrowerId,
      loan.startDate,
      emiAmount,
      loanDurationMonths,
      totalPayableAmount
    );

    await Repayment.insertMany(schedule);

    const populatedLoan = await Loan.findById(loan._id).populate('borrowerId', 'fullName mobileNumber');

    res.status(201).json({
      success: true,
      message: 'Loan created successfully with repayment schedule',
      data: populatedLoan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/loans
 * @desc    Get all loans with filters
 * @access  Private
 */
const getLoans = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, borrowerId, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (borrowerId) query.borrowerId = borrowerId;

    let loans;
    let total;

    if (search) {
      // Search by borrower name or mobile
      const borrowers = await Borrower.find({
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.borrowerId = { $in: borrowers.map((b) => b._id) };
    }

    total = await Loan.countDocuments(query);
    loans = await Loan.find(query)
      .populate('borrowerId', 'fullName mobileNumber photo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: loans,
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
 * @route   GET /api/loans/:id
 * @desc    Get single loan with repayment schedule
 * @access  Private
 */
const getLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('borrowerId', 'fullName mobileNumber email photo address');

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const repayments = await Repayment.find({ loanId: req.params.id })
      .sort({ installmentNumber: 1 });

    res.status(200).json({
      success: true,
      data: { ...loan.toObject(), repayments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/loans/:id/status
 * @desc    Update loan status
 * @access  Private
 */
const updateLoanStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (status === 'COMPLETED') {
      await Notification.create({
        title: 'Loan Completed',
        message: `Loan of ₹${loan.principalAmount} has been marked as completed.`,
        type: 'LOAN_COMPLETED',
        relatedLoan: loan._id,
        relatedBorrower: loan.borrowerId,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Loan status updated',
      data: loan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/loans/:id
 * @desc    Delete a loan (only if no payments made)
 * @access  Private
 */
const deleteLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const paidRepayments = await Repayment.countDocuments({ loanId: req.params.id, status: 'PAID' });
    if (paidRepayments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete loan with existing payments',
      });
    }

    await Repayment.deleteMany({ loanId: req.params.id });
    await loan.deleteOne();

    res.status(200).json({ success: true, message: 'Loan deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLoan, getLoans, getLoan, updateLoanStatus, deleteLoan };
