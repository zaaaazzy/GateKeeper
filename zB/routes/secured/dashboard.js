

const express = require('express');
const router = express.Router();
const ensureAuth = require('../../middleware/auth');
const whitelistModel = require('../../models/whitelist');
const vlanModel = require('../../models/vlan');

router.get('/', ensureAuth, async (req, res) => {
    try {
        // Annahme: User ist im ersten VLAN (kann später erweitert werden)
        const vlans = await vlanModel.findAll();
        const userVlan = vlans[0] || null;
        
        // Lade Whitelists für dieses VLAN
        let whitelists = [];
        if (userVlan) {
            const allWhitelists = await whitelistModel.findAll();
            whitelists = allWhitelists.filter(w => w.vlan_id === userVlan.id);
        }
        
        // Traffic blocked status (aus Session)
        const trafficBlocked = req.session.trafficBlocked || false;
        
        res.render('dashboard', { 
            title: 'Dashboard', 
            user: req.session.user,
            userVlan,
            whitelists,
            trafficBlocked,
            success: req.query.success,
            error: req.query.error
        });
    } catch (err) {
        console.error('Dashboard-Fehler:', err.message);
        res.status(500).render('error', { message: 'Fehler beim Laden des Dashboards', error: {} });
    }
});

router.post('/add-whitelist', ensureAuth, async (req, res) => {
    try {
        console.log('=== Whitelist hinzufügen ===');
        console.log('Session User:', req.session.user);
        console.log('Body:', req.body);
        
        const { name, url } = req.body;
        
        if (!name || !url) {
            console.log('Fehler: Name oder URL fehlt');
            return res.redirect('/auth/dashboard?error=Name und URL erforderlich');
        }
        
        // Überprüfen, ob User in DB existiert
        const userModel = require('../../models/user');
        const dbUser = await userModel.findById(req.session.user.id);
        console.log('User aus DB:', dbUser);
        
        if (!dbUser) {
            console.log('Fehler: User nicht in Datenbank gefunden');
            return res.redirect('/auth/dashboard?error=Benutzer nicht gefunden. Bitte neu einloggen.');
        }
        
        // Annahme: User ist im ersten VLAN
        const vlans = await vlanModel.findAll();
        console.log('Verfügbare VLANs:', vlans);
        
        const userVlan = vlans[0];
        
        if (!userVlan) {
            console.log('Fehler: Kein VLAN verfügbar');
            return res.redirect('/auth/dashboard?error=Kein VLAN verfügbar');
        }
        
        const whitelistData = {
            user_id: dbUser.id,
            name,
            url,
            start: null,
            end: null,
            rythm: null,
            unit: null,
            vlan_id: userVlan.id
        };
        
        console.log('Einfügen:', whitelistData);
        
        await whitelistModel.createWhitelist(whitelistData);
        
        console.log('Whitelist erfolgreich eingefügt');
        res.redirect('/auth/dashboard?success=Whitelist erfolgreich hinzugefügt');
    } catch (err) {
        console.error('Fehler beim Hinzufügen der Whitelist:', err);
        res.redirect('/auth/dashboard?error=Fehler beim Hinzufügen: ' + err.message);
    }
});

router.post('/toggle-traffic', ensureAuth, async (req, res) => {
    try {
        // Toggle traffic blocked status in session
        req.session.trafficBlocked = !req.session.trafficBlocked;
        console.log('Traffic Status geändert:', req.session.trafficBlocked ? 'GESPERRT' : 'FREIGEGEBEN');
        res.json({ success: true, blocked: req.session.trafficBlocked });
    } catch (err) {
        console.error('Fehler beim Umschalten des Traffic-Status:', err);
        res.status(500).json({ error: 'Fehler beim Umschalten' });
    }
});

router.get('/edit-whitelist/:id', ensureAuth, async (req, res) => {
    try {
        const whitelist = await whitelistModel.findById(req.params.id);
        
        if (!whitelist) {
            return res.redirect('/auth/dashboard?error=Whitelist-Eintrag nicht gefunden');
        }
        
        // Prüfen, ob Whitelist dem User gehört
        if (whitelist.user_id !== req.session.user.id) {
            return res.redirect('/auth/dashboard?error=Keine Berechtigung');
        }
        
        const vlans = await vlanModel.findAll();
        
        res.render('dashboard_edit_whitelist', { 
            title: 'Whitelist bearbeiten', 
            whitelist,
            vlans
        });
    } catch (err) {
        console.error('Fehler beim Laden der Whitelist:', err);
        res.redirect('/auth/dashboard?error=Fehler beim Laden der Whitelist');
    }
});

router.post('/edit-whitelist/:id', ensureAuth, async (req, res) => {
    try {
        const whitelist = await whitelistModel.findById(req.params.id);
        
        if (!whitelist) {
            return res.redirect('/auth/dashboard?error=Whitelist-Eintrag nicht gefunden');
        }
        
        // Prüfen, ob Whitelist dem User gehört
        if (whitelist.user_id !== req.session.user.id) {
            return res.redirect('/auth/dashboard?error=Keine Berechtigung');
        }
        
        const { name, url } = req.body;
        const updates = {};
        
        if (name) updates.name = name.trim();
        if (url) updates.url = url.trim();
        
        await whitelistModel.updateWhitelist(req.params.id, updates);
        
        res.redirect('/auth/dashboard?success=Whitelist erfolgreich aktualisiert');
    } catch (err) {
        console.error('Fehler beim Aktualisieren der Whitelist:', err);
        res.redirect('/auth/dashboard?error=Fehler beim Aktualisieren: ' + err.message);
    }
});

router.post('/delete-whitelist/:id', ensureAuth, async (req, res) => {
    try {
        const whitelist = await whitelistModel.findById(req.params.id);
        
        if (!whitelist) {
            return res.status(404).json({ error: 'Whitelist-Eintrag nicht gefunden' });
        }
        
        // Prüfen, ob Whitelist dem User gehört
        if (whitelist.user_id !== req.session.user.id) {
            return res.status(403).json({ error: 'Keine Berechtigung' });
        }
        
        await whitelistModel.deleteWhitelist(req.params.id);
        console.log('Whitelist-Eintrag gelöscht:', req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Fehler beim Löschen der Whitelist:', err);
        res.status(500).json({ error: 'Fehler beim Löschen' });
    }
});

module.exports = router;