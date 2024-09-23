var express = require('express');
var router = express.Router();

const passport = require('passport')
const profilesController = require('../controllers/profiles.js');

// Route GET profiles of all user.(protected)
router.get('/', passport.authenticate('jwt', { session: false }), profilesController.get_profiles);

// Route GET one profile by username.(protected)
router.get('/:username', passport.authenticate('jwt', { session: false }), profilesController.get_one_profile);


// Route PUT profile one user.(protected)
router.put('/', passport.authenticate('jwt', { session: false }), profilesController.update_profile);




module.exports = router;
