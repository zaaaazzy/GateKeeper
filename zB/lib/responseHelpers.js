/**
 * Response-Helper-Funktionen für konsistente Fehler- und Erfolgs-Behandlung
 */

/**
 * Redirect mit Erfolgs-Nachricht
 * @param {object} res - Express Response-Objekt
 * @param {string} url - Ziel-URL
 * @param {string} message - Erfolgsnachricht
 */
function redirectWithSuccess(res, url, message) {
  const separator = url.includes('?') ? '&' : '?';
  res.redirect(`${url}${separator}success=${encodeURIComponent(message)}`);
}

/**
 * Redirect mit Fehler-Nachricht
 * @param {object} res - Express Response-Objekt
 * @param {string} url - Ziel-URL
 * @param {string} message - Fehlermeldung
 */
function redirectWithError(res, url, message) {
  const separator = url.includes('?') ? '&' : '?';
  res.redirect(`${url}${separator}error=${encodeURIComponent(message)}`);
}

/**
 * Setzt Session-Message und redirected
 * @param {object} req - Express Request-Objekt
 * @param {object} res - Express Response-Objekt
 * @param {string} url - Ziel-URL
 * @param {string} type - 'success' oder 'error'
 * @param {string} message - Nachricht
 */
function setSessionMessage(req, res, url, type, message) {
  if (type === 'success') {
    req.session.successMessage = message;
  } else if (type === 'error') {
    req.session.errorMessage = message;
  }
  res.redirect(url);
}

/**
 * Rendert Error-Seite mit einheitlicher Struktur
 * @param {object} res - Express Response-Objekt
 * @param {string} message - Fehlermeldung
 * @param {number} statusCode - HTTP Status Code (default: 500)
 * @param {object} req - Express Request-Objekt (optional für env-check)
 */
function renderError(res, message, statusCode = 500, req = null) {
  const error = req && req.app.get('env') === 'development' 
    ? { message, stack: new Error().stack }
    : {};
  
  res.status(statusCode).render('error', { 
    message, 
    error 
  });
}

/**
 * Sendet JSON-Erfolgsantwort
 * @param {object} res - Express Response-Objekt
 * @param {any} data - Daten
 * @param {string} message - Erfolgsnachricht (optional)
 */
function sendJsonSuccess(res, data = null, message = 'Erfolg') {
  res.json({
    success: true,
    message,
    data
  });
}

/**
 * Sendet JSON-Fehlerantwort
 * @param {object} res - Express Response-Objekt
 * @param {string} message - Fehlermeldung
 * @param {number} statusCode - HTTP Status Code (default: 400)
 */
function sendJsonError(res, message, statusCode = 400) {
  res.status(statusCode).json({
    success: false,
    error: message
  });
}

module.exports = {
  redirectWithSuccess,
  redirectWithError,
  setSessionMessage,
  renderError,
  sendJsonSuccess,
  sendJsonError
};
