const Repayment = require('../models/Repayment');
const Loan = require('../models/Loan');
const Penalty = require('../models/Penalty');
const Notification = require('../models/Notification');

/**
 * @route   GET /api/repayments
 * @desc    Get all repayments with filters
 * @access  Private
 */
const getRepayments = async (req, res, next) => {
  try {
    const { loanId, borrowerId, status, page = 1, limit = 10, startDate, endDate } = req.query;

    const query = {};
    if (loanId) query.loanId = loanId;
    if (borrowerId) query.borrowerId = borrowerId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const total = await Repayment.countDocuments(query);
    const repayments = await Repayment.find(query)
      .populate('loanId', 'principalAmount monthlyInterestRate')
      .populate('borrowerId', 'fullName mobileNumber')
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: repayments,
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
 * @route   PUT /api/repayments/:id/pay
 * @desc    Mark installment as paid
 * @access  Private
 */
const markAsPaid = async (req, res, next) => {
  try {
    const { paidDate } = req.body;

    const repayment = await Repayment.findById(req.params.id);
    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Repayment not found' });
    }

    if (repayment.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'Installment is already paid' });
    }

    repayment.status = 'PAID';
    repayment.paidDate = paidDate || new Date();
    repayment.paidAmount = repayment.totalDue;
    await repayment.save();

    // Update loan remaining amount
    const loan = await Loan.findById(repayment.loanId);
    if (loan) {
      loan.remainingAmount = Math.max(0, loan.remainingAmount - repayment.totalDue);
      loan.paidAmount = (loan.paidAmount || 0) + repayment.totalDue;

      // Check if all installments are paid -> mark loan as completed
      const pendingCount = await Repayment.countDocuments({
        loanId: loan._id,
        status: { $ne: 'PAID' },
      });

      if (pendingCount === 0) {
        loan.status = 'COMPLETED';
        loan.remainingAmount = 0;

        await Notification.create({
          title: 'Loan Completed',
          message: `All installments paid. Loan marked as completed.`,
          type: 'LOAN_COMPLETED',
          relatedLoan: loan._id,
          relatedBorrower: loan.borrowerId,
        });
      }

      await loan.save();
    }

    res.status(200).json({
      success: true,
      message: 'Installment marked as paid',
      data: repayment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/repayments/:id/undo-pay
 * @desc    Undo payment (revert to pending)
 * @access  Private
 */
const undoPay = async (req, res, next) => {
  try {
    const repayment = await Repayment.findById(req.params.id);
    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Repayment not found' });
    }

    if (repayment.status !== 'PAID') {
      return res.status(400).json({ success: false, message: 'Installment is not paid' });
    }

    const paidAmount = repayment.paidAmount;
    repayment.status = 'PENDING';
    repayment.paidDate = null;
    repayment.paidAmount = 0;
    await repayment.save();

    // Reverse loan update
    const loan = await Loan.findById(repayment.loanId);
    if (loan) {
      loan.remainingAmount += paidAmount;
      loan.paidAmount = Math.max(0, (loan.paidAmount || 0) - paidAmount);
      if (loan.status === 'COMPLETED') loan.status = 'ACTIVE';
      await loan.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment reverted successfully',
      data: repayment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/repayments/:id/penalty
 * @desc    Add penalty to a repayment
 * @access  Private
 */
const addPenalty = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    const repayment = await Repayment.findById(req.params.id);
    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Repayment not found' });
    }

    // Create penalty record
    const penalty = await Penalty.create({
      repaymentId: repayment._id,
      loanId: repayment.loanId,
      borrowerId: repayment.borrowerId,
      amount,
      reason,
      addedBy: req.admin._id,
    });

    // Update repayment totalDue
    repayment.penaltyAmount += amount;
    repayment.totalDue += amount;
    await repayment.save();

    // Update loan remaining amount
    await Loan.findByIdAndUpdate(repayment.loanId, {
      $inc: { remainingAmount: amount },
    });

    await Notification.create({
      title: 'Penalty Added',
      message: `A penalty of ₹${amount} added. Reason: ${reason}`,
      type: 'PENALTY_ADDED',
      relatedLoan: repayment.loanId,
      relatedBorrower: repayment.borrowerId,
      relatedRepayment: repayment._id,
    });

    res.status(201).json({
      success: true,
      message: 'Penalty added successfully',
      data: { penalty, repayment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/repayments/:id/penalties
 * @desc    Get all penalties for a repayment
 * @access  Private
 */
const getPenalties = async (req, res, next) => {
  try {
    const penalties = await Penalty.find({ repaymentId: req.params.id })
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: penalties });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRepayments, markAsPaid, undoPay, addPenalty, getPenalties };
