# 🏗️ Gatekeeper - Architektur-Dokumentation

## Inhaltsverzeichnis

1. [System-Übersicht](#system-übersicht)
2. [Architektur-Prinzipien](#architektur-prinzipien)
3. [Schichten-Architektur](#schichten-architektur)
4. [Komponenten-Diagramm](#komponenten-diagramm)
5. [Datenfluss-Diagramme](#datenfluss-diagramme)
6. [Datenbankschema](#datenbankschema)
7. [Request-Lifecycle](#request-lifecycle)
8. [Authentifizierungs-Flow](#authentifizierungs-flow)
9. [Modul-Abhängigkeiten](#modul-abhängigkeiten)
10. [Skalierungs-Strategie](#skalierungs-strategie)

---

## System-Übersicht

### Zweck

Gatekeeper ist ein Web-basiertes Verwaltungssystem für VLAN-spezifische URL-Whitelists mit automatischer nftables-Firewall-Integration für Linux-Systeme.

### High-Level Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser (Client)                    │
│                 HTML/CSS/JS + Pug Templates                 │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (Production)
                         │ HTTP (Development)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Web Server                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Middleware-Chain                         │  │
│  │  Morgan → Body-Parser → Cookie → Session → CSRF     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Route-Handler                            │  │
│  │  Public → Auth → Secured (Admin, User-specific)     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Business Logic Layer                     │  │
│  │  Models (user.js, vlan.js, whitelist.js)            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ MySQL Protocol
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL Database                           │
│  User → Role → Vlan → Whitelist                            │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼ (Optional, Linux only)
┌─────────────────────────────────────────────────────────────┐
│                 Linux nftables Firewall                     │
│  Generated Config → Applied via Shell Exec                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Architektur-Prinzipien

### Design-Philosophie

1. **Separation of Concerns**
   - Presentation (Views) ≠ Business Logic (Models) ≠ Request Handling (Routes)

2. **DRY (Don't Repeat Yourself)**
   - Utility-Funktionen in `lib/` zentralisiert
   - Middleware für wiederverwendbare Logik

3. **Security by Design**
   - Defense in Depth: Mehrere Security-Layer
   - Fail-Safe Defaults: Kein Zugriff ohne explizite Autorisierung

4. **Explicit over Implicit**
   - CSRF-Token explizit in jedem Form
   - Session-Check in jedem geschützten Route

5. **Stateless Architecture (teilweise)**
   - Sessions serverseitig (nicht JWT)
   - Stateless API-Design möglich

---

## Schichten-Architektur

### MVC-Pattern mit Erweiterungen

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer (View)                                  │
│  ├── views/ (Pug Templates)                                 │
│  ├── public/ (CSS, JS, Images)                              │
│  └── Verantwortlich für: HTML-Rendering, User-Interaktion   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Controller Layer (Routes)                                  │
│  ├── routes/index.js (Public)                               │
│  ├── routes/auth.js (Login/Logout)                          │
│  ├── routes/secured/*.js (Geschützte Routen)                │
│  └── Verantwortlich für: Request-Validierung, Response      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Middleware Layer                                           │
│  ├── middleware/auth.js (Authentifizierung)                 │
│  ├── middleware/isAdmin.js (Autorisierung)                  │
│  ├── middleware/rateLimiter.js (DDoS-Schutz)                │
│  ├── middleware/nftables.js (Konfig-Generator)              │
│  └── Verantwortlich für: Cross-Cutting Concerns             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Business Logic Layer (Models)                              │
│  ├── models/user.js (CRUD)                                  │
│  ├── models/vlan.js (CRUD)                                  │
│  ├── models/whitelist.js (CRUD)                             │
│  └── Verantwortlich für: Datenbank-Operationen              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Utility Layer                                              │
│  ├── lib/db.js (Connection Pool)                            │
│  ├── lib/dateUtils.js (Datum-Formatierung)                  │
│  ├── lib/validators.js (Input-Validierung)                  │
│  ├── lib/responseHelpers.js (Redirect/Render)               │
│  ├── lib/password.js (bcrypt)                               │
│  └── Verantwortlich für: Wiederverwendbare Funktionen       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Data Access Layer                                          │
│  ├── MySQL Database (User, Role, Vlan, Whitelist)          │
│  └── Verantwortlich für: Persistenz                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponenten-Diagramm

### Kern-Komponenten & Abhängigkeiten

```
┌────────────────────────────────────────────────────┐
│                    app.js                          │
│  ┌──────────────────────────────────────────────┐ │
│  │  Express-App-Initialization                  │ │
│  │  ├── Middleware-Setup                        │ │
│  │  ├── Route-Mounting                          │ │
│  │  ├── Error-Handling                          │ │
│  │  └── Session + CSRF Config                   │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────┬───────────────────────────────┘
                     │
        ┌────────────┼───────────┐
        │            │           │
        ▼            ▼           ▼
   ┌────────┐  ┌────────┐  ┌──────────┐
   │Routes  │  │Models  │  │Middleware│
   └────┬───┘  └────┬───┘  └─────┬────┘
        │           │            │
        │           │            │
        ▼           ▼            ▼
   ┌─────────────────────────────────┐
   │      lib/ (Utilities)           │
   │  ├── dateUtils.js               │
   │  ├── validators.js              │
   │  ├── responseHelpers.js         │
   │  ├── password.js                │
   │  └── db.js                      │
   └────────────┬────────────────────┘
                │
                ▼
   ┌─────────────────────────────────┐
   │       MySQL Database            │
   └─────────────────────────────────┘
```

### Route-Hierarchie

```
app.js
├── / (routes/index.js)
│   └── GET / → Homepage
│
├── /auth (routes/auth.js)
│   ├── GET  /login → Login-Form
│   ├── POST /login → Authentifizierung (Rate-Limited)
│   ├── GET  /logout → Session-Destroy
│   └── /secured (routes/secured/index.js) *requireAuth*
│       ├── GET  /dashboard → User-Dashboard
│       ├── POST /dashboard/toggle-traffic → Traffic-Toggle
│       │
│       ├── /user *isAdmin*
│       │   ├── GET  / → User-Liste
│       │   ├── POST /register → User-Registrierung
│       │   ├── POST /delete/:id → User-Löschen
│       │   └── POST /edit/:id → User-Bearbeiten
│       │
│       ├── /vlan *isAdmin*
│       │   ├── GET  / → VLAN-Liste
│       │   ├── POST /add → VLAN-Erstellen
│       │   ├── POST /delete/:id → VLAN-Löschen
│       │   └── POST /edit/:id → VLAN-Bearbeiten
│       │
│       ├── /whitelist *isAdmin*
│       │   ├── GET  / → Whitelist-Admin-Ansicht
│       │   ├── POST /add → Whitelist-Erstellen
│       │   ├── POST /delete/:id → Whitelist-Löschen
│       │   └── POST /edit/:id → Whitelist-Bearbeiten
│       │
│       └── /nftables *isAdmin* (Linux only)
│           ├── GET  / → nftables-Übersicht
│           ├── GET  /status → Config-Status (JSON)
│           ├── POST /apply → Config anwenden (Rate-Limited)
│           └── POST /delete → Alle Regeln löschen
```

---

## Datenfluss-Diagramme

### 1. Login-Flow

```
User (Browser)
    │
    │ 1. GET /auth/login
    ▼
routes/auth.js
    │
    │ 2. Render login.pug (mit CSRF-Token)
    ▼
User (Browser)
    │
    │ 3. POST /auth/login (email, password, _csrf)
    ▼
middleware/rateLimiter.js (loginLimiter)
    │
    │ 4. Check: < 5 Versuche in 15min?
    ▼ Ja
routes/auth.js
    │
    │ 5. Validate CSRF-Token
    ▼ Valid
models/user.js
    │
    │ 6. getByEmail(email)
    ▼
MySQL Database
    │
    │ 7. SELECT * FROM User WHERE email = ?
    ▼
lib/password.js
    │
    │ 8. verifyPassword(input, dbHash)
    ▼ Match
routes/auth.js
    │
    │ 9. req.session.user = { id, email, role, role_name }
    ▼ 10. Redirect → /auth/dashboard
User (Browser)
```

### 2. VLAN-Erstellen-Flow (Admin)

```
Admin (Browser)
    │
    │ 1. GET /secured/vlan (Auth + isAdmin)
    ▼
middleware/auth.js
    │
    │ 2. Check: req.session.user exists?
    ▼ Ja
middleware/isAdmin.js
    │
    │ 3. Check: req.session.user.role === 1?
    ▼ Ja
routes/secured/vlan.js
    │
    │ 4. Render vlan_list.pug (Liste + Add-Form)
    ▼
Admin (Browser)
    │
    │ 5. POST /secured/vlan/add (name, ip, room_name, _csrf)
    ▼
routes/secured/vlan.js
    │
    │ 6. Validate CSRF + Input
    │    ├─ sanitizeString(name)
    │    ├─ isValidVlanName(name)
    │    └─ isValidIp(ip)
    ▼ Valid
models/vlan.js
    │
    │ 7. add(name, ip, room_name)
    ▼
MySQL Database
    │
    │ 8. INSERT INTO Vlan VALUES (?, ?, ?)
    ▼ Success
routes/secured/vlan.js
    │
    │ 9. redirectWithSuccess('/secured/vlan', 'VLAN erstellt')
    ▼
Admin (Browser)
```

### 3. nftables-Apply-Flow (Linux Admin)

```
Admin (Browser)
    │
    │ 1. POST /secured/nftables/apply (_csrf)
    ▼
middleware/rateLimiter.js (nftablesLimiter)
    │
    │ 2. Check: < 10 Anwendungen in 5min?
    ▼ Ja
middleware/nftables.js
    │
    │ 3. getActiveWhitelists()
    ▼
models/whitelist.js
    │
    │ 4. SELECT ... WHERE start <= NOW() AND end >= NOW()
    ▼
MySQL Database
    │
    │ 5. Return aktive Whitelists
    ▼
middleware/nftables.js
    │
    │ 6. DNS-Auflösung für URLs
    │    └─ dns.resolve4(url) / dns.resolve6(url)
    ▼
middleware/nftables.js
    │
    │ 7. Generiere nftables-Config
    │    add element inet filter allowed_ips_vlan10 { 1.2.3.4 }
    ▼
middleware/nftables.js
    │
    │ 8. exec('nft -f /tmp/whitelist.conf')
    ▼
Linux nftables
    │
    │ 9. Apply Firewall-Regeln
    ▼ Success
routes/secured/nftables.js
    │
    │ 10. redirectWithSuccess('/secured/nftables', 'Konfiguration angewendet')
    ▼
Admin (Browser)
```

---

## Datenbankschema

### Entity-Relationship-Diagramm

```
┌─────────────────────┐
│       Role          │
│─────────────────────│
│ PK  id (INT)        │
│     name (VARCHAR)  │  ┌──────────────────────────────┐
└──────┬──────────────┘  │  1    role_id    n           │
       │                 │                               │
       │ 1:n             │                               │
       │                 ▼                               │
┌──────▼──────────────┐  ┌───────────────────────────┐  │
│       User          │  │        Whitelist          │  │
│─────────────────────│  │───────────────────────────│  │
│ PK  id              │  │ PK  id                    │  │
│     email *unique*  │◀─┤ FK  user_id (nullable)    │  │
│     password (hash) │ n│     name                  │  │
│     nom             │  │     url                   │  │
│     prenom          │  │     start (DATETIME)      │  │
│ FK  role_id         │  │     end (DATETIME)        │  │
│     active (BOOL)   │  │     rythm                 │  │
│     created_at      │  │     unit                  │  │
└─────────────────────┘  │ FK  vlan_id               │  │
                         │     created_at            │  │
                         └──────────┬────────────────┘  │
                                    │ n                 │
                                    │                   │
┌─────────────────────┐             │ 1                 │
│       Vlan          │◀────────────┘                   │
│─────────────────────│                                 │
│ PK  id              │                                 │
│     name            │◀────────────────────────────────┘
│     ip (CIDR)       │  n
│     room_name       │
│     created_at      │
└─────────────────────┘
```

### Tabellen-Details

#### User
```sql
CREATE TABLE `User` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,  -- bcrypt-Hash
  `nom` VARCHAR(100),
  `prenom` VARCHAR(100),
  `role_id` INT NOT NULL DEFAULT 2,  -- 1=Admin, 2=Lehrer
  `active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `Role`(`id`)
);
```

#### Vlan
```sql
CREATE TABLE `Vlan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,      -- z.B. "VLAN10"
  `ip` VARCHAR(50) NOT NULL,         -- z.B. "192.168.10.0/24"
  `room_name` VARCHAR(255),          -- z.B. "Informatikraum 101"
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Whitelist
```sql
CREATE TABLE `Whitelist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,                     -- NULL = globale Whitelist (Admin)
  `name` VARCHAR(255) NOT NULL,
  `url` VARCHAR(500) NOT NULL,       -- z.B. "wikipedia.org"
  `start` DATETIME,                  -- Aktivierungszeitpunkt (nullable)
  `end` DATETIME,                    -- Deaktivierungszeitpunkt (nullable)
  `rythm` VARCHAR(50),               -- Zukünftig: "weekly", "daily"
  `unit` VARCHAR(50),                -- Zukünftig: "hours", "days"
  `vlan_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vlan_id`) REFERENCES `Vlan`(`id`) ON DELETE CASCADE
);
```

#### Role (Lookup-Tabelle)
```sql
CREATE TABLE `Role` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO `Role` (`id`, `name`) VALUES (1, 'Admin'), (2, 'Lehrer');
```

### Datenbank-Indizes (Empfohlen)

```sql
-- Schnelle User-Lookup bei Login
CREATE INDEX idx_user_email ON User(email);

-- Schnelle Whitelist-Lookup nach User
CREATE INDEX idx_whitelist_user ON Whitelist(user_id);

-- Schnelle Whitelist-Lookup nach VLAN
CREATE INDEX idx_whitelist_vlan ON Whitelist(vlan_id);

-- Schnelle Zeitfenster-Abfragen
CREATE INDEX idx_whitelist_dates ON Whitelist(start, end);
```

---

## Request-Lifecycle

### Vollständiger Request-Durchlauf

```
1. Browser Request
   └─ HTTP GET/POST → http://localhost:3000/secured/vlan

2. Express Middleware-Chain (Reihenfolge wichtig!)
   ├─ morgan               → Logging: "GET /secured/vlan 200 15ms"
   ├─ express.json         → Parse JSON-Body
   ├─ express.urlencoded   → Parse Form-Data
   ├─ cookieParser         → Parse Cookies → req.cookies
   ├─ express.static       → Serve /public/* (CSS, JS, Images)
   ├─ session              → Load Session → req.session
   ├─ csrf                 → Validate CSRF-Token → 403 bei Fehler
   └─ CSRF-Token-Injector  → res.locals.csrfToken = req.csrfToken()

3. Route-Matching
   └─ Express Router → Findet passende Route

4. Route-spezifische Middleware
   ├─ requireAuth (auth.js)
   │  └─ Prüft req.session.user → Redirect bei Fehler
   ├─ isAdmin (isAdmin.js)
   │  └─ Prüft req.session.user.role === 1 → 403 bei Fehler
   └─ rateLimiter (spezifisch)
      └─ Prüft Request-Count → 429 bei Überschreitung

5. Route-Handler
   ├─ Input-Validierung (lib/validators.js)
   ├─ Business-Logic (models/*.js)
   └─ Response-Generierung

6. Response
   ├─ res.render('view.pug', data) → HTML
   ├─ res.json({ success: true }) → JSON
   ├─ res.redirect('/path') → 302 Redirect
   └─ res.status(404).render('error') → Error-Page

7. Error-Handling Middleware (app.js)
   └─ Catch-All für unbehandelte Fehler → 500 Error-Page
```

### Middleware-Execution-Order (Kritisch!)

```javascript
// app.js (vereinfacht)
app.use(morgan('dev'));              // 1. Logging zuerst
app.use(express.json());             // 2. Body-Parsing
app.use(cookieParser());             // 3. Cookie-Parsing
app.use(session({ ... }));           // 4. Session (benötigt Cookies)
app.use(csrf({ cookie: false }));    // 5. CSRF (benötigt Session)
app.use((req,res,next)=>{...});      // 6. CSRF-Token-Injector

// Route-Mounting (nach Middleware!)
app.use('/', indexRouter);           // Public Routes
app.use('/auth', authRouter);        // Auth Routes (Login)

// 404-Handler (nach allen Routes)
app.use((req, res, next) => { ... });

// Error-Handler (ganz am Ende)
app.use((err, req, res, next) => { ... });
```

**Wichtig:**
- Session **muss** vor CSRF kommen (CSRF nutzt Session)
- Route-Handler **müssen** nach Middleware-Setup kommen
- Error-Handler **muss** ganz am Ende sein

---

## Authentifizierungs-Flow

### Session-basierte Authentifizierung

```
┌─────────────────────────────────────────────────────────┐
│  Schritt 1: Login-Request                               │
└─────────────────────────────────────────────────────────┘
User → POST /auth/login { email, password }
        │
        ▼
   [Rate Limiter Check]
        │
        ▼
   [CSRF Validation]
        │
        ▼
   models/user.js → getByEmail(email)
        │
        ▼
   MySQL: SELECT * FROM User WHERE email = ?
        │
        ▼
   lib/password.js → verifyPassword(input, dbHash)
        │
        ├─ Match ✅
        │  └─ req.session.user = { id, email, role, role_name }
        │     req.session.save()
        │     Redirect → /auth/dashboard
        │
        └─ No Match ❌
           └─ Flash Error: "Ungültiger Benutzer oder Passwort"
              Redirect → /auth/login

┌─────────────────────────────────────────────────────────┐
│  Schritt 2: Authentifizierte Requests                  │
└─────────────────────────────────────────────────────────┘
User → GET /secured/vlan (mit Session-Cookie)
        │
        ▼
   middleware/auth.js (requireAuth)
        │
        ├─ req.session.user exists? ✅
        │  └─ res.locals.user = req.session.user
        │     next()
        │
        └─ req.session.user NOT exists? ❌
           └─ Redirect → /auth/login

┌─────────────────────────────────────────────────────────┐
│  Schritt 3: Admin-Check                                │
└─────────────────────────────────────────────────────────┘
User → GET /secured/user (Admin-Route)
        │
        ▼
   middleware/auth.js (OK)
        │
        ▼
   middleware/isAdmin.js
        │
        ├─ req.session.user.role === 1? ✅
        │  └─ next()
        │
        └─ req.session.user.role !== 1? ❌
           └─ 403 Forbidden Error-Page

┌─────────────────────────────────────────────────────────┐
│  Schritt 4: Logout                                     │
└─────────────────────────────────────────────────────────┘
User → GET /auth/logout
        │
        ▼
   req.session.destroy()
        │
        ▼
   Redirect → /auth/login
```

### Session-Cookie-Struktur

```
Cookie-Name: connect.sid
Cookie-Value: s%3A<encrypted_session_id>.<signature>
Cookie-Attributes:
  - HttpOnly: true       → Kein JavaScript-Zugriff
  - SameSite: Strict     → Kein Cross-Site-Sending
  - Secure: true (Prod)  → Nur über HTTPS
  - Max-Age: 86400s      → 24 Stunden
  - Path: /              → Gilt für alle Routes
```

**Session-Storage (Memory):**
```javascript
sessions = {
  '<session_id>': {
    cookie: { ... },
    user: {
      id: 1,
      email: 'admin@example.com',
      role: 1,
      role_name: 'Admin'
    },
    csrfSecret: '<random_secret>',
    trafficBlocked: false
  }
}
```

---

## Modul-Abhängigkeiten

### Core Dependencies

```json
{
  "bcrypt": "^6.0.0",              // Passwort-Hashing
  "cookie-parser": "~1.4.4",       // Cookie-Parsing
  "csurf": "^1.11.0",              // CSRF-Schutz
  "debug": "~2.6.9",               // Debug-Logging
  "dotenv": "^16.0.3",             // Environment Variables
  "express": "~4.22.1",            // Web-Framework
  "express-rate-limit": "^7.1.5",  // Rate-Limiting
  "express-session": "^1.17.3",    // Session-Management
  "morgan": "~1.9.1",              // HTTP-Request-Logger
  "mysql2": "^3.3.0",              // MySQL-Client
  "pug": "^3.0.4"                  // Template-Engine
}
```

### Dependency-Graph

```
app.js
├── express (Web-Framework)
│   ├── express.json() (Body-Parser)
│   ├── express.urlencoded() (Form-Parser)
│   └── express.static() (Static Files)
│
├── morgan (HTTP-Logger)
├── cookie-parser (Cookie-Parsing)
│
├── express-session (Session-Management)
│   └── benötigt: cookie-parser
│
├── csurf (CSRF-Schutz)
│   └── benötigt: express-session
│
├── pug (Template-Engine)
├── dotenv (Environment Variables)
│
├── routes/*
│   ├── models/*
│   │   ├── mysql2 (Database)
│   │   └── lib/password.js
│   │       └── bcrypt (Hashing)
│   │
│   └── middleware/*
│       └── express-rate-limit (DDoS-Schutz)
│
└── lib/*
    ├── dateUtils.js (Date-Formatting)
    ├── validators.js (Input-Validation)
    ├── responseHelpers.js (Response-Helpers)
    └── db.js (Connection Pool)
        └── mysql2
```

---

## Skalierungs-Strategie

### Horizontale Skalierung

**Aktueller Stand:** Single-Server

**Für Multi-Server-Setup erforderlich:**

1. **Persistent Session-Store**
   ```javascript
   // Redis-Session-Store
   const RedisStore = require('connect-redis')(session);
   const redis = require('redis');
   const client = redis.createClient();
   
   app.use(session({
     store: new RedisStore({ client }),
     // ... rest
   }));
   ```

2. **Shared Rate-Limiter**
   ```javascript
   const RedisStore = require('rate-limit-redis');
   
   const limiter = rateLimit({
     store: new RedisStore({ client: redisClient }),
     // ... rest
   });
   ```

3. **Load Balancer (Nginx)**
   ```nginx
   upstream gatekeeper {
     server 127.0.0.1:3001;
     server 127.0.0.1:3002;
     server 127.0.0.1:3003;
   }
   
   server {
     listen 443 ssl;
     location / {
       proxy_pass http://gatekeeper;
     }
   }
   ```

### Vertikale Skalierung

**Ressourcen-Optimierung:**

- **CPU:** Node.js Cluster-Mode (Worker-Prozesse)
  ```javascript
  const cluster = require('cluster');
  const numCPUs = require('os').cpus().length;
  
  if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
  } else {
    require('./app');
  }
  ```

- **Memory:** Connection-Pooling bereits implementiert (DB_CONN_LIMIT)
- **I/O:** Async/Await-Pattern (bereits umgesetzt)

### Performance-Bottlenecks

| Komponente | Bottleneck | Mitigation |
|------------|------------|------------|
| **Session-Store** | Memory-gebunden | Redis/Memcached |
| **Rate-Limiter** | Memory-gebunden | Redis-Store |
| **Database** | Single MySQL-Instanz | Read-Replicas, Query-Cache |
| **nftables DNS-Lookup** | Blocking-Calls | Cache DNS-Results |

---

## Deployment-Architektur (Empfohlen)

### Production-Setup

```
┌───────────────────────────────────────────────────────────┐
│                     Internet                              │
└─────────────────┬─────────────────────────────────────────┘
                  │ HTTPS (443)
                  ▼
┌─────────────────────────────────────────────────────────┐
│               Nginx (Reverse Proxy)                     │
│  ├── SSL-Termination (Let's Encrypt)                    │
│  ├── Rate-Limiting (1000/min global)                    │
│  ├── Gzip-Compression                                   │
│  └── Static-File-Caching                                │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP (localhost:3000)
                 ▼
┌─────────────────────────────────────────────────────────┐
│           Node.js Gatekeeper App                        │
│  (PM2 Process Manager: Auto-Restart, Logging)           │
└────────────────┬────────────────────────────────────────┘
                 ├─────────────┬─────────────┐
                 │             │             │
                 ▼             ▼             ▼
        ┌────────────┐  ┌────────────┐  ┌─────────────┐
        │   MySQL    │  │   Redis    │  │  nftables   │
        │  Database  │  │  Sessions  │  │  Firewall   │
        └────────────┘  └────────────┘  └─────────────┘
```

---

**Zuletzt aktualisiert:** 28. März 2026  
**Version:** 1.0  
**Architektur-Review:** Empfohlen vor größeren Änderungen
