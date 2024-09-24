var express = require('express');
var router = express.Router();

const profilesController = require('../controllers/profiles.js');
const { authenticateJWT } = require('../controllers/passport.js')

// Route GET profiles of all user.(protected)
router.get('/', authenticateJWT, profilesController.get_profiles);

// Route GET one profile by username.(protected)
router.get('/:username', authenticateJWT, profilesController.get_one_profile);

// Route PUT profile one user.(protected)
router.put('/', authenticateJWT, profilesController.update_profile);

// Route POST update profile photo of one user.(protected)
router.post('/update-photo', authenticateJWT, profilesController.update_photo_profile);



module.exports = router;
