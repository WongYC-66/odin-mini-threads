var express = require('express');
var router = express.Router();

const passport = require('passport')
const usersController = require('../controllers/users.js');

// Route for user sign-up (open to all)
router.post('/sign-up', usersController.sign_up_post);

// Route for user login (open to all)
router.post('/login', usersController.login_post);

// Route for protected resource
router.post('/follow', passport.authenticate('jwt', { session: false }), usersController.follow_post);
// router.get('/profile', passport.authenticate('jwt', { session: false }), usersController.profile_get);

module.exports = router;