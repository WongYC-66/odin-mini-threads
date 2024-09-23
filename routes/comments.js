var express = require('express');
var router = express.Router();

const commentsController = require('../controllers/comments.js');
const { authenticateJWT } = require('../controllers/passport.js')

// Route for get post of following User (protected)
router.get('/', authenticateJWT, commentsController.get_comment);

// Route for create new comment(protected)
router.post('/', authenticateJWT, commentsController.create_comment);

// Route for update post (protected)
router.put('/', authenticateJWT, commentsController.update_comment);

// Route for delete post(protected)
router.delete('/', authenticateJWT, commentsController.delete_comment);


module.exports = router;
