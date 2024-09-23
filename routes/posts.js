var express = require('express');
var router = express.Router();

const postsController = require('../controllers/posts.js');
const { authenticateJWT } = require('../controllers/passport.js')

// Route for get post of following User (protected)
router.get('/', authenticateJWT, postsController.get_post);

// Route for one post by postId protected)
router.get('/:postId', authenticateJWT, postsController.get_one_post);

// Route for create new post(protected)
router.post('/', authenticateJWT, postsController.create_post);

// Route for update post (protected)
router.put('/', authenticateJWT, postsController.update_post);

// Route for delete post(protected)
router.delete('/', authenticateJWT, postsController.delete_post);

// Route to like or unlike a post (protected)
router.post('/like-unlike', authenticateJWT, postsController.like_unlike_post);


module.exports = router;