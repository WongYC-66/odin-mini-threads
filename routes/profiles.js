var express = require('express');
var router = express.Router();

const passport = require('passport')
const profilesController = require('../controllers/profiles.js');

// Route GET profiles of all user.(protected)
router.get('/', passport.authenticate('jwt', { session: false }), profilesController.get_profiles);

module.exports = router;
