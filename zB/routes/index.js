const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/secured', require('./secured'));

router.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/auth/dashboard');
    }
    return res.redirect('/auth/login');
});


module.exports = router;