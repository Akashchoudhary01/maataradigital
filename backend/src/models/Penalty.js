const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema(
  {
    repaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repayment',
      required: true,
    },
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
    amount: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Penalty', penaltySchema);
