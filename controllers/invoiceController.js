const invoiceModels = require('../models/invoiceModel');

const invoiceController = {
    getInvoices: async (req, res) => {
        try {
            const { field, value } = req.query;
            const invoices = await invoiceModels.getInvoices(field, value);
            res.json({
                success: true,
                data: invoices
            });
        } catch (error) {
            console.error('Error in getInvoices controller:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    getInvoiceItems: async (req, res) => {
        try {
            const { invoiceID } = req.params;
            const items = await invoiceModels.getInvoiceItems(invoiceID);
            res.json({
                success: true,
                data: items
            });
        } catch (error) {
            console.error('Error in getInvoiceItems controller:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    createInvoice: async (req, res) => {
        try {
            const { invoiceData, invoiceItems } = req.body;
            const invoiceID = await invoiceModels.createInvoice(invoiceData, invoiceItems);
            res.json({
                success: true,
                message: 'Invoice created successfully',
                invoiceID: invoiceID
            });
        } catch (error) {
            console.error('Error in createInvoice controller:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    },

    updateInvoiceStatus: async (req, res) => {
        try {
            const { invoiceID } = req.params;
            const { status } = req.body;

            const changedRows = await invoiceModels.updateInvoiceStatus(invoiceID, status);
            if (!changedRows) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            res.json({
                success: true,
                message: 'Invoice status updated successfully'
            });
        } catch (error) {
            console.error('Error in updateInvoiceStatus controller:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = invoiceController;
