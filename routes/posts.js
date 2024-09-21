var express = require('express');
var router = express.Router();

const passport = require('passport')
const postsController = require('../controllers/posts.js');

// Route for get post of following User (protected)
router.get('/', passport.authenticate('jwt', { session: false }), postsController.get_post);

// Route for one post by postId protected)
router.get('/:postId', passport.authenticate('jwt', { session: false }), postsController.get_one_post);

// Route for create new post(protected)
router.post('/', passport.authenticate('jwt', { session: false }), postsController.create_post);

// Route for update post (protected)
router.put('/', passport.authenticate('jwt', { session: false }), postsController.update_post);

// Route for delete post(protected)
router.delete('/', passport.authenticate('jwt', { session: false }), postsController.delete_post);

// Route to like or unlike a post (protected)
router.post('/like-unlike', passport.authenticate('jwt', { session: false }), postsController.like_unlike_post);


module.exports = router;