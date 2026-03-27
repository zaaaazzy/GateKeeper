const express = require('express');
const router = express.Router();
const vlanModel = require('../../models/vlan');
const isAdmin = require('../../middleware/isAdmin');

router.get('/', isAdmin, async (req, res) => {
  try {
    const vlans = await vlanModel.findAll();
    res.render('vlan/vlan_list', { title: 'VLAN Verwaltung', vlans });
  } catch (err) {
    console.error('Fehler beim Laden der VLAN-Liste:', err.message);
    res.status(500).render('error', { message: 'Fehler beim Laden der VLAN-Liste', error: {} });
  }
});

router.get('/add', isAdmin, (req, res) => {
  res.render('vlan/vlan_add', { title: 'VLAN hinzufügen' });
});

router.post('/add', isAdmin, async (req, res) => {
  try {
    const { name, ip , room_name} = req.body;
    if (!name || !ip || !room_name) {
      return res.status(400).render('vlan/vlan_add', { error: 'Name, IP und Raum erforderlich' });
    }
    await vlanModel.createVlan({ name, ip });
    res.redirect('/secured/vlan');
  } catch (err) {
    console.error('Fehler beim Anlegen des VLANs:', err.message);
    res.status(500).render('vlan/vlan_add', { error: 'Fehler beim Anlegen des VLANs' });
  }
});

router.get('/edit/:id', isAdmin, async (req, res) => {
  try {
    const vlan = await vlanModel.findById(req.params.id);
    if (!vlan) {
      return res.status(404).render('error', { message: 'VLAN nicht gefunden', error: {} });
    }
    res.render('vlan/vlan_edit', { title: 'VLAN bearbeiten', vlan });
  } catch (err) {
    console.error('Fehler beim Laden des VLANs:', err.message);
    res.status(500).render('error', { message: 'Fehler beim Laden des VLANs', error: {} });
  }
});

router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const vlan = await vlanModel.findById(req.params.id);
    if (!vlan) {
      return res.status(404).render('error', { message: 'VLAN nicht gefunden', error: {} });
    }
    
    const { name, ip , room_name} = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (ip) updates.ip = ip.trim();
    if (room_name) updates.room_name = room_name.trim();
    
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
      return res.status(404).json({ error: 'VLAN nicht gefunden' });
    }
    
    await vlanModel.deleteVlan(req.params.id);
    console.log('VLAN gelöscht:', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen des VLANs:', err.message);
    res.status(500).json({ error: 'Fehler beim Löschen des VLANs' });
  }
});

module.exports = router;
