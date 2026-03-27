const ensureAuthenticated = require('./auth');

module.exports = function ensureAdmin(req, res, next) {
  ensureAuthenticated(req, res, function() {
    if (req.session && req.session.user && req.session.user.role_name === 'Admin') return next();
    // for HTML requests redirect to home/login
    if (req.accepts && req.accepts('html')) return res.status(403).render('error', { message: 'Zugriff verweigert', error: {} });
    return res.status(403).json({ error: 'Forbidden' });
  });
};
