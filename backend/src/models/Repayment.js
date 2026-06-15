const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Borrower',
      required: true,
    },
    installmentNumber: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    emiAmount: { type: Number, required: true },
    penaltyAmount: { type: Number, default: 0 },
    totalDue: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'OVERDUE'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Repayment', repaymentSchema);
