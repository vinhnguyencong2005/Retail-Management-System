const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

router.get('/api/invoices', invoiceController.getInvoices);
router.get('/api/invoices/:invoiceID/items', invoiceController.getInvoiceItems);
router.post('/api/invoices', invoiceController.createInvoice);
router.patch('/api/invoices/:invoiceID/status', invoiceController.updateInvoiceStatus);

module.exports = router;
