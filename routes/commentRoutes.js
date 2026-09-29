const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.post('/', commentController.createComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
