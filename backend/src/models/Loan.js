const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Borrower',
      required: true,
    },
    principalAmount: { type: Number, required: true },
    monthlyInterestRate: { type: Number, required: true }, // e.g., 2 for 2%
    loanDurationMonths: { type: Number, required: true },
    startDate: { type: Date, required: true, default: Date.now },
    // Calculated fields
    totalInterest: { type: Number, required: true },
    totalPayableAmount: { type: Number, required: true },
    emiAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'DEFAULTED'],
      default: 'ACTIVE',
    },
    notes: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);
