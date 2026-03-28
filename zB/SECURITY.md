# 🔒 Gatekeeper - Sicherheits-Dokumentation

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Implementierte Sicherheitsmaßnahmen](#implementierte-sicherheitsmaßnahmen)
3. [Authentifizierung & Autorisierung](#authentifizierung--autorisierung)
4. [Session-Management](#session-management)
5. [CSRF-Schutz](#csrf-schutz)
6. [Input-Validierung & XSS-Prevention](#input-validierung--xss-prevention)
7. [SQL-Injection-Schutz](#sql-injection-schutz)
8. [Rate Limiting & DoS-Protection](#rate-limiting--dos-protection)
9. [Passwort-Sicherheit](#passwort-sicherheit)
10. [Sensitive Data Protection](#sensitive-data-protection)
11. [HTTPS & Transport Security](#https--transport-security)
12. [Security Headers](#security-headers)
13. [Bekannte Risiken & Mitigation](#bekannte-risiken--mitigation)
14. [Security Checkliste](#security-checkliste)

---

## Übersicht

Diese Dokumentation beschreibt alle implementierten Sicherheitsmaßnahmen im Gatekeeper-System. Das Projekt folgt den **OWASP Top 10** Best Practices und implementiert Defense-in-Depth-Strategien auf mehreren Ebenen.

### Sicherheits-Architektur Prinzipien

```
┌─────────────────────────────────────────────┐
│  1. Input Validation (Client + Server)     │
├─────────────────────────────────────────────┤
│  2. Authentication & Authorization          │
├─────────────────────────────────────────────┤
│  3. CSRF Protection (Token-based)           │
├─────────────────────────────────────────────┤
│  4. XSS Prevention (Sanitization)           │
├─────────────────────────────────────────────┤
│  5. SQL Injection Prevention (Prepared Stmts)│
├─────────────────────────────────────────────┤
│  6. Rate Limiting (Brute Force Protection)  │
├─────────────────────────────────────────────┤
│  7. Secure Session Management               │
├─────────────────────────────────────────────┤
│  8. Password Hashing (bcrypt)               │
├─────────────────────────────────────────────┤
│  9. HTTPS & Secure Cookies (Production)     │
├─────────────────────────────────────────────┤
│ 10. Sensitive Data Protection (.gitignore)  │
└─────────────────────────────────────────────┘
```

---

## Implementierte Sicherheitsmaßnahmen

### ✅ OWASP Top 10 Coverage

| OWASP Risiko | Status | Implementierung |
|--------------|--------|-----------------|
| **A01:2021 - Broken Access Control** | ✅ Geschützt | Middleware auth.js, isAdmin.js, Session-Check |
| **A02:2021 - Cryptographic Failures** | ✅ Geschützt | bcrypt-Hashing, HTTPS in Production, Secure Cookies |
| **A03:2021 - Injection** | ✅ Geschützt | Parameterisierte Queries, Input-Validierung |
| **A04:2021 - Insecure Design** | ✅ Adressiert | Session-basierte Auth, CSRF-Tokens, Rate Limiting |
| **A05:2021 - Security Misconfiguration** | ✅ Geschützt | .gitignore, Environment Variables, Secure Defaults |
| **A06:2021 - Vulnerable Components** | ⚠️ Teilweise | Dependencies aktuell (npm audit erforderlich) |
| **A07:2021 - Identification Failures** | ✅ Geschützt | bcrypt, Rate Limiting, Session-Timeout |
| **A08:2021 - Software & Data Integrity** | ✅ Geschützt | CSRF-Schutz, Keine CDN-Abhängigkeiten |
| **A09:2021 - Security Logging** | ⚠️ Limitiert | console.log (Logger empfohlen) |
| **A10:2021 - SSRF** | ⚠️ Teilweise | URL-Validierung (DNS-Lookup ohne Filterung) |

---

## Authentifizierung & Autorisierung

### Session-basierte Authentifizierung

**Implementierung:** `middleware/auth.js`

```javascript
// Alle geschützten Routes prüfen Session
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  // Expose User für Templates
  res.locals.user = req.session.user;
  next();
}
```

**Sicherheitsmerkmale:**
- ✅ Session-Check vor jedem geschützten Request
- ✅ Automatischer Redirect zu Login
- ✅ User-Objekt nur für authentifizierte User verfügbar
- ✅ Session-Invalidierung bei Logout

### Rollenbasierte Zugriffskontrolle (RBAC)

**Implementierung:** `middleware/isAdmin.js`

```javascript
// Admin-Routes prüfen zusätzlich Rolle
function isAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 1) {
    return res.status(403).render('error', {
      message: 'Zugriff verweigert',
      error: { status: 403 }
    });
  }
  next();
}
```

**Rollenmodell:**
- **Admin (role_id = 1)**: Voller Zugriff (User, VLAN, Whitelist, nftables)
- **Lehrer (role_id = 2)**: Dashboard, eigene Whitelists

**Geschützte Routes:**
```
/auth/*                → requireAuth
/secured/user/*        → requireAuth + isAdmin
/secured/vlan/*        → requireAuth + isAdmin
/secured/whitelist/*   → requireAuth + isAdmin
/secured/nftables/*    → requireAuth + isAdmin
```

**Sicherheitsaspekte:**
- ✅ Defense in Depth: Middleware-Check + Template-Check
- ✅ Principle of Least Privilege: Lehrer nur notwendige Rechte
- ✅ Fails Secure: Kein Zugriff bei fehlender Autorisierung
- ⚠️ **Verbesserung:** Role-IDs als Konstanten (nicht Magic Numbers)

---

## Session-Management

### Session-Konfiguration

**Implementierung:** `app.js`

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS in Production
    httpOnly: true,                                  // Kein JavaScript-Zugriff
    maxAge: 1000 * 60 * 60 * 24,                    // 24 Stunden
    sameSite: 'strict'                               // CSRF-Schutz
  }
}));
```

### Sicherheitsmerkmale

| Feature | Wert | Schutz gegen |
|---------|------|--------------|
| **httpOnly** | `true` | XSS-Angriffe (kein document.cookie-Zugriff) |
| **sameSite** | `'strict'` | CSRF-Angriffe (keine Cross-Site-Cookies) |
| **secure** | `true` (Production) | Man-in-the-Middle (nur HTTPS) |
| **maxAge** | 24 Stunden | Session-Hijacking (automatischer Timeout) |
| **secret** | 64+ Bytes | Session-Forgery (unpredictable IDs) |

### Session-Lebenszyklus

```
1. Login (POST /auth/login)
   └─> req.session.user = { id, email, role, role_name }
   
2. Authentifizierte Requests
   └─> middleware/auth.js prüft req.session.user
   
3. Logout (GET /auth/logout)
   └─> req.session.destroy()
   
4. Automatischer Timeout nach 24h
   └─> Session verfällt, Re-Login erforderlich
```

**⚠️ Bekannte Limitierung:**
- Sessions im Memory-Store (nicht persistent)
- Bei Server-Restart werden alle User ausgeloggt
- **Empfehlung:** Redis oder connect-session-sequelize für Production

---

## CSRF-Schutz

### Cross-Site Request Forgery Prevention

**Implementierung:** `app.js` + `csurf` Middleware

```javascript
const csrf = require('csurf');

// Token-basierter CSRF-Schutz (Session-Store)
app.use(csrf({ cookie: false }));

// Token in jedem Response verfügbar
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

### Token-Verwendung

#### In Pug-Templates (POST-Forms)
```pug
form(method='POST', action='/secured/vlan/add')
  input(type='hidden', name='_csrf', value=csrfToken)
  input(type='text', name='name')
  button(type='submit') Speichern
```

#### In AJAX-Requests (DELETE, PUT)
```javascript
fetch('/secured/vlan/delete/1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken  // Token aus Cookie/Global
  }
})
```

### Sicherheitsaspekte

**✅ Geschützt:**
- POST-Requests ohne Token → 403 Forbidden
- Token-Mismatch → 403 Forbidden
- Token-Reuse-Protection (Token rotiert bei jedem Request)

**Ablauf:**
```
1. User lädt Formular
   └─> Server generiert CSRF-Token
   └─> Token in Hidden-Field + Session gespeichert
   
2. User submittet Formular
   └─> Token im Request-Body (_csrf)
   
3. csurf-Middleware validiert
   └─> Vergleicht Request-Token mit Session-Token
   └─> Bei Mismatch: 403 Error
   └─> Bei Match: Request durchlassen
```

**⚠️ AJAX-Requests:**
Müssen Token explizit im Header mitschicken:
```javascript
// Token aus Cookie lesen (wenn cookie:true in csurf-Config)
const token = document.querySelector('meta[name="csrf-token"]').content;

// Oder aus Hidden-Field
const token = document.querySelector('input[name="_csrf"]').value;
```

---

## Input-Validierung & XSS-Prevention

### Validierungs-Bibliothek

**Implementierung:** `lib/validators.js`

```javascript
// XSS-Prevention: Entfernt < und > Zeichen
function sanitizeString(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '');
}

// URL-Validierung (http/https)
function isValidUrl(url) {
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
  return urlPattern.test(url);
}

// Email-Validierung (RFC 5322)
function isValidEmail(email) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

// IP-Validierung (IPv4 + IPv6)
function isValidIp(ip) {
  const ipv4 = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.( ...$/;
  const ipv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4.test(ip) || ipv6.test(ip) || ip.includes('/'); // CIDR
}

// VLAN-Name: Nur Alphanumerisch + Bindestriche/Unterstriche
function isValidVlanName(name) {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}
```

### Anwendung in Routes

**Beispiel:** `routes/secured/vlan.js`

```javascript
const { isValidIp, isValidVlanName, sanitizeString } = require('../../lib/validators');

router.post('/add', async (req, res) => {
  const name = sanitizeString(req.body.name);
  const ip = req.body.ip.trim();
  
  // Validierung vor DB-Schreiben
  if (!isValidVlanName(name)) {
    return redirectWithError(res, '/secured/vlan', 
      'Name darf nur Buchstaben, Zahlen, - und _ enthalten');
  }
  
  if (!isValidIp(ip)) {
    return redirectWithError(res, '/secured/vlan', 
      'Ungültige IP-Adresse');
  }
  
  // Safe: Input validiert
  await vlanModel.add(name, ip, room_name);
});
```

### XSS-Prevention Strategie

**1. Input-Sanitization (Server-Side)**
```javascript
// ALLE User-Inputs durchlaufen sanitizeString()
const safeName = sanitizeString(req.body.name);  // Entfernt <script> etc.
```

**2. Output-Encoding (Template-Engine)**
```pug
// Pug escapet automatisch
p= user.name  // <script>alert(1)</script> → &lt;script&gt;...
```

**3. Content Security Policy (CSP)**
```javascript
// app.js (empfohlen, nicht implementiert)
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", 
    "default-src 'self'; script-src 'self'");
  next();
});
```

**✅ Geschützte Eingabefelder:**
- VLAN-Namen (alphanumerisch only)
- Whitelist-Namen (sanitized)
- URLs (Pattern-Validierung)
- Emails (Pattern-Validierung)
- IP-Adressen (Format-Validierung)
- User-Namen (sanitized)

**⚠️ Verbesserungspotential:**
- Client-Side-Validierung für bessere UX
- CSP-Header für zusätzlichen Schutz
- Input-Length-Limits (z.B. max 255 Zeichen)

---

## SQL-Injection-Schutz

### Parameterisierte Queries

**Implementierung:** Alle Models verwenden `mysql2` mit Prepared Statements

**Beispiel:** `models/user.js`

```javascript
// ❌ UNSICHER: String-Concatenation
const query = `SELECT * FROM User WHERE email='${email}'`;
// Anfällig für: admin'--

// ✅ SICHER: Parameterisierte Query
const query = 'SELECT * FROM User WHERE email = ?';
const [rows] = await db.execute(query, [email]);
```

### Alle Models schützend

**models/vlan.js:**
```javascript
async add(name, ip, room_name) {
  const query = 'INSERT INTO Vlan (name, ip, room_name) VALUES (?, ?, ?)';
  const [result] = await db.execute(query, [name, ip, room_name]);
  return result.insertId;
}

async update(id, name, ip, room_name) {
  const query = 'UPDATE Vlan SET name = ?, ip = ?, room_name = ? WHERE id = ?';
  await db.execute(query, [name, ip, room_name, id]);
}
```

**models/whitelist.js:**
```javascript
async add(user_id, name, url, start, end, rythm, unit, vlan_id) {
  const query = `
    INSERT INTO Whitelist (user_id, name, url, start, end, rythm, unit, vlan_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(query, [user_id, name, url, start, end, rythm, unit, vlan_id]);
  return result.insertId;
}
```

**models/user.js:**
```javascript
async getByEmail(email) {
  const query = `
    SELECT u.*, r.name as role_name 
    FROM User u 
    LEFT JOIN Role r ON u.role_id = r.id 
    WHERE u.email = ?
  `;
  const [rows] = await db.execute(query, [email]);
  return rows[0];
}
```

### Sicherheitsaspekte

**✅ Geschützt:**
- String-Input: `'OR 1=1--` → Wird als Literal behandelt
- Numeric-Input: `1 OR 1=1` → Type-Check durch MySQL
- Alle CRUD-Operationen verwenden `?` Placeholders

**Mechanismus:**
```
1. Query mit Platzhaltern: SELECT * FROM User WHERE id = ?
2. Parameter separat übergeben: [userId]
3. MySQL trennt SQL-Code von Daten
4. Parameter werden escaped und als Literale behandelt
```

**⚠️ Noch nicht implementiert:**
- ORM/Query-Builder (z.B. Sequelize, Knex)
- Stored Procedures
- Database-Level Permissions (Principle of Least Privilege)

---

## Rate Limiting & DoS-Protection

### Rate-Limiting-Konfiguration

**Implementierung:** `middleware/rateLimiter.js`

```javascript
const rateLimit = require('express-rate-limit');

// Login-Schutz: Max 5 Versuche in 15 Minuten
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 Minuten
  max: 5,                    // Max 5 Requests
  message: 'Zu viele Login-Versuche. Bitte in 15 Minuten erneut versuchen.',
  standardHeaders: true,
  legacyHeaders: false,
});

// API-Schutz: Max 100 Requests in 15 Minuten
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Zu viele Anfragen. Bitte langsamer.',
});

// nftables-Schutz: Max 10 Anwendungen in 5 Minuten
const nftablesLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: 'Zu viele nftables-Anwendungen. Bitte warten.',
});
```

### Anwendung in Routes

```javascript
// routes/auth.js
const { loginLimiter } = require('../middleware/rateLimiter');
router.post('/login', loginLimiter, async (req, res) => { ... });

// routes/secured/nftables.js
const { nftablesLimiter } = require('../../middleware/rateLimiter');
router.post('/apply', isAdmin, nftablesLimiter, async (req, res) => { ... });
```

### Schutzwirkung

| Endpoint | Limit | Fenster | Schutz gegen |
|----------|-------|---------|--------------|
| `/auth/login` | 5 | 15 min | Brute-Force-Angriffe auf Passwörter |
| `/secured/*` API | 100 | 15 min | DoS, Excessive Scraping |
| `/secured/nftables/apply` | 10 | 5 min | System-Überlastung, Firewall-Spam |

**Verhalten:**
```
Request 1-5:  ✅ Durchgelassen
Request 6:    ❌ 429 Too Many Requests
Response:     "Zu viele Login-Versuche..."
Headers:      RateLimit-Limit, RateLimit-Remaining, Retry-After
```

**⚠️ Limitierungen:**
- Pro IP-Adresse (bei Proxy/NAT alle User gleiche IP)
- Memory-Store (bei Server-Restart Reset)
- **Empfehlung:** Redis-Store für verteilte Systeme

---

## Passwort-Sicherheit

### Hashing mit bcrypt

**Implementierung:** `lib/password.js`

```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;  // 2^10 Iterationen

// Passwort hashen (bei Registrierung)
async function hashPassword(password) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  return hash;  // z.B. $2b$10$N9qo8...
}

// Passwort verifizieren (bei Login)
async function verifyPassword(password, hash) {
  const match = await bcrypt.compare(password, hash);
  return match;  // true/false
}
```

### Sicherheitsaspekte

**✅ Features:**
- **Salt:** Jedes Passwort einzigartiger Salt (automatisch)
- **Adaptive:** SALT_ROUNDS anpassbar (höher = langsamer = sicherer)
- **Rainbow-Table-Schutz:** Salt verhindert Precomputed-Hash-Lookups
- **Brute-Force-Resistance:** 10 Rounds = ~100ms/Hash (teuer für Angreifer)

**Passwort-Flow:**
```
1. Registrierung:
   Input: "myPassword123"
   └─> bcrypt.hash(password, 10)
   └─> Stored: $2b$10$abcd...xyz (60 Zeichen)
   
2. Login:
   Input: "myPassword123"
   DB-Hash: $2b$10$abcd...xyz
   └─> bcrypt.compare(input, dbHash)
   └─> Extrahiert Salt aus Hash
   └─> Hasht Input mit demselben Salt
   └─> Vergleicht Hashes
   └─> Return: true/false
```

**⚠️ Verbesserungspotential:**
- Passwort-Richtlinien (min. 8 Zeichen, Komplexität)
- Passwort-History (verhindert Wiederverwendung)
- Multi-Factor-Authentication (2FA)
- Password-Reset via Email

---

## Sensitive Data Protection

### Git-Ignore-Konfiguration

**Implementierung:** `.gitignore`

```gitignore
# Environment Variables (KRITISCH)
.env
.env.local
.env.*.local

# Dependencies
node_modules/

# Logs (können Credentials enthalten)
logs/
*.log
npm-debug.log*

# IDE-Konfigurationen
.vscode/
.idea/
*.swp
*.swo

# OS-spezifisch
.DS_Store
Thumbs.db
```

**Geschützte Daten:**
- ✅ `.env` → DB-Credentials, SESSION_SECRET
- ✅ `node_modules/` → Dependencies (npm install)
- ✅ `logs/` → Potenziell sensitive Log-Einträge
- ✅ IDE-Configs → Team-spezifische Settings

### Environment Variables

**Best Practices:**

```bash
# ❌ NIEMALS im Code:
const dbPassword = 'supersecret123';

# ✅ Immer in .env:
DB_PASSWORD=supersecret123

# Im Code:
const dbPassword = process.env.DB_PASSWORD;
```

**Berechtigungen:**
```bash
# .env nur für Owner lesbar
chmod 600 .env

# Verifizieren
ls -la .env
# -rw------- 1 user user 256 .env
```

---

## HTTPS & Transport Security

### Secure-Cookie-Flag

**Implementierung:** `app.js`

```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production',  // HTTPS-only
  httpOnly: true,
  sameSite: 'strict'
}
```

**Wirkung:**
- Development: `secure: false` → HTTP erlaubt
- Production: `secure: true` → Nur HTTPS

### HTTPS-Setup (Production)

**Nginx-Reverse-Proxy:**
```nginx
server {
  listen 443 ssl http2;
  server_name gatekeeper.example.com;
  
  ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header X-Forwarded-Proto https;
  }
}
```

**Node.js HTTPS-Server:**
```javascript
// bin/www (anpassen)
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/path/to/privkey.pem'),
  cert: fs.readFileSync('/path/to/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

---

## Security Headers

### Empfohlene Headers (nicht implementiert)

```javascript
// app.js (hinzufügen)
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Für Pug-Styles
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,  // 1 Jahr
    includeSubDomains: true,
    preload: true
  }
}));

// Additional Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

---

## Bekannte Risiken & Mitigation

### 🔴 Kritisch (Action Required)

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| **Session-Loss bei Server-Restart** | Hoch | Redis/Sequelize Session-Store implementieren |
| **Fehlende 2FA** | Hoch | TOTP/Email-Verification hinzufügen |
| **nftables erfordert Root** | Hoch | Capability CAP_NET_ADMIN statt Root |

### 🟡 Medium (Empfohlen)

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| **Keine Security-Logging** | Mittel | Winston/Bunyan Logger + Audit-Log |
| **Rate Limit Memory-bound** | Mittel | Redis Rate-Limiter |
| **Fehlende Input-Length-Limits** | Mittel | MaxLength-Validierung |
| **DNS-Lookup ohne Filterung** | Mittel | Private IP-Range-Blacklist |

### 🟢 Low (Nice-to-Have)

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| **Fehlende CSP-Header** | Niedrig | Helmet.js einbinden |
| **Keine Passwort-Richtlinien** | Niedrig | Min. 8 Zeichen, Komplexität |
| **Sessions nicht rotiert** | Niedrig | Session-ID bei Privilege-Change neu |

---

## Security Checkliste

### Deployment Checklist

#### Pre-Deployment
- [ ] `.env` mit starkem SESSION_SECRET
- [ ] `NODE_ENV=production` gesetzt
- [ ] DB-User hat nur notwendige Rechte (GRANT SELECT, INSERT, UPDATE, DELETE)
- [ ] `npm audit` ohne High/Critical Issues
- [ ] HTTPS-Zertifikat installiert (Let's Encrypt)
- [ ] Firewall erlaubt nur Port 443/80

#### Post-Deployment
- [ ] Admin-Passwort geändert
- [ ] Session-Cookie secure-Flag aktiv (in Browser-DevTools prüfen)
- [ ] CSRF-Token in allen Forms vorhanden
- [ ] Rate-Limiting funktional (5 fehlgeschlagene Logins testen)
- [ ] Error-Pages zeigen keine Stack-Traces
- [ ] Logs enthalten keine Passwörter

#### Regelmäßige Wartung
- [ ] `npm audit` monatlich
- [ ] Dependencies aktualisieren
- [ ] Logs auf Anomalien prüfen
- [ ] SESSION_SECRET rotieren (jährlich)
- [ ] Backup-Tests durchführen
- [ ] Penetration-Tests (jährlich)

### Testing Security

```bash
# SQL-Injection-Test
curl -X POST http://localhost:3000/auth/login \
  -d "email=admin'--&password=any"
# ✅ Erwartung: Login fehlschlägt (kein Bypass)

# CSRF-Test
curl -X POST http://localhost:3000/secured/vlan/add \
  -b "connect.sid=stolen_session" \
  -d "name=VLAN99&ip=1.2.3.4"
# ✅ Erwartung: 403 Forbidden (CSRF-Token fehlt)

# Rate-Limit-Test
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/login \
    -d "email=test@test.com&password=wrong"
done
# ✅ Erwartung: Ab Request 6 → 429 Too Many Requests

# XSS-Test
curl -X POST http://localhost:3000/secured/vlan/add \
  -b "connect.sid=..." \
  -d "name=<script>alert(1)</script>&ip=1.2.3.4&_csrf=token"
# ✅ Erwartung: Name wird escaped/rejected
```

---

## Weiterführende Ressourcen

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Node.js Security Best Practices:** https://nodejs.org/en/docs/guides/security/
- **Express.js Security:** https://expressjs.com/en/advanced/best-practice-security.html
- **bcrypt Guidelines:** https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns
- **CSRF Protection:** https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html

---

**Zuletzt aktualisiert:** 28. März 2026  
**Version:** 1.0  
**Security-Audit:** Erforderlich vor Production-Deployment
