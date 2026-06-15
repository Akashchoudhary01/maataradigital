const Loan = require('../models/Loan');
const Borrower = require('../models/Borrower');
const Repayment = require('../models/Repayment');
const Penalty = require('../models/Penalty');
const Notification = require('../models/Notification');

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard analytics
 * @access  Private
 */
const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parallel queries for performance
    const [
      totalBorrowers,
      totalActiveLoans,
      totalCompletedLoans,
      totalDefaultedLoans,
      loanStats,
      totalPenaltyCollected,
      dueToday,
      overdueCount,
      recentPayments,
    ] = await Promise.all([
      Borrower.countDocuments(),
      Loan.countDocuments({ status: 'ACTIVE' }),
      Loan.countDocuments({ status: 'COMPLETED' }),
      Loan.countDocuments({ status: 'DEFAULTED' }),
      Loan.aggregate([
        {
          $group: {
            _id: null,
            totalLoanAmount: { $sum: '$principalAmount' },
            totalCollected: { $sum: '$paidAmount' },
            totalRemaining: { $sum: '$remainingAmount' },
          },
        },
      ]),
      Penalty.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Repayment.countDocuments({
        dueDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'PAID' },
      }),
      Repayment.countDocuments({
        dueDate: { $lt: today },
        status: { $ne: 'PAID' },
      }),
      Repayment.find({ status: 'PAID' })
        .populate('borrowerId', 'fullName')
        .sort({ paidDate: -1 })
        .limit(5),
    ]);

    // Monthly collection for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyCollection = await Repayment.aggregate([
      {
        $match: {
          status: 'PAID',
          paidDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidDate' },
            month: { $month: '$paidDate' },
          },
          collected: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Loan status distribution
    const loanDistribution = [
      { status: 'ACTIVE', count: totalActiveLoans },
      { status: 'COMPLETED', count: totalCompletedLoans },
      { status: 'DEFAULTED', count: totalDefaultedLoans },
    ];

    const stats = loanStats[0] || { totalLoanAmount: 0, totalCollected: 0, totalRemaining: 0 };
    const penaltyTotal = totalPenaltyCollected[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBorrowers,
          totalActiveLoans,
          totalCompletedLoans,
          totalDefaultedLoans,
          totalLoanAmount: stats.totalLoanAmount,
          totalCollected: stats.totalCollected,
          totalRemaining: stats.totalRemaining,
          totalPenaltyCollected: penaltyTotal,
        },
        alerts: {
          dueToday,
          overdue: overdueCount,
        },
        charts: {
          monthlyCollection,
          loanDistribution,
        },
        recentPayments,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/notifications
 * @desc    Get notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, limit = 20 } = req.query;
    const query = {};
    if (unreadOnly === 'true') query.isRead = false;

    const notifications = await Notification.find(query)
      .populate('relatedBorrower', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/dashboard/notifications/mark-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/dashboard/reports
 * @desc    Generate reports
 * @access  Private
 */
const getReports = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    let data;

    switch (type) {
      case 'collection': {
        data = await Repayment.find({
          status: 'PAID',
          ...(startDate || endDate ? { paidDate: dateQuery } : {}),
        })
          .populate('borrowerId', 'fullName mobileNumber')
          .populate('loanId', 'principalAmount')
          .sort({ paidDate: -1 });
        break;
      }
      case 'loans': {
        data = await Loan.find({
          ...(startDate || endDate ? { createdAt: dateQuery } : {}),
        })
          .populate('borrowerId', 'fullName mobileNumber')
          .sort({ createdAt: -1 });
        break;
      }
      case 'penalties': {
        data = await Penalty.find({
          ...(startDate || endDate ? { createdAt: dateQuery } : {}),
        })
          .populate('borrowerId', 'fullName mobileNumber')
          .populate('addedBy', 'name')
          .sort({ createdAt: -1 });
        break;
      }
      case 'borrowers': {
        data = await Borrower.find({
          ...(startDate || endDate ? { createdAt: dateQuery } : {}),
        }).sort({ createdAt: -1 });
        break;
      }
      default:
        data = [];
    }

    res.status(200).json({ success: true, data, type });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getNotifications, markNotificationsRead, getReports };
