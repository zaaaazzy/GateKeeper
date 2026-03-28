# Utility-Funktionen (lib/)

Dieser Ordner enthält wiederverwendbare Helper-Funktionen, die code-Duplikation vermeiden und die Wartbarkeit verbessern.

## 📁 Verfügbare Module

### 1. `dateUtils.js` - Datum/Zeit-Formatierung

**Import:**
```javascript
const { formatDatetimeDisplay, formatDatetimeLocal } = require('../lib/dateUtils');
```

**Funktionen:**

#### `formatDatetimeDisplay(dateString)`
Formatiert DB-Datetime für Anzeige im Frontend (DD.MM.YYYY HH:MM)
```javascript
formatDatetimeDisplay('2026-03-28T14:30:00') // "28.03.2026 14:30"
```

#### `formatDatetimeLocal(dateString)`
Konvertiert DB-Datetime zu HTML5 datetime-local Format (YYYY-MM-DDTHH:MM)
```javascript
formatDatetimeLocal('2026-03-28T14:30:00') // "2026-03-28T14:30"
```

#### `parseLocalDatetime(dateString)`
Konvertiert datetime-local zu ISO-Datetime für DB
```javascript
parseLocalDatetime('2026-03-28T14:30') // "2026-03-28 14:30:00"
```

#### `isPast(dateString)` / `isFuture(dateString)`
Prüft ob Datum in Vergangenheit/Zukunft liegt

**Verwendung in Routes:**
```javascript
// Vor dem Refactoring:
function formatDatetimeDisplay(dateString) { /* ... */ }
whitelists.forEach(w => {
  w.start_display = formatDatetimeDisplay(w.start);
});

// Nach dem Refactoring:
const { formatDatetimeDisplay } = require('../../lib/dateUtils');
whitelists.forEach(w => {
  w.start_display = formatDatetimeDisplay(w.start);
});
```

---

### 2. `validators.js` - Input-Validierung

**Import:**
```javascript
const { isValidUrl, isValidEmail, isValidIp } = require('../lib/validators');
```

**Funktionen:**

#### `isValidUrl(url)`
Validiert URLs (mit/ohne Protokoll)
```javascript
isValidUrl('https://example.com') // true
isValidUrl('example.com')         // true
isValidUrl('invalid')             // false
```

#### `isValidEmail(email)`
Validiert Email-Adressen (RFC 5322 vereinfacht)
```javascript
isValidEmail('user@example.com')  // true
isValidEmail('invalid@')          // false
```

#### `isValidIp(ip)`
Validiert IPv4 und IPv6 Adressen
```javascript
isValidIp('192.168.1.1')          // true
isValidIp('::1')                  // true
```

#### `isValidVlanName(name)`
Validiert VLAN-Namen (alphanumerisch, _, -, max 255 Zeichen)

#### `isValidWhitelistName(name)`
Validiert Whitelist-Namen (1-255 Zeichen)

#### `sanitizeString(str)`
Entfernt gefährliche Zeichen aus Strings

#### `isPositiveInteger(value)`
Prüft ob Wert eine positive Ganzzahl ist

**Verwendungsbeispiel:**
```javascript
const { isValidUrl, isValidEmail } = require('../../lib/validators');

router.post('/add', async (req, res) => {
  const { email, url } = req.body;
  
  if (!isValidEmail(email)) {
    return redirectWithError(res, '/add', 'Ungültige Email-Adresse');
  }
  
  if (!isValidUrl(url)) {
    return redirectWithError(res, '/add', 'Ungültige URL');
  }
  
  // Weiter mit Verarbeitung...
});
```

---

### 3. `responseHelpers.js` - Response/Redirect-Helper

**Import:**
```javascript
const { redirectWithSuccess, redirectWithError } = require('../lib/responseHelpers');
```

**Funktionen:**

#### `redirectWithSuccess(res, url, message)`
Redirect mit Erfolgs-Query-Parameter
```javascript
redirectWithSuccess(res, '/dashboard', 'Erfolgreich gespeichert');
// Leitet weiter zu: /dashboard?success=Erfolgreich%20gespeichert
```

