const { Op } = require('sequelize');
const { Bill, Patient, Appointment, Payment, User } = require('../models');
const { formatPaginationResponse, generateInvoiceNumber } = require('../utils/helpers');
const { generateInvoicePDF } = require('../services/pdfService');
const { COLLECTIONS, listAll, findById, addDoc, updateDoc, findWhere } = require('../db/firestoreAdapter');
const dbType = () => process.env.DB_TYPE || 'firestore';

exports.getAll = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const { status, patientId, search } = req.query;
      let bills = await listAll(COLLECTIONS.BILLS);

      if (req.user.role === 'patient') {
        const pats = await findWhere(COLLECTIONS.PATIENTS, [{ field: 'userId', op: '==', value: req.user.id }]);
        if (pats.length > 0) bills = bills.filter(b => b.patientId === pats[0].id);
      }

      if (status) bills = bills.filter(b => b.status === status);
      if (patientId) bills = bills.filter(b => b.patientId === patientId);
      if (search) bills = bills.filter(b => b.invoiceNumber?.toLowerCase().includes(search.toLowerCase()));

      bills.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
      return res.json({ success: true, data: bills, pagination: { total: bills.length } });
    }

    const { page = 1, limit = 10, status, patientId, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    if (search) where.invoiceNumber = { [Op.like]: `%${search}%` };
    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ where: { userId: req.user.id } });
      if (patient) where.patientId = patient.id;
    }

    const { count, rows } = await Bill.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] },
        { model: Payment, as: 'payments' },
      ],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, ...formatPaginationResponse(rows, count, page, limit) });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const bill = await findById(COLLECTIONS.BILLS, req.params.id);
      if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
      const payments = await findWhere(COLLECTIONS.PAYMENTS, [{ field: 'billId', op: '==', value: req.params.id }]);
      return res.json({ success: true, data: { ...bill, payments } });
    }

    const bill = await Bill.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }] },
        { model: Appointment, as: 'appointment' },
        { model: Payment, as: 'payments', order: [['paidAt', 'DESC']] },
      ],
    });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    res.json({ success: true, data: bill });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { patientId, appointmentId, items, tax = 0, discount = 0, dueDate, notes } = req.body;
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalAmount = subtotal + parseFloat(tax) - parseFloat(discount);

    if (dbType() === 'firestore') {
      const invNum = `INV-FS-${Date.now().toString(36).toUpperCase()}`;
      const bill = await addDoc(COLLECTIONS.BILLS, {
        patientId, appointmentId, invoiceNumber: invNum,
        items, subtotal, tax, discount, totalAmount, dueDate, notes, status: 'pending',
      });
      return res.status(201).json({ success: true, message: 'Invoice generated.', data: bill });
    }

    const bill = await Bill.create({ patientId, appointmentId, invoiceNumber: generateInvoiceNumber(), items, subtotal, tax, discount, totalAmount, dueDate, notes });
    const result = await Bill.findByPk(bill.id, {
      include: [{ model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }] }],
    });
    res.status(201).json({ success: true, message: 'Invoice generated.', data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const bill = await findById(COLLECTIONS.BILLS, req.params.id);
      if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
      if (req.body.items) {
        req.body.subtotal = req.body.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        req.body.totalAmount = req.body.subtotal + parseFloat(req.body.tax || bill.tax) - parseFloat(req.body.discount || bill.discount);
      }
      const updated = await updateDoc(COLLECTIONS.BILLS, req.params.id, req.body);
      return res.json({ success: true, message: 'Bill updated.', data: updated });
    }

    const bill = await Bill.findByPk(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
    if (req.body.items) {
      req.body.subtotal = req.body.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      req.body.totalAmount = req.body.subtotal + parseFloat(req.body.tax || bill.tax) - parseFloat(req.body.discount || bill.discount);
    }
    await bill.update(req.body);
    res.json({ success: true, message: 'Bill updated.', data: bill });
  } catch (error) {
    next(error);
  }
};

exports.downloadPDF = async (req, res, next) => {
  try {
    if (dbType() === 'firestore') {
      const bill = await findById(COLLECTIONS.BILLS, req.params.id);
      if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });
      const payments = await findWhere(COLLECTIONS.PAYMENTS, [{ field: 'billId', op: '==', value: req.params.id }]);
      const pdfBuffer = await generateInvoicePDF(bill, { firstName: 'Patient', lastName: '' }, payments);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=invoice-${bill.invoiceNumber}.pdf`, 'Content-Length': pdfBuffer.length });
      return res.send(pdfBuffer);
    }

    const bill = await Bill.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phone'] }] },
        { model: Payment, as: 'payments' },
      ],
    });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found.' });

    const patientInfo = {
      firstName: bill.patient.user.firstName,
      lastName: bill.patient.user.lastName,
      email: bill.patient.user.email,
      phone: bill.patient.user.phone,
    };

    const pdfBuffer = await generateInvoicePDF(bill.toJSON(), patientInfo, bill.payments || []);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=invoice-${bill.invoiceNumber}.pdf`, 'Content-Length': pdfBuffer.length });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
