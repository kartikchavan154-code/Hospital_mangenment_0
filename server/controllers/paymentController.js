const { Payment, Bill } = require('../models');
const { COLLECTIONS, listAll, findById, addDoc, updateDoc, findWhere } = require('../db/firestoreAdapter');
const dbType = () => process.env.DB_TYPE || 'firestore';

exports.create = async (req, res, next) => {
  try {
    const { billId, amount, method, transactionId, notes } = req.body;

    if (dbType() === 'firestore') {
      const bill = await findById(COLLECTIONS.BILLS, billId);
      if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });

      const payment = await addDoc(COLLECTIONS.PAYMENTS, { billId, amount: parseFloat(amount), method, transactionId, notes, paidAt: new Date().toISOString() });

      // Recalculate bill status
      const allPayments = await findWhere(COLLECTIONS.PAYMENTS, [{ field: 'billId', op: '==', value: billId }]);
      const totalPaid = allPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const billTotal = parseFloat(bill.totalAmount);
      const newStatus = totalPaid >= billTotal ? 'paid' : totalPaid > 0 ? 'partial' : bill.status;
      await updateDoc(COLLECTIONS.BILLS, billId, { status: newStatus });

      return res.status(201).json({ success: true, message: 'Payment recorded.', data: payment });
    }

    const bill = await Bill.findByPk(billId);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });

    const payment = await Payment.create({ billId, amount, method, transactionId, notes, paidAt: new Date() });

    const totalPaid = await Payment.sum('amount', { where: { billId } });
    const billTotal = parseFloat(bill.totalAmount);
    if (totalPaid >= billTotal) {
      await bill.update({ status: 'paid' });
    } else if (totalPaid > 0) {
      await bill.update({ status: 'partial' });
    }

    res.status(201).json({ success: true, message: 'Payment recorded.', data: payment });
  } catch (error) {
    next(error);
  }
};

exports.getByBill = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const payments = await findWhere(COLLECTIONS.PAYMENTS, [{ field: 'billId', op: '==', value: req.params.billId }]);
      payments.sort((a, b) => (b.paidAt > a.paidAt ? 1 : -1));
      return res.json({ success: true, data: payments });
    }

    const payments = await Payment.findAll({
      where: { billId: req.params.billId },
      order: [['paidAt', 'DESC']],
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};
