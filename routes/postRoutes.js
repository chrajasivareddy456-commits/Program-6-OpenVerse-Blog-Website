const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');

// Order matters: specific routes before the generic /:id route
router.get('/search', postController.searchPosts);
router.get('/', postController.getAllPosts);
router.post('/', postController.createPost);

router.get('/:id/comments', commentController.getCommentsForPost);
router.get('/:id/related', postController.getRelatedPosts);
router.post('/:id/like', postController.likePost);
router.post('/:id/unlike', postController.unlikePost);

router.get('/:id', postController.getPostById);
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);

module.exports = router;
