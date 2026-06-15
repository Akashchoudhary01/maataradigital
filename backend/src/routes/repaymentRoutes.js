const express = require('express');
const router = express.Router();
const {
  getRepayments,
  markAsPaid,
  undoPay,
  addPenalty,
  getPenalties,
} = require('../controllers/repaymentController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', getRepayments);
router.put('/:id/pay', markAsPaid);
router.put('/:id/undo-pay', undoPay);
router.post('/:id/penalty', addPenalty);
router.get('/:id/penalties', getPenalties);

module.exports = router;
