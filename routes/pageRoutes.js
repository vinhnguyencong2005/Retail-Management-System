const express = require('express');
const path = require('path');
const router = express.Router();

// Route for the home page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

router.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/stockManage.html'));
});

router.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/saleReport.html'));
});

module.exports = router;