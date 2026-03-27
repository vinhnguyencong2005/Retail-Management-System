const pool = require('../dbconfig/connect_db');

const productModel = {
    getProducts: async (field = null, value = null) => {
        const allowedFields = [
            'ID',
            'ProdName',
            'Unit',
            'Quantity',
            'costPrice',
            'salePrice',
            'Note'
        ]

        let queryCommand, params = [];

        if (field != null && value!= null) {
            if (!allowedFields.includes(field)) {
                throw new Error('Invalid field name!');
            }

            queryCommand = `SELECT * FROM Product where ${field} = ?`;
            params = [value];
        } else {
            queryCommand = `SELECT * FROM Product`;
            params = [];
        }

        try {
            const [rows] = await pool.query(queryCommand, params);
            return rows;
        } catch (err) {
            console.error('Error fetching product: ', err);
            throw err;
        }
    },
}

module.exports = productModel;