#### `redirectWithError(res, url, message)`
Redirect mit Fehler-Query-Parameter
```javascript
redirectWithError(res, '/add', 'Name ist erforderlich');
// Leitet weiter zu: /add?error=Name%20ist%20erforderlich
```

#### `setSessionMessage(req, res, url, type, message)`
Setzt Session-Message und redirected (für komplexere Szenarien)
```javascript
setSessionMessage(req, res, '/nftables/status', 'success', 'Konfiguration angewendet');
```

#### `renderError(res, message, statusCode, req)`
Rendert Error-Seite mit einheitlicher Struktur
```javascript
renderError(res, 'Whitelist nicht gefunden', 404, req);
```

#### `sendJsonSuccess(res, data, message)` / `sendJsonError(res, message, statusCode)`
JSON-Responses für AJAX/API-Endpunkte
```javascript
sendJsonSuccess(res, { id: 123 }, 'Erstellt');
sendJsonError(res, 'Validierungsfehler', 400);
```

**Vorher/Nachher Vergleich:**
```javascript
// Vor dem Refactoring:
return res.redirect('/dashboard?error=' + encodeURIComponent('Name fehlt'));

// Nach dem Refactoring:
const { redirectWithError } = require('../../lib/responseHelpers');
return redirectWithError(res, '/dashboard', 'Name fehlt');
```

---

## 🚀 Integration in bestehenden Code

### Beispiel: Whitelist-Route refactoren

**Vorher:**
```javascript
router.post('/add', async (req, res) => {
  try {
    const { name, url } = req.body;
    
    if (!name || !url) {
      return res.redirect('/add?error=' + encodeURIComponent('Name und URL erforderlich'));
    }
    
    // URL validieren (inline)
    let testUrl = url;
    if (!/^https?:\/\//i.test(url)) testUrl = 'http://' + url;
    try {
      new URL(testUrl);
    } catch {
      return res.redirect('/add?error=' + encodeURIComponent('Ungültige URL'));
    }
    
    await whitelistModel.create({ name, url });
    return res.redirect('/list?success=' + encodeURIComponent('Erfolgreich erstellt'));
  } catch (err) {
    console.error('Fehler:', err);
    return res.status(500).render('error', { message: 'Serverfehler', error: {} });
  }
});
```

**Nachher:**
```javascript
const { isValidUrl, sanitizeString } = require('../../lib/validators');
const { redirectWithSuccess, redirectWithError, renderError } = require('../../lib/responseHelpers');

router.post('/add', async (req, res) => {
  try {
    const name = sanitizeString(req.body.name);
    const url = req.body.url;
    
    if (!name || !url) {
      return redirectWithError(res, '/add', 'Name und URL erforderlich');
    }
    
    if (!isValidUrl(url)) {
      return redirectWithError(res, '/add', 'Ungültige URL');
    }
    
    await whitelistModel.create({ name, url });
    return redirectWithSuccess(res, '/list', 'Erfolgreich erstellt');
  } catch (err) {
    console.error('Fehler:', err);
    return renderError(res, 'Serverfehler', 500, req);
  }
});
```

---

## ✅ Vorteile

1. **Weniger Code-Duplikation** - Eine Funktion, viele Verwendungsorte
2. **Einfacher zu testen** - Isolierte Funktionen sind leichter zu unit-testen
3. **Konsistenz** - Gleiche Validierung überall
4. **Wartbarkeit** - Änderungen an einer Stelle statt an 10
5. **Lesbarkeit** - Intention klarer durch sprechende Funktionsnamen

---

## 📝 Best Practices

1. **Immer Utilities verwenden** statt Logik zu duplizieren
2. **Neue Utilities dokumentieren** in dieser README
3. **Error Handling** in Utilities einbauen (nie werfen, immer safe defaults)
4. **Pure Functions** bevorzugen (keine Side-Effects wo möglich)
5. **JSDoc-Kommentare** für alle Funktionen

---

## 🔜 Nächste Schritte

Weitere Kandidaten für Utilities:
- `lib/constants.js` - Rollen, Status-Codes, etc.
- `lib/queryBuilder.js` - Wiederverwendbare DB-Query-Helper
- `lib/logger.js` - Strukturiertes Logging statt console.log
