var express = require('express');
var router = express.Router();

const passport = require('passport')
const usersController = require('../controllers/users.js');
const { authenticateJWT } = require('../controllers/passport.js')

// Route for github auth (open to all)
router.get('/auth/github', (req, res, next) => {
    res.cookie('frontendUrl', req.query.frontendUrl)
    return passport.authenticate('github', { session: false })(req, res, next)
});

// receiving github auth confirmation from FE, now we go get access token from github, and then send jwtoken to FE
router.get('/auth/github/callback',
    passport.authenticate('github', {
        failureRedirect: (req) => `${req.cookies.frontendUrl}/sign-in`, // to be flexible when hosting FE at 2 diff domain e.g netlify, vercel
        session: false
    }),
    usersController.auth_github_success);

// Route for user sign-up (open to all)
router.post('/sign-up', usersController.sign_up_post);

// Route for user login (open to all)
router.post('/login', usersController.login_post);

// Route for user following (protected)
router.post('/follow', authenticateJWT, usersController.follow_post);

// Route for user un-following (protected)
router.post('/unfollow', authenticateJWT, usersController.unfollow_post);

module.exports = router;