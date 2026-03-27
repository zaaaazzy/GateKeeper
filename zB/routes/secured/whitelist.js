const express = require('express');
const router = express.Router();
const whitelistModel = require('../../models/whitelist');
const userModel = require('../../models/user');
const vlanModel = require('../../models/vlan');
const isAdmin = require('../../middleware/isAdmin');

router.get('/', isAdmin, async (req, res) => {
  try {
    const whitelists = await whitelistModel.findAll();
    res.render('whitelist/whitelist_list', { title: 'Whitelist Verwaltung', whitelists });
  } catch (err) {
    console.error('Fehler beim Laden der Whitelist:', err.message);
    res.status(500).render('error', { message: 'Fehler beim Laden der Whitelist', error: {} });
  }
});

router.get('/add', isAdmin, async (req, res) => {
  try {
    const users = await userModel.findAll();
    const vlans = await vlanModel.findAll();
    res.render('whitelist/whitelist_add', { title: 'Whitelist hinzufügen', users, vlans });
  } catch (err) {
    console.error('Fehler beim Laden des Formulars:', err.message);
    res.status(500).render('error', { message: 'Fehler beim Laden des Formulars', error: {} });
  }
});

router.post('/add', isAdmin, async (req, res) => {
  try {
    const { user_id, name, url, start, end, rythm, unit, vlan_id } = req.body;
    
    if (!user_id || !name || !url || !vlan_id) {
      const users = await userModel.findAll();
      const vlans = await vlanModel.findAll();
      return res.status(400).render('whitelist/whitelist_add', { 
        error: 'User, Name, URL und VLAN erforderlich',
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
    
    res.redirect('/secured/whitelist');
  } catch (err) {
    console.error('Fehler beim Anlegen des Whitelist-Eintrags:', err.message);
    const users = await userModel.findAll();
    const vlans = await vlanModel.findAll();
    res.status(500).render('whitelist/whitelist_add', { 
      error: 'Fehler beim Anlegen des Whitelist-Eintrags',
      users,
      vlans 
    });
  }
});

router.get('/edit/:id', isAdmin, async (req, res) => {
  try {
    const whitelist = await whitelistModel.findById(req.params.id);
    if (!whitelist) {
      return res.status(404).render('error', { message: 'Whitelist-Eintrag nicht gefunden', error: {} });
    }
    
    const users = await userModel.findAll();
    const vlans = await vlanModel.findAll();
    
    res.render('whitelist/whitelist_edit', { 
      title: 'Whitelist bearbeiten', 
      whitelist,
      users,
      vlans 
    });
  } catch (err) {
    console.error('Fehler beim Laden des Whitelist-Eintrags:', err.message);
    res.status(500).render('error', { message: 'Fehler beim Laden des Whitelist-Eintrags', error: {} });
  }
});

router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const whitelist = await whitelistModel.findById(req.params.id);
    if (!whitelist) {
      return res.status(404).render('error', { message: 'Whitelist-Eintrag nicht gefunden', error: {} });
    }
    
    const { user_id, name, url, start, end, rythm, unit, vlan_id } = req.body;
    const updates = {};
    
    if (user_id) updates.user_id = user_id;
    if (name) updates.name = name.trim();
    if (url) updates.url = url.trim();
    if (vlan_id) updates.vlan_id = vlan_id;
    
    // Optional fields
    updates.start = start || null;
    updates.end = end || null;
    updates.rythm = rythm || null;
    updates.unit = unit || null;
    
    await whitelistModel.updateWhitelist(req.params.id, updates);
    
    const updatedWhitelist = await whitelistModel.findById(req.params.id);
    const users = await userModel.findAll();
    const vlans = await vlanModel.findAll();
    
    res.render('whitelist/whitelist_edit', { 
      title: 'Whitelist bearbeiten', 
      whitelist: updatedWhitelist,
      users,
      vlans,
      success: 'Whitelist-Eintrag erfolgreich aktualisiert.' 
    });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Whitelist-Eintrags:', err.message);
    const whitelist = await whitelistModel.findById(req.params.id);
    const users = await userModel.findAll();
    const vlans = await vlanModel.findAll();
    
    res.status(500).render('whitelist/whitelist_edit', { 
      title: 'Whitelist bearbeiten',
      whitelist,
      users,
      vlans,
      error: 'Fehler beim Aktualisieren des Whitelist-Eintrags' 
    });
  }
});

router.post('/delete/:id', isAdmin, async (req, res) => {
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
