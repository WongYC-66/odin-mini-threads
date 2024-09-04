var express = require('express');
var router = express.Router();

const passport = require('passport')
const commentsController = require('../controllers/comments.js');

// Route for get post of following User (protected)
// router.get('/', passport.authenticate('jwt', { session: false }), commentsController.get_post);

// Route for create new comment(protected)
router.post('/', passport.authenticate('jwt', { session: false }), commentsController.create_comment);

// Route for update post (protected)
// router.put('/', passport.authenticate('jwt', { session: false }), commentsController.update_post);

// Route for delete post(protected)
// router.delete('/', passport.authenticate('jwt', { session: false }), commentsController.delete_post);


module.exports = router;
