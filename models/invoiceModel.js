const pool = require('../dbconfig/connect_db');

const invoiceModel = {
    getInvoices: async (field = null, value = null) => {
        const allowedFields = {
            ID: 'i.ID',
            InvoiceDate: 'i.InvoiceDate',
            Status: 'i.Status',
            TotalAmount: 'i.TotalAmount',
            ShippingFee: 'i.ShippingFee',
            CustomerID: 'i.CustomerID',
            CustomerName: 'c.CustomerName'
        };

        let queryCommand, params = [];

        if (field != null && value!= null) {
            if (!Object.prototype.hasOwnProperty.call(allowedFields, field)) {
                throw new Error('Invalid field name!');
            }

            queryCommand = `
                SELECT i.*, c.CustomerName, c.phone AS CustomerPhone
                FROM Invoice i
                LEFT JOIN Customer c ON c.ID = i.CustomerID
                WHERE ${allowedFields[field]} = ?
            `;
            params = [value];
        } else {
            queryCommand = `
                SELECT i.*, c.CustomerName, c.phone AS CustomerPhone
                FROM Invoice i
                LEFT JOIN Customer c ON c.ID = i.CustomerID
                ORDER BY i.InvoiceDate DESC, i.ID DESC
            `;
            params = [];
        }

        try {
            const [rows] = await pool.query(queryCommand, params);
            return rows;
        } catch (err) {
            console.error('Error fetching invoice: ', err);
            throw err;
        }

    },

    getInvoiceItems: async (invoiceID) => {
        const queryCommand = `
            SELECT ii.*, p.ProdName, p.Unit
            FROM InvoiceItem ii
            LEFT JOIN Product p ON p.ID = ii.ProductID
            WHERE ii.InvoiceID = ?
        `;
        try {
            const [rows] = await pool.query(queryCommand, [invoiceID]);
            return rows;
        } catch (err) {
            console.error('Error fetching invoice items: ', err);
            throw err;
        }
    },

    createInvoice: async (invoiceData, invoiceItems) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const checkCustomerQuery = `SELECT ID FROM Customer WHERE CustomerName = ?`;
            const [customerResult] = await connection.query(checkCustomerQuery, [invoiceData.CustomerName]);
            let customerID;
            if (customerResult.length === 0) {
                const insertCustomerQuery = `INSERT INTO Customer (CustomerName, phone) VALUES (?, ?)`;
                const [customerInsertResult] = await connection.query(insertCustomerQuery, [
                    invoiceData.CustomerName,
                    invoiceData.CustomerPhone || null
                ]);
                customerID = customerInsertResult.insertId ;
            } else {
                customerID = customerResult[0].ID;
            }


            // Insert invoice
            const insertInvoiceQuery = `INSERT INTO Invoice (InvoiceDate, Status, TotalAmount, ShippingFee, CustomerID) VALUES (?, ?, ?, ?, ?)`;
            const [invoiceResult] = await connection.query(insertInvoiceQuery, [
                invoiceData.InvoiceDate,
                invoiceData.Status,
                invoiceData.TotalAmount,
                invoiceData.ShippingFee,
                customerID
            ]);

            const invoiceID = invoiceResult.insertId;

            const insertItemQuery = `INSERT INTO InvoiceItem (InvoiceID, ProductID, itemQuantity, costPriceIns, salePriceIns) VALUES (?, ?, ?, ?, ?)`;
            // Insert invoice items
            for (const item of invoiceItems) {
                await connection.query(insertItemQuery, [
                    invoiceID,
                    item.ProductID,
                    item.itemQuantity,
                    item.costPriceIns,
                    item.salePriceIns
                ]);
            }

            // Subtract quantity from Product table
            const updateProductQuery = `UPDATE Product SET Quantity = Quantity - ? WHERE ID = ?`;
            for (const item of invoiceItems) {
                await connection.query(updateProductQuery, [
                    item.itemQuantity,
                    item.ProductID
                ]);
            }

            await connection.commit();
            return invoiceID;
        } catch (err) {
            await connection.rollback();
            console.error('Error creating invoice: ', err);
            throw err;
        } finally {
            connection.release();
        }
    },

    updateInvoiceStatus: async (invoiceID, status) => {
        const allowedStatuses = ['Paid', 'Unpaid'];
        if (!allowedStatuses.includes(status)) {
            throw new Error('Invalid status value');
        }

        const updateQuery = `UPDATE Invoice SET Status = ? WHERE ID = ?`;
        try {
            const [result] = await pool.query(updateQuery, [status, invoiceID]);
            return result.affectedRows;
        } catch (err) {
            console.error('Error updating invoice status: ', err);
            throw err;
        }
    }
}

module.exports = invoiceModel;