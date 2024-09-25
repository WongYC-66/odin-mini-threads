var express = require('express');
var router = express.Router();

const nextController = require('../controllers/next.js');

// for next render static outputs only
router.post('/posts', nextController.get_posts);
router.post('/users', nextController.get_users);

module.exports = router;