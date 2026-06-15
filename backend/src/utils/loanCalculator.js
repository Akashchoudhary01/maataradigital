/**
 * Calculate loan details using flat interest rate (common in microfinance)
 *
 * Formula:
 *   totalInterest = principal * (rate/100) * months
 *   totalPayable = principal + totalInterest
 *   emi = totalPayable / months
 *
 * @param {number} principal - Loan amount
 * @param {number} monthlyRate - Monthly interest rate in %
 * @param {number} months - Duration in months
 * @returns {Object} Calculated loan values
 */
const calculateLoan = (principal, monthlyRate, months) => {
  const totalInterest = principal * (monthlyRate / 100) * months;
  const totalPayableAmount = principal + totalInterest;
  const emiAmount = Math.ceil(totalPayableAmount / months); // Round up for clean EMI

  return {
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    totalPayableAmount: parseFloat(totalPayableAmount.toFixed(2)),
    emiAmount: parseFloat(emiAmount.toFixed(2)),
    remainingAmount: parseFloat(totalPayableAmount.toFixed(2)),
  };
};

/**
 * Generate repayment schedule for a loan
 * @param {string} loanId - Loan ID
 * @param {string} borrowerId - Borrower ID
 * @param {Date} startDate - Loan start date
 * @param {number} emiAmount - EMI per month
 * @param {number} months - Total months
 * @param {number} totalPayable - Total payable amount
 * @returns {Array} Array of repayment objects
 */
const generateRepaymentSchedule = (
  loanId,
  borrowerId,
  startDate,
  emiAmount,
  months,
  totalPayable
) => {
  const schedule = [];
  const start = new Date(startDate);

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i);

    // Last installment absorbs any rounding difference
    const isLastInstallment = i === months;
    const paidSoFar = emiAmount * (i - 1);
    const thisEmi = isLastInstallment
      ? parseFloat((totalPayable - paidSoFar).toFixed(2))
      : emiAmount;

    schedule.push({
      loanId,
      borrowerId,
      installmentNumber: i,
      dueDate,
      emiAmount: thisEmi,
      penaltyAmount: 0,
      totalDue: thisEmi,
      status: 'PENDING',
    });
  }

  return schedule;
};

/**
 * Format currency in Indian Rupees
 * @param {number} amount
 * @returns {string}
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

module.exports = { calculateLoan, generateRepaymentSchedule, formatCurrency };
