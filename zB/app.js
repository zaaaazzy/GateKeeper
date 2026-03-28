var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
var session = require('express-session');
var csrf = require('csurf');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session-Konfiguration mit verbesserter Sicherheit
const sessionConfig = {
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in Produktion
    httpOnly: true, // Schutz vor XSS
    maxAge: 1000 * 60 * 60 * 24, // 24 Stunden
    sameSite: 'strict' // CSRF-Schutz
  }
};

// Warnung wenn kein SESSION_SECRET gesetzt ist
if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  WARNUNG: SESSION_SECRET nicht gesetzt! Verwende zufälliges Secret (nicht für Produktion geeignet)');
  console.warn('   Setze SESSION_SECRET in .env für Produktion');
}

app.use(session(sessionConfig));

// CSRF-Schutz aktivieren (nach Session-Middleware)
const csrfProtection = csrf({ cookie: false }); // Session-basiert

// expose user and CSRF token to templates
app.use(function(req, res, next) {
  res.locals.user = req.session.user || null;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Routes mit CSRF-Schutz
app.use('/', csrfProtection, function(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
}, require('./routes/index'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // CSRF-Token-Fehler behandeln
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('error', {
      message: 'Ungültiges Sicherheitstoken',
      error: req.app.get('env') === 'development' ? err : {}
    });
  }
  
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
