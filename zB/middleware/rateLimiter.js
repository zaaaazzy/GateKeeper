const rateLimit = require('express-rate-limit');

// Rate Limiter für Login-Versuche
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Max 5 Versuche pro Fenster
  message: 'Zu viele Login-Versuche von dieser IP. Bitte versuchen Sie es in 15 Minuten erneut.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).render('login', {
      error: 'Zu viele Login-Versuche. Bitte warten Sie 15 Minuten und versuchen Sie es erneut.',
      title: 'Login'
    });
  }
});

// Rate Limiter für allgemeine API-Anfragen
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Max 100 Requests pro Fenster
  message: 'Zu viele Anfragen von dieser IP. Bitte versuchen Sie es später erneut.',
  standardHeaders: true,
  legacyHeaders: false
});

// Rate Limiter für nftables apply (wegen Systembelastung)
const nftablesLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 Minuten
  max: 10, // Max 10 Anwendungen pro 5 Minuten
  message: 'Zu viele nftables-Konfigurationen. Bitte warten Sie einige Minuten.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  apiLimiter,
  nftablesLimiter
};
