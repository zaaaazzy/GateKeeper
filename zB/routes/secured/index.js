const express = require('express');
const router = express.Router();
const ensureAuth = require('../../middleware/auth');

// Apply auth middleware to all secured routes
router.use(ensureAuth);

// secured subroutes
router.use(`/user`, require('./user'));
router.use(`/vlan`, require('./vlan'));
router.use(`/whitelist`, require('./whitelist'));


// Health Check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;