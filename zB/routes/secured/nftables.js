const express = require('express');
const router = express.Router();
const isAdmin = require('../../middleware/isAdmin');
const nftables = require('../../middleware/nftables');

/**
 * GET /secured/nftables/status
 * Zeigt den Status der nftables-Konfiguration
 */
router.get('/status', isAdmin, async (req, res) => {
  try {
    const activeWhitelists = await nftables.getActiveWhitelists();
    const currentConfig = await nftables.showCurrentConfig();
    
    // Session-Messages abrufen und löschen
    const successMessage = req.session.successMessage;
    const errorMessage = req.session.errorMessage;
    delete req.session.successMessage;
    delete req.session.errorMessage;
    
    res.render('nftables/status', {
      user: req.session.user,
      activeWhitelists,
      currentConfig,
      hasConfig: currentConfig !== null,
      successMessage,
      errorMessage
    });
  } catch (err) {
    console.error('Fehler beim Abrufen des nftables-Status:', err);
    res.status(500).send('Fehler beim Abrufen des Status');
  }
});

/**
 * GET /secured/nftables/preview
 * Zeigt eine Vorschau der zu generierenden nftables-Konfiguration
 */
router.get('/preview', isAdmin, async (req, res) => {
  try {
    const config = await nftables.generateNftablesConfig();
    const activeWhitelists = await nftables.getActiveWhitelists();
    
    res.render('nftables/preview', {
      user: req.session.user,
      config,
      activeWhitelists
    });
  } catch (err) {
    console.error('Fehler beim Generieren der Vorschau:', err);
    res.status(500).send('Fehler beim Generieren der Vorschau');
  }
});

/**
 * POST /secured/nftables/apply
 * Wendet die nftables-Konfiguration an
 */
router.post('/apply', isAdmin, async (req, res) => {
  try {
    const config = await nftables.generateNftablesConfig();
    const result = await nftables.applyNftablesConfig(config);
    
    if (req.query.format === 'json') {
      return res.json(result);
    }
    
    if (result.success) {
      req.session.successMessage = result.message;
    } else {
      req.session.errorMessage = result.message + (result.error ? ': ' + result.error : '');
    }
    
    res.redirect('/secured/nftables/status');
  } catch (err) {
    console.error('Fehler beim Anwenden der nftables-Konfiguration:', err);
    
    if (req.query.format === 'json') {
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Anwenden der Konfiguration',
        error: err.message
      });
    }
    
    req.session.errorMessage = 'Fehler beim Anwenden der Konfiguration: ' + err.message;
    res.redirect('/secured/nftables/status');
  }
});

/**
 * POST /secured/nftables/clear
 * Löscht die nftables-Konfiguration
 */
router.post('/clear', isAdmin, async (req, res) => {
  try {
    const result = await nftables.clearNftablesConfig();
    
    if (req.query.format === 'json') {
      return res.json(result);
    }
    
    if (result.success) {
      req.session.successMessage = result.message;
    } else {
      req.session.errorMessage = result.message + (result.error ? ': ' + result.error : '');
    }
    
    res.redirect('/secured/nftables/status');
  } catch (err) {
    console.error('Fehler beim Löschen der nftables-Konfiguration:', err);
    
    if (req.query.format === 'json') {
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Löschen',
        error: err.message
      });
    }
    
    req.session.errorMessage = 'Fehler beim Löschen: ' + err.message;
    res.redirect('/secured/nftables/status');
  }
});

/**
 * GET /secured/nftables/apply
 * URL-basierter Aufruf zum Anwenden der Konfiguration (für Cronjobs etc.)
 */
router.get('/apply', isAdmin, async (req, res) => {
  try {
    const config = await nftables.generateNftablesConfig();
    const result = await nftables.applyNftablesConfig(config);
    
    res.json(result);
  } catch (err) {
    console.error('Fehler beim Anwenden der nftables-Konfiguration:', err);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Anwenden der Konfiguration',
      error: err.message
    });
  }
});

module.exports = router;
