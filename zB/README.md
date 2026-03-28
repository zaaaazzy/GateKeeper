# Gatekeeper - VLAN Whitelist Management System

![Version](https://img.shields.io/badge/version-0.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![License](https://img.shields.io/badge/license-private-red)

Ein sicheres Web-basiertes Verwaltungssystem für VLAN-Whitelists mit nftables-Integration für Netzwerk-Firewall-Management.

---

## 📋 Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Features](#features)
- [Architektur](#architektur)
- [Installation](#installation)
- [Konfiguration](#konfiguration)
- [Verwendung](#verwendung)
- [Sicherheit](#sicherheit)
- [API Dokumentation](#api-dokumentation)
- [Entwicklung](#entwicklung)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Übersicht

Gatekeeper ist eine Node.js-basierte Webanwendung für die zentrale Verwaltung von VLAN-basierten Netzwerk-Whitelists. Das System ermöglicht es Administratoren und Lehrern, URL-basierte Zugriffsregeln für verschiedene VLANs zu definieren und diese automatisch in Linux nftables-Firewall-Konfigurationen zu übersetzen.

### Hauptzweck
- Zentrale Verwaltung von Netzwerk-Zugangsregeln
- Rollenbasierte Berechtigungsverwaltung (Admin/Lehrer)
- Automatische nftables-Konfigurationsgenerierung
- Zeitbasierte Whitelist-Aktivierung

---

## ✨ Features

### 🔐 Sicherheit
- **Session-Management**: Express-Session mit httpOnly, sameSite, secure Cookies
- **CSRF-Schutz**: Token-basierter Schutz gegen Cross-Site Request Forgery
- **Rate Limiting**: Brute-Force-Schutz für Login (5 Versuche/15min)
- **Passwort-Hashing**: bcrypt mit Salt-Rounds
- **XSS-Schutz**: Input-Sanitization und Content Security
- **SQL-Injection-Schutz**: Parameterisierte Queries mit mysql2
- **.gitignore**: Schutz sensibler Daten vor Versionskontrolle

### 👥 Benutzerverwaltung
- Rollenbasiertes Zugriffssystem (Admin=1, Lehrer=2)
- Benutzerregistrierung und -bearbeitung
- Email-basierte Authentifizierung
- Aktiv/Inaktiv Status-Verwaltung

### 🌐 VLAN-Verwaltung
- Erstellen, Bearbeiten, Löschen von VLANs
- IP-Adress-Validierung (IPv4/IPv6)
- Raum-Zuordnung
- Übersichtliche Listenansicht

### 📋 Whitelist-Management
- URL-basierte Whitelist-Einträge
- Zeitfenster-Steuerung (Start/Ende)
- VLAN-spezifische Zuordnung
- User-spezifische oder globale Whitelists
- Automatische DNS-Auflösung

### 🔥 nftables Integration
- Automatische Konfigurationsgenerierung
- DNS-Auflösung zu IP-Adressen (IPv4/IPv6)
- Vorschau vor Anwendung
- Aktive Whitelist-Filterung nach Zeitfenstern
- Linux-System-Erkennung

### 🎨 Benutzeroberfläche
- Responsive Design
- Klare Tabellendarstellung
- Modal-Dialoge für Bestätigungen
- Traffic-Toggle im Dashboard
- Icon-basierte Aktionsbuttons
- Konsistentes Grün-Theme (#1fa667)

---

## 🏗️ Architektur

### Technologie-Stack

```
Frontend:
├── Pug (Template Engine)
├── CSS3 (Custom Styling)
└── Vanilla JavaScript (AJAX, Modal-System)

Backend:
├── Node.js 16+
├── Express.js 4.22.1
├── MySQL 8.0+
└── bcrypt (Passwort-Hashing)

Sicherheit:
├── csurf (CSRF-Schutz)
├── express-session (Session-Management)
└── express-rate-limit (Rate Limiting)
```

### Projektstruktur

```
zB/
├── app.js                      # Express-App-Konfiguration
├── package.json                # Dependencies
├── .env                        # Umgebungsvariablen (nicht versioniert)
├── .gitignore                  # Git-Ignore-Regeln
│
├── bin/
│   └── www                     # Server-Startscript
│
├── lib/                        # ⭐ Utility-Funktionen
│   ├── dateUtils.js            # Datum/Zeit-Formatierung
│   ├── validators.js           # Input-Validierung
│   ├── responseHelpers.js      # Response/Redirect-Helper
│   ├── password.js             # Passwort-Hashing
│   ├── db.js                   # MySQL Connection Pool
│   └── README.md               # Utils-Dokumentation
│
├── middleware/                 # Express-Middleware
│   ├── auth.js                 # Authentifizierungs-Check
│   ├── isAdmin.js              # Admin-Berechtigungs-Check
│   ├── nftables.js             # nftables-Konfig-Generator
│   └── rateLimiter.js          # Rate-Limiting-Konfiguration
│
├── models/                     # Datenbank-Models
│   ├── user.js                 # User-CRUD-Operationen
│   ├── vlan.js                 # VLAN-CRUD-Operationen
│   └── whitelist.js            # Whitelist-CRUD-Operationen
│
├── routes/                     # Express-Routen
│   ├── index.js                # Public Routes
│   ├── auth.js                 # Login/Logout
│   └── secured/                # Geschützte Routes
│       ├── index.js            # Secured-Router
│       ├── dashboard.js        # User-Dashboard
│       ├── user.js             # User-Verwaltung
│       ├── vlan.js             # VLAN-Verwaltung
│       ├── whitelist.js        # Whitelist-Verwaltung
│       └── nftables.js         # nftables-Management
│
├── views/                      # Pug-Templates
│   ├── layout.pug              # Basis-Layout
│   ├── login.pug               # Login-Seite
│   ├── dashboard.pug           # User-Dashboard
│   ├── error.pug               # Error-Seite
│   ├── partials/               # Wiederverwendbare Komponenten
│   │   ├── menu.pug            # Navigation
│   │   └── modal.pug           # Modal-Dialog
│   ├── user/                   # User-Views
│   ├── vlan/                   # VLAN-Views
│   ├── whitelist/              # Whitelist-Views
│   └── nftables/               # nftables-Views
│
└── public/                     # Statische Dateien
    ├── stylesheets/
    │   └── style.css           # Haupt-Stylesheet (780 Zeilen)
    ├── javascripts/
    │   └── modal.js            # Modal-System
    └── images/                 # Bilder/Logos
```

---

## 🚀 Installation

### Voraussetzungen

- Node.js >= 16.0.0
- MySQL >= 8.0
- Linux-System (optional, für nftables)
- Git

### Schritt 1: Repository klonen

```bash
cd /gewünschtes/verzeichnis
git clone <repository-url>
cd zB
```

### Schritt 2: Dependencies installieren

```bash
npm install
```

### Schritt 3: Datenbank einrichten

```sql
-- MySQL-Datenbank erstellen
CREATE DATABASE provisioning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE provisioning;

-- User-Tabelle
CREATE TABLE `User` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nom` VARCHAR(100),
  `prenom` VARCHAR(100),
  `role_id` INT NOT NULL DEFAULT 2,
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role-Tabelle
CREATE TABLE `Role` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO `Role` (`id`, `name`) VALUES (1, 'Admin'), (2, 'Lehrer');

-- VLAN-Tabelle
CREATE TABLE `Vlan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `ip` VARCHAR(50) NOT NULL,
  `room_name` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Whitelist-Tabelle
CREATE TABLE `Whitelist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `name` VARCHAR(255) NOT NULL,
  `url` VARCHAR(500) NOT NULL,
  `start` DATETIME,
  `end` DATETIME,
  `rythm` VARCHAR(50),
  `unit` VARCHAR(50),
  `vlan_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vlan_id`) REFERENCES `Vlan`(`id`) ON DELETE CASCADE
);

-- Admin-User erstellen (Passwort: admin123)
-- Hinweis: Passwort nach erstem Login ändern!
INSERT INTO `User` (`email`, `password`, `nom`, `prenom`, `role_id`) 
VALUES ('admin@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz...', 'Admin', 'User', 1);
```

### Schritt 4: Umgebungsvariablen konfigurieren

Erstelle eine `.env`-Datei im Projektverzeichnis:

```bash
# .env-Beispiel
NODE_ENV=development

# Datenbank-Konfiguration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=dein_passwort
DB_NAME=provisioning
DB_PORT=3306
DB_CONN_LIMIT=10

# Session-Secret (generiere einen sicheren Wert!)
SESSION_SECRET=generiere_einen_sehr_langen_zufaelligen_string_hier

# Server-Port (optional)
PORT=3000
```

**Session-Secret generieren:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Schritt 5: Anwendung starten

```bash
npm start
```

Die Anwendung läuft nun auf `http://localhost:3000`

---

## ⚙️ Konfiguration

### Umgebungsvariablen

| Variable | Beschreibung | Standard | Erforderlich |
|----------|--------------|----------|--------------|
| `NODE_ENV` | Umgebung (development/production) | development | Nein |
| `DB_HOST` | MySQL-Host | localhost | Ja |
| `DB_USER` | MySQL-Benutzer | root | Ja |
| `DB_PASSWORD` | MySQL-Passwort | - | Ja |
| `DB_NAME` | Datenbank-Name | provisioning | Ja |
| `DB_PORT` | MySQL-Port | 3306 | Nein |
| `DB_CONN_LIMIT` | Connection-Pool-Limit | 10 | Nein |
| `SESSION_SECRET` | Session-Verschlüsselung | auto-generiert | **Ja (Produktion)** |
| `PORT` | Server-Port | 3000 | Nein |

### Sicherheits-Konfiguration

#### Session-Einstellungen
```javascript
// app.js
{
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS-only in Produktion
    httpOnly: true,                                // Kein JavaScript-Zugriff
    maxAge: 1000 * 60 * 60 * 24,                  // 24 Stunden
    sameSite: 'strict'                             // CSRF-Schutz
  }
}
```

#### Rate-Limiting
```javascript
// middleware/rateLimiter.js
loginLimiter: 5 Versuche / 15 Minuten
apiLimiter: 100 Requests / 15 Minuten
nftablesLimiter: 10 Anwendungen / 5 Minuten
```

---

## 📖 Verwendung

### 1️⃣ Erster Login

1. Öffne `http://localhost:3000`
2. Login mit Admin-Credentials
3. **Wichtig:** Ändere sofort das Admin-Passwort!

### 2️⃣ VLAN erstellen

1. Navigation: **Räume** (Admin-Menü)
2. Klick auf **[+]**-Button
3. Eingabe:
   - **Name**: z.B. "VLAN10"
   - **IP**: z.B. "192.168.10.0/24"
   - **Raum**: z.B. "Informatikraum 101"
4. **Speichern**

### 3️⃣ Benutzer anlegen

1. Navigation: **Benutzer**
2. Klick auf **[+]**-Button
3. Eingabe:
   - Email
   - Vor- und Nachname
   - Passwort
   - Rolle (Admin/Lehrer)
4. **Registrieren**

#### 📸 Benutzerverwaltung im Detail

![Benutzerverwaltung](public/images/screenshots/benutzerverwaltung.png)

Die Benutzerverwaltung bietet eine übersichtliche Tabelle mit folgenden Funktionen:

**Spalten:**
- **ID**: Eindeutige Datenbank-ID des Benutzers
- **EMAIL**: Login-Email (muss unique sein)
- **VORNAME**: Vorname des Benutzers
- **NACHNAME**: Nachname des Benutzers
- **ROLLE**: 
  - 🟡 **Admin** (gelbes Badge): Voller Zugriff auf alle Funktionen
  - 🟢 **Lehrer** (graues Badge): Zugriff nur auf Dashboard und eigene Whitelists
- **AKTIV**: 
  - 🟢 **Aktiv** (grünes Badge): User kann sich einloggen
  - 🔴 **Inaktiv** (rotes Badge): Login gesperrt
- **AKTIONEN**: 
  - 🟢 **Bearbeiten** (Telefon-Icon): Email, Name, Rolle, Status ändern
  - 🔴 **Löschen** (X-Icon): User permanent entfernen (mit Bestätigungs-Modal)

**Funktionen:**

1. **Neuen Benutzer erstellen**
   - Klick auf grünen **[+]**-Button (oben rechts)
   - Formular mit Feldern: Email, Passwort, Vorname, Nachname, Rolle
   - Passwort wird automatisch mit bcrypt gehasht (10 Salt-Rounds)
   - Email-Validierung (muss unique sein)

2. **Benutzer bearbeiten**
   - Klick auf grünen **Telefon-Button**
   - Ändere Email, Namen, Rolle oder Aktiv-Status
   - Passwort optional ändern (leer lassen = keine Änderung)
   - CSRF-geschützt

3. **Benutzer löschen**
   - Klick auf roten **X-Button**
   - Bestätigungs-Modal: "Möchten Sie diesen Benutzer wirklich löschen?"
   - **CASCADE DELETE**: Alle Whitelists des Users werden automatisch gelöscht
   - AJAX-Request mit CSRF-Token
   - Zeile verschwindet nach erfolgreicher Löschung

4. **Status-Badges**
   - Rolle wird farbig hervorgehoben:
     - **Admin**: Gelber Hintergrund (#ffc107)
     - **Lehrer**: Grauer Hintergrund
   - Aktiv-Status:
     - **Aktiv**: Grüner Hintergrund
     - **Inaktiv**: Roter Hintergrund (nicht im Screenshot sichtbar)

5. **Sicherheit**
   - Nur Admins haben Zugriff auf diese Seite (`isAdmin` Middleware)
   - Alle Aktionen CSRF-geschützt
   - Input-Validierung: Email-Format, required Fields
   - SQL-Injection-Schutz: Prepared Statements

6. **Responsive Design**
   - Tabelle scrollbar auf kleinen Bildschirmen
   - Buttons nebeneinander mit Flex-Layout (8px Gap)
   - Icons für bessere UX (Font Awesome oder Unicode)

**Technische Details:**
- **Route**: `/secured/user` (GET für Liste, POST für Aktionen)
- **Model**: `models/user.js` (CRUD-Operationen)
- **View**: `views/user/user_list.pug`
- **CSS**: `.users table` und `.action-buttons` Styles

### 4️⃣ Whitelist-Eintrag erstellen

**Als Lehrer (eigene Whitelists):**
1. **Dashboard** → **[+]** bei "Meine Whitelists"
2. Eingabe:
   - **Name**: Beschreibender Name
   - **URL**: z.B. "wikipedia.org" oder "https://github.com"
   - **Start**: Optional (Aktivierungszeitpunkt)
   - **Ende**: Optional (Deaktivierungszeitpunkt)
3. **Speichern**

**Als Admin (globale Whitelists):**
1. Navigation: **Whitelists**
2. Zusätzliche Optionen:
   - **Benutzer**: Spezifischem User zuordnen
   - **VLAN**: VLAN-Auswahl

### 5️⃣ nftables-Konfiguration anwenden (nur Linux)

1. Navigation: **nftables**
2. **Vorschau** → Zeigt generierte Config
3. **Konfiguration anwenden** → Aktiviert Regeln
4. **Löschen** → Entfernt alle Regeln

---

## 🔒 Sicherheit

### Implementierte Sicherheitsmaßnahmen

#### ✅ Authentifizierung & Autorisierung
- Passwort-Hashing mit bcrypt (Salt-Rounds: 10)
- Session-basierte Authentifizierung
- Rollenbasierte Zugriffskontrolle (RBAC)
- Middleware-Checks auf allen geschützten Routes

#### ✅ Input-Validierung
```javascript
// Alle Inputs werden validiert:
- URLs: isValidUrl() - Protokoll, Hostname, Domain
- Emails: isValidEmail() - RFC 5322 Pattern
- IPs: isValidIp() - IPv4/IPv6 Validation
- VLAN-Namen: isValidVlanName() - Alphanumerisch
- XSS-Protection: sanitizeString() - Entfernt < >
```

#### ✅ CSRF-Schutz
- Token in allen Forms (`<input type="hidden" name="_csrf">`)
- Session-basierte Token-Generierung
- AJAX-Requests mit CSRF-Token-Header

#### ✅ SQL-Injection-Schutz
- Parameterisierte Queries überall
- mysql2 Prepared Statements
- Keine String-Konkatenation in SQL

#### ✅ Session-Sicherheit
- httpOnly: true (kein JS-Zugriff)
- sameSite: 'strict' (CSRF-Schutz)
- secure: true in Produktion (HTTPS-only)
- 24h Session-Timeout

#### ✅ Rate Limiting
- Login: Max 5 Versuche / 15 Min
- API: Max 100 Requests / 15 Min
- nftables: Max 10 Anwendungen / 5 Min

#### ✅ Sensitive Data Protection
- .gitignore schützt .env, node_modules, logs
- Secrets in Environment Variables
- Keine Credentials im Code

### Best Practices

**Produktion-Checkliste:**
- [ ] `NODE_ENV=production` setzen
- [ ] Starkes `SESSION_SECRET` (≥64 Zeichen)
- [ ] HTTPS aktivieren (secure cookies)
- [ ] Firewall-Regeln konfigurieren
- [ ] Regelmäßige Updates (npm audit)
- [ ] Backup-Strategy für DB
- [ ] Logging aktivieren
- [ ] Admin-Passwort ändern

---

## 📡 API Dokumentation

### Authentifizierung

#### POST `/auth/login`
```javascript
Body: { email, password }
Response: Redirect to /auth/dashboard
Rate Limit: 5/15min
CSRF: Required
```

#### GET `/auth/logout`
```javascript
Response: Redirect to /auth/login
Session: Destroyed
```

### Dashboard (Authentifiziert)

#### GET `/auth/dashboard`
```javascript
Response: {
  user: { id, email, role, role_name },
  userVlan: { id, name, ip, room_name },
  whitelists: [ { id, name, url, start_display, end_display, vlan_name } ],
  trafficBlocked: boolean
}
```

#### POST `/auth/dashboard/toggle-traffic`
```javascript
Body: { _csrf }
Response: JSON { success: true }
Session: trafficBlocked toggled
```

### Whitelist-Management (Admin)

#### GET `/secured/whitelist`
```javascript
Response: Liste aller Whitelists mit User/VLAN-Info
Auth: Admin only
```

#### POST `/secured/whitelist/add`
```javascript
Body: { 
  name, url, 
  start?, end?, 
  rythm?, unit?,
  user_id?, vlan_id?,
  _csrf 
}
Validation: URL, Name required
Response: Redirect with success/error
```

#### POST `/secured/whitelist/delete/:id`
```javascript
Response: JSON { success: true }
Auth: Admin oder Owner
CSRF: Header
```

### VLAN-Management (Admin)

#### GET `/secured/vlan`
```javascript
Response: Liste aller VLANs
Auth: Admin only
```

#### POST `/secured/vlan/add`
```javascript
Body: { name, ip, room_name, _csrf }
Validation: 
  - name: alphanumeric
  - ip: IPv4/IPv6
Response: Redirect to /secured/vlan
```

#### POST `/secured/vlan/delete/:id`
```javascript
Response: JSON { success, data: { id }, message }
Auth: Admin only
```

### User-Management (Admin)

#### POST `/secured/user/register`
```javascript
Body: { email, password, nom, prenom, role, _csrf }
Validation: Email format
Response: Redirect with success/error
```

### nftables (Admin, Linux only)

#### GET `/secured/nftables/status`
```javascript
Response: {
  activeWhitelists: [...],
  currentConfig: string | null,
  hasConfig: boolean
}
```

#### POST `/secured/nftables/apply`
```javascript
Body: { _csrf }
Action: Generiert und wendet nftables-Config an
Rate Limit: 10/5min
```

---

## 🛠️ Entwicklung

### Projekt-Setup für Entwicklung

```bash
# Repository klonen
git clone <repo>
cd zB

# Dependencies installieren
npm install

# .env konfigurieren
cp .env.example .env
# Bearbeite .env mit deinen Werten

# Datenbank-Migration ausführen  
# (siehe Installation Schritt 3)

# Development-Server starten
npm start

# Oder mit nodemon (auto-reload)
npm install -g nodemon
nodemon ./bin/www
```

### Code-Struktur-Richtlinien

#### 1. **Utility-Funktionen verwenden**
```javascript
// ❌ Nicht so:
const date = new Date(dateString);
const formatted = `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;

// ✅ Sondern so:
const { formatDatetimeDisplay } = require('../../lib/dateUtils');
const formatted = formatDatetimeDisplay(dateString);
```

#### 2. **Input validieren**
```javascript
const { isValidUrl, isValidEmail, sanitizeString } = require('../../lib/validators');

const name = sanitizeString(req.body.name);
if (!isValidUrl(url)) {
  return redirectWithError(res, '/add', 'Ungültige URL');
}
```

#### 3. **Response-Helper nutzen**
```javascript
const { redirectWithSuccess, renderError } = require('../../lib/responseHelpers');

// Erfolg
redirectWithSuccess(res, '/dashboard', 'Gespeichert');

// Fehler
renderError(res, 'Nicht gefunden', 404, req);
```

#### 4. **Konsistente Error-Handling**
```javascript
router.post('/route', async (req, res) => {
  try {
    // ... Logik
    redirectWithSuccess(res, '/success', 'Erfolg');
  } catch (err) {
    console.error('Fehler:', err);
    renderError(res, 'Serverfehler', 500, req);
  }
});
```

### Testing

#### Manuelle Tests
```bash
# Login testen
curl -X POST http://localhost:3000/auth/login \
  -d "email=admin@example.com&password=admin123" \
  -c cookies.txt

# Authentifizierte Route testen
curl -b cookies.txt http://localhost:3000/auth/dashboard

# VLAN erstellen (mit CSRF-Token)
curl -X POST http://localhost:3000/secured/vlan/add \
  -b cookies.txt \
  -F "name=VLAN10" \
  -F "ip=192.168.10.1" \
  -F "room_name=Raum 101" \
  -F "_csrf=<token>"
```

#### Unit-Tests (Empfohlen, noch nicht implementiert)
```bash
npm install --save-dev jest supertest
npm test
```

### Code-Quality-Tools

```bash
# ESLint (empfohlen)
npm install --save-dev eslint
npx eslint routes/**/*.js

# Security Audit
npm audit
npm audit fix

# Dependency Updates checken
npm outdated
```

---

## 🐛 Troubleshooting

### Häufige Probleme

#### 1. **Login funktioniert nicht**
```
Symptom: "Ungültiger Benutzer oder Passwort"

Lösungen:
✓ Prüfe DB-Connection: mysql -u root -p provisioning
✓ Verifiziere User existiert: SELECT * FROM User WHERE email='...';
✓ Passwort neu hashen:
  const bcrypt = require('bcrypt');
  const hash = await bcrypt.hash('neuespasswort', 10);
  UPDATE User SET password='hash...' WHERE id=1;
✓ Prüfe role_id in DB (Admin=1, Lehrer=2)
```

#### 2. **CSRF-Token Fehler 403**
```
Symptom: "Ungültiges Sicherheitstoken"

Lösungen:
✓ Prüfe Form hat: input(type='hidden', name='_csrf', value=csrfToken)
✓ Prüfe AJAX hat Header: 'CSRF-Token': csrfToken
✓ Session nicht abgelaufen? (24h Timeout)
✓ Cookie-Settings in Browser erlaubt?
```

#### 3. **Datenbank-Connection Fehler**
```
Symptom: "MySQL Verbindung fehlgeschlagen"

Lösungen:
✓ MySQL-Server läuft: sudo systemctl status mysql
✓ .env Credentials korrekt
✓ DB existiert: CREATE DATABASE provisioning;
✓ User hat Rechte: GRANT ALL ON provisioning.* TO 'user'@'localhost';
✓ Firewall erlaubt Port 3306
```

#### 4. **nftables funktioniert nicht**
```
Symptom: "nftables-Befehle schlagen fehl"

Lösungen:
✓ Nur auf Linux: os.platform() === 'linux'
✓ nftables installiert: sudo apt install nftables
✓ Root-Rechte nötig: sudo node ./bin/www
✓ Oder: sudo setcap cap_net_admin+ep $(which node)
```

#### 5. **Session-Verlust nach Server-Neustart**
```
Symptom: User werden ausgeloggt

Erklärung: Sessions im Memory (default)

Lösung für Persistenz:
npm install connect-session-sequelize
// Konfiguriere Session-Store in app.js
```

#### 6. **Rate-Limit blockiert legitimen Traffic**
```
Symptom: "Zu viele Anfragen"

Temporäre Lösung:
✓ Warte 15 Minuten
✓ Limit in middleware/rateLimiter.js erhöhen
✓ IP-Whitelisting implementieren
```

### Logs überprüfen

```bash
# Application Logs
tail -f logs/app.log

# MySQL Logs
sudo tail -f /var/log/mysql/error.log

# Node.js Process
ps aux | grep node

# Port-Binding prüfen
sudo lsof -i :3000
```

---

## 📝 Changelog

### Version 0.0.0 (Aktuell) - 28. März 2026

**Features:**
- ✅ Vollständiges User-Management mit Rollen
- ✅ VLAN-Verwaltung mit IP-Validierung
- ✅ Whitelist-Management mit Zeitfenstern
- ✅ nftables-Integration für Linux
- ✅ Dashboard mit Traffic-Toggle
- ✅ Responsive Web-UI

**Sicherheit:**
- ✅ CSRF-Schutz implementiert
- ✅ Rate Limiting aktiviert
- ✅ Session-Härtung (httpOnly, sameSite, secure)
- ✅ Input-Validierung für alle Forms
- ✅ XSS-Schutz via Sanitization
- ✅ .gitignore für Credentials

**Code-Qualität:**
- ✅ Utils ausgelagert (dateUtils, validators, responseHelpers)
- ✅ Code-Duplikation eliminiert
- ✅ Konsistente Error-Handling
- ✅ JSDoc-Dokumentation
- ✅ Refactoring nach Best Practices

**Bekannte Limitierungen:**
- ⚠️ Sessions nicht persistent (Memory-Store)
- ⚠️ Keine Unit-Tests
- ⚠️ Keine Logging-Bibliothek (nur console.log)
- ⚠️ nftables nur für Linux

---

## 📄 Lizenz

Dieses Projekt ist privat und nicht für die öffentliche Verwendung lizenziert.

---

## 👥 Autoren & Kontakt

**Entwicklung:**
- Entwicklungsteam zB

**Support:**
- Für Fragen: admin@zb.ch
- Issue-Tracker: [GitHub Issues]

---

## 🔗 Nützliche Links

- [Express.js Dokumentation](https://expressjs.com/)
- [Pug Template Engine](https://pugjs.org/)
- [MySQL2 Docs](https://github.com/sidorares/node-mysql2)
- [nftables Wiki](https://wiki.nftables.org/)
- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 📚 Weiterführende Dokumentation

- **Utility-Funktionen**: Siehe [lib/README.md](lib/README.md)
- **Refactoring-Historie**: Siehe [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)
- **nftables-Setup**: Siehe [NFTABLES_SETUP.md](NFTABLES_SETUP.md)
- **API-Endpoints**: Siehe API-Dokumentation oben

---

**Zuletzt aktualisiert:** 28. März 2026  
**Version:** 0.0.0  
**Status:** ✅ Produktionsbereit (mit Empfehlungen)
