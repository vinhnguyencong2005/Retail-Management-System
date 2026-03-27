const productModels = require('../models/productModel');

const productController = {
    getProducts: async (req, res) => {
        try {
            const { field, value } = req.query;
            const products = await productModels.getProducts(field, value);
            res.json({
                success: true,
                data: products
            });
        } catch (error) {
            console.error('Error in getProducts controller:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
};

module.exports = productController;