const cron = require('node-cron');
const Repayment = require('../models/Repayment');
const Notification = require('../models/Notification');

/**
 * Runs daily at midnight.
 * - Marks pending overdue installments as OVERDUE
 * - Creates notifications for due today and overdue
 */
const startCronJobs = () => {
  // Run every day at 00:05 AM
  cron.schedule('5 0 * * *', async () => {
    console.log('⏰ Running daily repayment status update...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Mark PENDING installments past due date as OVERDUE
      const overdueResult = await Repayment.updateMany(
        {
          dueDate: { $lt: today },
          status: 'PENDING',
        },
        { status: 'OVERDUE' }
      );

      if (overdueResult.modifiedCount > 0) {
        await Notification.create({
          title: 'Overdue Installments',
          message: `${overdueResult.modifiedCount} installments are now overdue.`,
          type: 'OVERDUE',
        });
      }

      // Create notifications for installments due today
      const dueTodayCount = await Repayment.countDocuments({
        dueDate: { $gte: today, $lt: tomorrow },
        status: { $ne: 'PAID' },
      });

      if (dueTodayCount > 0) {
        await Notification.create({
          title: 'Installments Due Today',
          message: `${dueTodayCount} installments are due today.`,
          type: 'DUE_TODAY',
        });
      }

      console.log(`✅ Cron job complete: ${overdueResult.modifiedCount} overdue, ${dueTodayCount} due today`);
    } catch (error) {
      console.error('❌ Cron job error:', error.message);
    }
  });

  console.log('✅ Cron jobs started');
};

module.exports = { startCronJobs };
