const express = require('express');
const router = express.Router();
const whitelistModel = require('../../models/whitelist');
const userModel = require('../../models/user');
const vlanModel = require('../../models/vlan');
const isAdmin = require('../../middleware/isAdmin');
const ensureAuth = require('../../middleware/auth');
const { formatDatetimeDisplay, formatDatetimeLocal } = require('../../lib/dateUtils');

router.get('/', isAdmin, async (req, res) => {
  try {
    const whitelists = await whitelistModel.findAll();
    
    // Formatiere Datetime-Werte für schöne Anzeige
    whitelists.forEach(w => {
      w.start_display = formatDatetimeDisplay(w.start);
      w.end_display = formatDatetimeDisplay(w.end);
    });
    
    res.render('whitelist/whitelist_list', { 
      title: 'Whitelist Verwaltung', 
      whitelists,
      success: req.query.success,
      error: req.query.error
    });
  } catch (err) {
    console.error('Fehler beim Laden der Whitelist:', err.message);
    res.status(500).render('error', { message: 'Fehler beim Laden der Whitelist', error: {} });
  }
});

router.get('/add', ensureAuth, async (req, res) => {
  try {
    const isAdmin = req.session.user.role === 1;
    
    let users = [];
    let vlans = [];
    
    // Admins können User und VLAN auswählen, normale User nicht
    if (isAdmin) {
      users = await userModel.findAll();
      vlans = await vlanModel.findAll();
    } else {
      // Für normale User: VLAN automatisch zuweisen
      vlans = await vlanModel.findAll();
    }
    
    res.render('whitelist/whitelist_add', { 
      title: 'Whitelist hinzufügen', 
      user: req.session.user,
      users, 
      vlans 
    });
  } catch (err) {
    console.error('Fehler beim Laden des Formulars:', err.message);
    res.redirect('/auth/dashboard?error=Fehler beim Laden des Formulars');
  }
});

router.post('/add', ensureAuth, async (req, res) => {
  try {
    const isAdmin = req.session.user.role === 1;
    let { user_id, name, url, start, end, rythm, unit, vlan_id } = req.body;
    
    // Normale User: Automatisch ihre eigene User-ID und erstes VLAN verwenden
    if (!isAdmin) {
      user_id = req.session.user.id;
      const vlans = await vlanModel.findAll();
      vlan_id = vlans[0]?.id;
      
      if (!vlan_id) {
        return res.redirect('/auth/dashboard?error=Kein VLAN verfügbar');
      }
    }
    
    if (!user_id || !name || !url || !vlan_id) {
      const users = isAdmin ? await userModel.findAll() : [];
      const vlans = await vlanModel.findAll();
      return res.status(400).render('whitelist/whitelist_add', { 
        error: 'Name, URL und VLAN erforderlich',
        user: req.session.user,
        users,
        vlans 
      });
    }
    
    await whitelistModel.createWhitelist({ 
      user_id, 
      name, 
      url, 
      start: start || null, 
      end: end || null, 
      rythm: rythm || null, 
      unit: unit || null, 
      vlan_id 
    });
    
    // Admin zurück zur Whitelist-Liste, User zum Dashboard
    if (isAdmin) {
      res.redirect('/secured/whitelist?success=Whitelist erfolgreich hinzugefügt');
    } else {
      res.redirect('/auth/dashboard?success=Whitelist erfolgreich hinzugefügt');
    }
  } catch (err) {
    console.error('Fehler beim Anlegen des Whitelist-Eintrags:', err.message);
    const isAdmin = req.session.user.role === 1;
    const users = isAdmin ? await userModel.findAll() : [];
    const vlans = await vlanModel.findAll();
    res.status(500).render('whitelist/whitelist_add', { 
      error: 'Fehler beim Anlegen des Whitelist-Eintrags',
      user: req.session.user,
      users,
      vlans 
    });
  }
});

router.get('/edit/:id', ensureAuth, async (req, res) => {
  try {
    const whitelist = await whitelistModel.findById(req.params.id);
    if (!whitelist) {
      return res.redirect('/auth/dashboard?error=Whitelist-Eintrag nicht gefunden');
    }
    
    // Prüfen, ob Whitelist dem User gehört oder User Admin ist
    const isAdmin = req.session.user.role === 1;
    const isOwner = parseInt(whitelist.user_id) === parseInt(req.session.user.id);
    
    if (!isOwner && !isAdmin) {
      return res.redirect('/auth/dashboard?error=Keine Berechtigung');
    }
    
    // Formatiere Datetime-Werte für datetime-local Input
    if (whitelist.start) {
      whitelist.start = formatDatetimeLocal(whitelist.start);
    }
    if (whitelist.end) {
      whitelist.end = formatDatetimeLocal(whitelist.end);
    }
    
    const users = await userModel.findAll();
    const vlans = await vlanModel.findAll();
    
    res.render('whitelist/whitelist_edit', { 
      title: 'Whitelist bearbeiten', 
      whitelist,
      users,
      vlans,
      user: req.session.user
    });
  } catch (err) {
    console.error('Fehler beim Laden des Whitelist-Eintrags:', err.message);
    res.redirect('/auth/dashboard?error=Fehler beim Laden des Whitelist-Eintrags');
  }
});

router.post('/edit/:id', ensureAuth, async (req, res) => {
  try {
    const whitelist = await whitelistModel.findById(req.params.id);
    if (!whitelist) {
      return res.redirect('/auth/dashboard?error=Whitelist-Eintrag nicht gefunden');
    }
    
    // Prüfen, ob Whitelist dem User gehört oder User Admin ist
    const isAdmin = req.session.user.role === 1;
    const isOwner = parseInt(whitelist.user_id) === parseInt(req.session.user.id);
    
    if (!isOwner && !isAdmin) {
      return res.redirect('/auth/dashboard?error=Keine Berechtigung');
    }
    
    const { user_id, name, url, start, end, rythm, unit, vlan_id } = req.body;
    const updates = {};
    
    // Normale User können nur Name und URL ändern, Admins alles
    if (isAdmin) {
      if (user_id) updates.user_id = user_id;
      if (vlan_id) updates.vlan_id = vlan_id;
    }
    
    if (name) updates.name = name.trim();
    if (url) updates.url = url.trim();
    
    // Optional fields
    updates.start = start || null;
    updates.end = end || null;
    updates.rythm = rythm || null;
    updates.unit = unit || null;
    
    await whitelistModel.updateWhitelist(req.params.id, updates);
    
    res.redirect('/auth/dashboard?success=Whitelist erfolgreich aktualisiert');
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Whitelist-Eintrags:', err.message);
    res.redirect('/auth/dashboard?error=Fehler beim Aktualisieren');
  }
});

router.post('/delete/:id', isAdmin, async (req, res) => {
    console.log('Anfrage zum Löschen des Whitelist-Eintrags mit ID:', req.params.id);
  try {
    const whitelist = await whitelistModel.findById(req.params.id);
    if (!whitelist) {
      return res.status(404).json({ error: 'Whitelist-Eintrag nicht gefunden' });
    }
    
    await whitelistModel.deleteWhitelist(req.params.id);
    console.log('Whitelist-Eintrag gelöscht:', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen des Whitelist-Eintrags:', err.message);
    res.status(500).json({ error: 'Fehler beim Löschen des Whitelist-Eintrags' });
  }
});

module.exports = router;
