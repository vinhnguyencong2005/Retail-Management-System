const pool = require('../dbconfig/connect_db');

const customerModel = {
    getCustomers: async () => {
        queryCommand = `SELECT * FROM Customer`;
        params = [];

        try {
            const [rows] = await pool.query(queryCommand, params);
            return rows;
        } catch (err) {
            console.error('Error fetching customer: ', err);
            throw err;
        }
    },

    createCustomer: async (cname, phone = null) => {
        
    }
}