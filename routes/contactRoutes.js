const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.post('/contact', contactController.submitContact);
router.post('/newsletter', contactController.subscribeNewsletter);

module.exports = router;
