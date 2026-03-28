const express = require('express');
const router = express.Router();
const vlanModel = require('../../models/vlan');
const isAdmin = require('../../middleware/isAdmin');
const { isValidIp, isValidVlanName, sanitizeString } = require('../../lib/validators');
const { renderError, sendJsonSuccess, sendJsonError } = require('../../lib/responseHelpers');

router.get('/', isAdmin, async (req, res) => {
  try {
    const vlans = await vlanModel.findAll();
    res.render('vlan/vlan_list', { title: 'VLAN Verwaltung', vlans });
  } catch (err) {
    console.error('Fehler beim Laden der VLAN-Liste:', err.message);
    return renderError(res, 'Fehler beim Laden der VLAN-Liste', 500, req);
  }
});

router.get('/add', isAdmin, (req, res) => {
  res.render('vlan/vlan_add', { title: 'VLAN hinzufügen' });
});

router.post('/add', isAdmin, async (req, res) => {
  try {
    const name = sanitizeString(req.body.name);
    const ip = req.body.ip?.trim();
    const room_name = sanitizeString(req.body.room_name);
    
    // Validierung
    if (!name || !ip || !room_name) {
      return res.status(400).render('vlan/vlan_add', { 
        title: 'VLAN hinzufügen',
        error: 'Name, IP und Raum sind erforderlich' 
      });
    }
    
    if (!isValidVlanName(name)) {
      return res.status(400).render('vlan/vlan_add', { 
        title: 'VLAN hinzufügen',
        error: 'Ungültiger VLAN-Name (nur alphanumerisch, -, _)' 
      });
    }
    
    if (!isValidIp(ip)) {
      return res.status(400).render('vlan/vlan_add', { 
        title: 'VLAN hinzufügen',
        error: 'Ungültige IP-Adresse' 
      });
    }
    
    await vlanModel.createVlan({ name, ip, room_name });
    res.redirect('/secured/vlan');
  } catch (err) {
    console.error('Fehler beim Anlegen des VLANs:', err.message);
    res.status(500).render('vlan/vlan_add', { 
      title: 'VLAN hinzufügen',
      error: 'Fehler beim Anlegen des VLANs' 
    });
  }
});

router.get('/edit/:id', isAdmin, async (req, res) => {
  try {
    const vlan = await vlanModel.findById(req.params.id);
    if (!vlan) {
      return renderError(res, 'VLAN nicht gefunden', 404, req);
    }
    res.render('vlan/vlan_edit', { title: 'VLAN bearbeiten', vlan });
  } catch (err) {
    console.error('Fehler beim Laden des VLANs:', err.message);
    return renderError(res, 'Fehler beim Laden des VLANs', 500, req);
  }
});

router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const vlan = await vlanModel.findById(req.params.id);
    if (!vlan) {
      return renderError(res, 'VLAN nicht gefunden', 404, req);
    }
    
    const name = sanitizeString(req.body.name);
    const ip = req.body.ip?.trim();
    const room_name = sanitizeString(req.body.room_name);
    
    // Validierung
    if (name && !isValidVlanName(name)) {
      return res.status(400).render('vlan/vlan_edit', { 
        title: 'VLAN bearbeiten',
        vlan,
        error: 'Ungültiger VLAN-Name (nur alphanumerisch, -, _)' 
      });
    }
    
    if (ip && !isValidIp(ip)) {
      return res.status(400).render('vlan/vlan_edit', { 
        title: 'VLAN bearbeiten',
        vlan,
        error: 'Ungültige IP-Adresse' 
      });
    }
    
    const updates = {};
    if (name) updates.name = name;
    if (ip) updates.ip = ip;
    if (room_name) updates.room_name = room_name;
    
    await vlanModel.updateVlan(req.params.id, updates);
    
    const updatedVlan = await vlanModel.findById(req.params.id);
    res.render('vlan/vlan_edit', { 
      title: 'VLAN bearbeiten', 
      vlan: updatedVlan, 
      success: 'VLAN erfolgreich aktualisiert.' 
    });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des VLANs:', err.message);
    const vlan = await vlanModel.findById(req.params.id);
    res.status(500).render('vlan/vlan_edit', { 
      title: 'VLAN bearbeiten',
      vlan,
      error: 'Fehler beim Aktualisieren des VLANs' 
    });
  }
});

router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const vlan = await vlanModel.findById(req.params.id);
    if (!vlan) {
      return sendJsonError(res, 'VLAN nicht gefunden', 404);
    }
    
    await vlanModel.deleteVlan(req.params.id);
    return sendJsonSuccess(res, { id: req.params.id }, 'VLAN erfolgreich gelöscht');
  } catch (err) {
    console.error('Fehler beim Löschen des VLANs:', err.message);
    return sendJsonError(res, 'Fehler beim Löschen des VLANs', 500);
  }
});

module.exports = router;
