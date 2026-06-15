const express = require('express');
const router = express.Router();
const {
  createLoan,
  getLoans,
  getLoan,
  updateLoanStatus,
  deleteLoan,
} = require('../controllers/loanController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.route('/').get(getLoans).post(createLoan);
router.route('/:id').get(getLoan).delete(deleteLoan);
router.put('/:id/status', updateLoanStatus);

module.exports = router;
