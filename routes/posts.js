var express = require('express');
var router = express.Router();

const passport = require('passport')
const postsController = require('../controllers/posts.js');

// Route for user sign-up (protected)
router.get('/', passport.authenticate('jwt', { session: false }), postsController.get_post);

// Route for user login (protected)
router.post('/', passport.authenticate('jwt', { session: false }), postsController.create_post);

// Route for user following (protected)
router.put('/', passport.authenticate('jwt', { session: false }), postsController.update_post);

// Route for user un-following (protected)
// router.delete('/', passport.authenticate('jwt', { session: false }), postsController.delete_post);

module.exports = router;