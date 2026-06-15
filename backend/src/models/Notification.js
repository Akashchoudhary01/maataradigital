const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['DUE_TODAY', 'OVERDUE', 'LOAN_COMPLETED', 'PENALTY_ADDED'],
      required: true,
    },
    relatedLoan: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
    relatedBorrower: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrower' },
    relatedRepayment: { type: mongoose.Schema.Types.ObjectId, ref: 'Repayment' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
