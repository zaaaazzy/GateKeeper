const express = require('express');
const router = express.Router();
const userModel = require('../../models/user');
const isAdmin = require('../../middleware/isAdmin');
const { hashPassword } = require('../../lib/password');

router.get('/', isAdmin, async (req, res) => {
  try {
    const users = await userModel.findAll();
    res.render('user/user_list', { title: 'Benutzerverwaltung', users });
  } catch (err) {
    console.error('Fehler beim Laden der Benutzerliste:', err.message);
    res.status(500).render('error', { message: 'Fehler beim Laden der Benutzerliste', error: {} });
  }
});

router.get('/register', isAdmin, (req, res) => {
  res.render('user/user_register', { title: 'Benutzer erstellen' });
});

router.post('/register', isAdmin, async (req, res) => {
  try {
    const { email, password, nom, prenom, role } = req.body;
    if (!email || !password) return res.status(400).render('user/user_register', { error: 'Email und Passwort erforderlich' });
    await userModel.createUser({ email, password, nom: nom || null, prenom: prenom || null, role: role || 2 });
    res.render('user/user_register', { success: 'Benutzer erfolgreich angelegt.' });
  } catch (err) {
    console.error('Fehler beim Anlegen des Benutzers:', err.message);
    res.status(500).render('user/user_register', { error: 'Fehler beim Anlegen des Benutzers' });
  }
});

router.get('/edit/:id', isAdmin, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).render('error', { message: 'Benutzer nicht gefunden', error: {} });
    }
    res.render('user/user_edit', { title: 'Benutzer bearbeiten', user });
  } catch (err) {
    console.error('Fehler beim Laden des Benutzers:', err.message);
    res.status(500).render('error', { message: 'Fehler beim Laden des Benutzers', error: {} });
  }
});

router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).render('error', { message: 'Benutzer nicht gefunden', error: {} });
    }
    
    const { email, nom, prenom, role_id, active, password } = req.body;
    
    console.log('POST /edit/:id - Empfangene Daten:');
    console.log('- email:', email);
    console.log('- password:', password ? `[${password.length} Zeichen]` : '[leer]');
    console.log('- role_id:', role_id);
    console.log('- active:', active);
    
    // Nur Felder hinzufügen, die tatsächlich Werte haben
    const updates = {};
    if (email) updates.email = email.trim();
    if (nom || nom === '') updates.nom = nom.trim();
    if (prenom || prenom === '') updates.prenom = prenom.trim();
    if (role_id) updates.role_id = parseInt(role_id);
    if (active !== undefined) updates.active = parseInt(active);
    
    // Nur Passwort updaten, wenn es angegeben wurde und nicht leer ist
    if (password && password.trim().length > 0) {
      console.log('Passwort wird gehashed...');
      const hashedPassword = await hashPassword(password.trim());
      console.log('Hash erstellt:', hashedPassword.substring(0, 20) + '...');
      updates.password = hashedPassword;
    } else {
      console.log('Kein Passwort zum Aktualisieren (Feld war leer)');
    }
    
    console.log('Finale Updates für DB:', Object.keys(updates));
    await userModel.updateUser(req.params.id, updates);
    
    const updatedUser = await userModel.findById(req.params.id);
    res.render('user/user_edit', { 
      title: 'Benutzer bearbeiten', 
      user: updatedUser, 
      success: 'Benutzer erfolgreich aktualisiert.' 
    });
  } catch (err) {
    console.error('Fehler beim Aktualisieren des Benutzers:', err.message);
    console.error('Stack:', err.stack);
    const user = await userModel.findById(req.params.id);
    res.status(500).render('user/user_edit', { 
      title: 'Benutzer bearbeiten',
      user,
      error: 'Fehler beim Aktualisieren des Benutzers' 
    });
  }
});

router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
    
    // Verhindern, dass der letzte Admin gelöscht wird
    if (user.role_id === 1) {
      const allUsers = await userModel.findAll();
      const adminCount = allUsers.filter(u => u.role_id === 1).length;
      if (adminCount <= 1) {
        return res.status(403).json({ error: 'Der letzte Administrator kann nicht gelöscht werden' });
      }
    }
    
    // Verhindern, dass Benutzer sich selbst löschen
    if (req.session.user.id === parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Sie können sich nicht selbst löschen' });
    }
    
    await userModel.deleteUser(req.params.id);
    console.log('Benutzer gelöscht:', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen des Benutzers:', err.message);
    res.status(500).json({ error: 'Fehler beim Löschen des Benutzers' });
  }
});

module.exports = router;
