module.exports = function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  // If request expects HTML, redirect to login (home)
  if (req.accepts && req.accepts('html')) return res.redirect('/');
  return res.status(401).json({ error: 'Nicht authentifiziert' });
};
