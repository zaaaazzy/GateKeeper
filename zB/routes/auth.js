const express = require('express');
const router = express.Router();
const ensureAuth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const userModel = require('../models/user');
const { comparePassword } = require('../lib/password');

// Login routes (public)
router.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/auth/dashboard');
    }
    return res.render('login', { title: 'Login' });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).render('login', { error: 'Email und Passwort benötigt' });
        const user = await userModel.findByUsername(email);
        console.log('Login - User aus DB:', user);
        if (!user) return res.status(401).render('login', { error: 'Ungültiger Benutzer oder Passwort' });
        const ok = await comparePassword(password, user.password);
        if (!ok) return res.status(401).render('login', { error: 'Ungültiger Benutzer oder Passwort' });
        
        req.session.user = { 
            id: user.id, 
            email: user.email, 
            role: user.role_id, 
            role_name: user.role_name 
        };
        return res.redirect('/auth/dashboard');
    } catch (err) {
        console.error('Login-Fehler:', err.message);
        return res.status(500).render('login', { error: 'Interner Serverfehler' });
    }
});

router.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(() => res.redirect('/auth/login'));
    } else {
        res.redirect('/auth/login');
    }
});

router.use('/dashboard', require('./secured/dashboard'));

/*
router.get('/usermanagement/manage', isAdmin, (req, res) => {
  res.redirect('/secured/user');
});
*/

module.exports = router;
