# DeleteHandler - Dokumentation

## Übersicht

Das DeleteHandler-System ist eine zentrale, hochabstrakte Lösung für Delete-Operationen mit Modal-Bestätigung. Es verwendet **Auto-Initialization** und **Entity-Profile** für maximale Wartbarkeit und minimalen Code in Views.

## Architektur

```
┌─────────────────────────────────────────────────────────┐
│                     layout.pug                           │
│  Lädt: modal.js → deleteHandler.js → config.js          │
└─────────────────────────────────────────────────────────┘
                            ↓
      ┌────────────────────────────────────────┐
      │    deleteHandler.config.js              │
      │  Registriert Entity-Profile:            │
      │  - whitelist                            │
      │  - vlan                                 │
      │  - user                                 │
      │  - dashboard-whitelist                  │
      └────────────────────────────────────────┘
                            ↓
      ┌────────────────────────────────────────┐
      │       Auto-Initialization               │
      │  Findet alle [data-delete-*] Buttons   │
      │  und initialisiert sie automatisch     │
      └────────────────────────────────────────┘
                            ↓
      ┌────────────────────────────────────────┐
      │          Views (minimal)                │
      │  Nur CSRF-Token bereitstellen:         │
      │  const csrfToken = '#{csrfToken}';     │
      └────────────────────────────────────────┘
```

## Verwendung

### 1. Declarative API (empfohlen für einfache Fälle)

Buttons mit `data-delete-entity` werden automatisch erkannt:

```html
<button data-delete-entity="whitelist"
        data-delete-id="18"
        data-delete-name="SRF"
        data-delete-endpoint="/secured/whitelist/delete/18"
        data-delete-row="tr[data-whitelist-id='18']"
        data-delete-title="Whitelist löschen"
        data-delete-message="Möchten Sie 'SRF' wirklich löschen?">
  Löschen
</button>
```

### 2. Entity-Profile (empfohlen für wiederkehrende Entitäten)

#### a) Registrierung in `deleteHandler.config.js`:

```javascript
DeleteHandler.registerEntity('whitelist', {
  endpoint: '/secured/whitelist/delete/',
  title: 'Whitelist-Eintrag löschen',
  getMessage: (name) => `"${name}" wirklich löschen?`
});
```

#### b) Convention-over-Configuration:

Das System verwendet automatisch:
- **Selector**: `[data-delete-whitelist]`
- **ID-Attribut**: `data-delete-whitelist`
- **Name-Attribut**: `data-whitelist-name`
- **Row-Selector**: `tr[data-whitelist-id="{id}"]`

#### c) Button im Template (Pug):

```pug
button.btn.btn-danger(
  type='button',
  data-delete-whitelist=whitelist.id,
  data-whitelist-name=whitelist.name,
  title='Löschen'
) Löschen
```

#### d) View-Script (minimal):

```pug
block scripts
  script.
    const csrfToken = '#{csrfToken}';
    // Auto-Initialization übernimmt den Rest
```

### 3. Programmatic API (für spezielle Fälle)

Manuelle Initialisierung mit vollem Control:

```javascript
DeleteHandler.init({
  selector: '[data-delete-custom]',
  idAttribute: 'data-delete-custom',
  nameAttribute: 'data-custom-name',
  rowSelector: 'tr[data-custom-id="{id}"]',
  endpoint: '/api/custom/delete/',
  title: 'Eintrag löschen',
  getMessage: (name, id) => `${name} (ID: ${id}) löschen?`,
  csrfToken: csrfToken,
  onSuccess: (id, name) => console.log('Gelöscht:', name),
  onError: (error) => customErrorHandler(error),
  debug: true
});
```

## Entity-Profile Optionen

| Option | Typ | Erforderlich | Default | Beschreibung |
|--------|-----|--------------|---------|--------------|
| `endpoint` | string | ✅ | - | API-Endpoint ohne ID (z.B. `/secured/whitelist/delete/`) |
| `title` | string | ✅ | - | Modal-Titel |
| `getMessage` | Function | ✅ | - | `(name, id) => string` |
| `selector` | string | ❌ | `[data-delete-{entity}]` | CSS-Selector für Buttons |
| `idAttribute` | string | ❌ | `data-delete-{entity}` | Data-Attribut für ID |
| `nameAttribute` | string | ❌ | `data-{entity}-name` | Data-Attribut für Namen |
| `rowSelector` | string | ❌ | `tr[data-{entity}-id="{id}"]` | Selector für Tabellenzeile |
| `errorContext` | string | ❌ | - | Fehlerkontext (z.B. "des Benutzers") |
| `confirmText` | string | ❌ | "Löschen" | Bestätigungs-Button-Text |
| `cancelText` | string | ❌ | "Abbrechen" | Abbrechen-Button-Text |
| `danger` | boolean | ❌ | `true` | Modal-Danger-Flag |
| `fadeOutDuration` | number | ❌ | `300` | Fade-Out-Animation in ms |
| `onSuccess` | Function | ❌ | - | Callback: `(id, name) => void` |
| `onError` | Function | ❌ | - | Callback: `(error, message) => void` |
| `onRemoved` | Function | ❌ | - | Callback: `(id, row) => void` |
| `debug` | boolean | ❌ | `false` | Debug-Logs aktivieren |

## CSRF-Token Handling

Das System sucht automatisch nach dem CSRF-Token in dieser Reihenfolge:

1. **Meta-Tag**: `<meta name="csrf-token" content="...">`
2. **Global**: `window.csrfToken`
3. **Script-Variable**: `const csrfToken = '...'`

In Pug-Templates reicht:

```pug
script.
  const csrfToken = '#{csrfToken}';
```

## Neue Entität hinzufügen

### Schritt 1: Entity registrieren

In `public/javascripts/deleteHandler.config.js`:

```javascript
DeleteHandler.registerEntity('book', {
  endpoint: '/secured/books/delete/',
  title: 'Buch löschen',
  getMessage: (name) => `Buch "${name}" wirklich löschen?`,
  errorContext: 'des Buches'
});
```

### Schritt 2: Buttons hinzufügen

In Template (z.B. `views/books/book_list.pug`):

```pug
each book in books
  tr(data-book-id=book.id)
    td= book.title
    td
      button.btn.btn-danger(
        type='button',
        data-delete-book=book.id,
        data-book-name=book.title,
        title='Löschen'
      ) ✕
```

### Schritt 3: CSRF-Token bereitstellen

```pug
block scripts
  script.
    const csrfToken = '#{csrfToken}';
```

**Fertig!** Auto-Initialization übernimmt den Rest.

## Anpassungen für spezielle Entitäten

### User (verwendet Email statt Name)

```javascript
DeleteHandler.registerEntity('user', {
  endpoint: '/secured/user/delete/',
  nameAttribute: 'data-user-email', // ← Anpassung
  title: 'Benutzer löschen',
  getMessage: (email) => `Benutzer "${email}" wirklich löschen?`
});
```

Button:
```pug
button(data-delete-user=user.id, data-user-email=user.email) Löschen
```

### Dashboard (anderer Endpoint für gleiche Entität)

```javascript
DeleteHandler.registerEntity('dashboard-whitelist', {
  selector: '[data-delete-dashboard-whitelist]',
  endpoint: '/auth/dashboard/delete-whitelist/', // ← Anderer Endpoint
  title: 'Whitelist-Eintrag löschen',
  getMessage: (name) => `"${name}" wirklich löschen?`
});
```

Button:
```pug
button(data-delete-dashboard-whitelist=whitelist.id, data-whitelist-name=whitelist.name) Löschen
```

## Debug-Modus

Für Entwicklung oder Troubleshooting:

```javascript
// Global aktivieren
DeleteHandler.defaults.debug = true;

// Oder pro Entity
DeleteHandler.registerEntity('whitelist', {
  // ...
  debug: true
});
```

Ausgabe:
```
[DeleteHandler] Entity registriert: whitelist
[DeleteHandler] Auto-Initialization gestartet
[DeleteHandler] 3 Delete-Button(s) gefunden für Selector: [data-delete-whitelist]
[DeleteHandler] Button geklickt - ID: 18, Name: SRF
[DeleteHandler] Lösche Eintrag mit ID: 18
[DeleteHandler] Erfolgreich gelöscht: ID 18
```

## Vorteile der Architektur

### 1. Minimaler Code in Views
**Vorher (89 Zeilen)**:
```javascript
const csrfToken = '#{csrfToken}';

function initDeleteButtons() {
  if (typeof Modal === 'undefined') { /* ... */ }
  const deleteButtons = document.querySelectorAll('[data-delete-whitelist]');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-delete-whitelist');
      const name = btn.getAttribute('data-whitelist-name');
      Modal.open({
        title: 'Whitelist-Eintrag löschen',
        message: `"${name}" wirklich löschen?`,
        confirmText: 'Löschen',
        cancelText: 'Abbrechen',
        danger: true,
        onConfirm: async () => {
          try {
            const response = await fetch(`/secured/whitelist/delete/${id}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              }
            });
            if (response.ok) { /* ... */ }
          } catch (err) { /* ... */ }
        }
      });
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDeleteButtons);
} else {
  initDeleteButtons();
}
```

**Nachher (2 Zeilen)**:
```javascript
const csrfToken = '#{csrfToken}';
// Auto-Initialization übernimmt den Rest
```

### 2. Zentrale Konfiguration
Alle Entity-Definitionen an einem Ort: `deleteHandler.config.js`

### 3. Convention over Configuration
Folge den Namenskonventionen → weniger Konfiguration nötig

### 4. Einfaches Testing
Isolierte Funktionen, Auto-Discovery deaktivierbar

### 5. Erweiterbar
Callbacks für Custom Logic: `onSuccess`, `onError`, `onRemoved`

## Migration bestehender Views

1. **deleteHandler.config.js erstellen** mit Entity-Profilen
2. **layout.pug aktualisieren**: `deleteHandler.config.js` laden
3. **Views vereinfachen**: Nur CSRF-Token behalten
4. **Testen**: Debug-Modus aktivieren und prüfen

## Troubleshooting

### Problem: Buttons werden nicht initialisiert

**Lösung**: Debug-Modus aktivieren
```javascript
DeleteHandler.defaults.debug = true;
```

Prüfe Console-Ausgabe:
- Wird die Entity gefunden?
- Werden Buttons gematcht?
- Stimmen die Selektoren?

### Problem: CSRF-Token nicht gefunden

**Lösung**: Stelle sicher, dass `csrfToken` vor `deleteHandler.config.js` geladen wird.

In View:
```pug
block scripts
  script.
    const csrfToken = '#{csrfToken}';
```

### Problem: Modal öffnet nicht

**Lösung**: Prüfe Lade-Reihenfolge in `layout.pug`:
```pug
script(src='/javascripts/modal.js')          // ← Zuerst
script(src='/javascripts/deleteHandler.js')  // ← Dann
script(src='/javascripts/deleteHandler.config.js')
```

## Performance

- **Lazy Event-Listener**: Nur auf existierenden Buttons
- **Keine Polling**: Event-driven
- **Optimierte DOM-Queries**: Nur bei Initialization
- **Kein Overhead**: Auto-Init läuft nur 1x beim Page-Load

## Sicherheit

- ✅ CSRF-Token erforderlich für alle Requests
- ✅ Modal-Bestätigung verhindert versehentliches Löschen
- ✅ Server-Side-Validierung (DeleteHandler ist nur UI)
- ✅ XSS-Safe (keine `innerHTML`-Manipulation)

## Best Practices

1. **Nutze Entity-Profile** statt Programmatic API
2. **Folge Namenskonventionen** für minimale Config
3. **Aktiviere Debug-Modus** während Entwicklung
4. **Teste Delete-Flows** nach Migration
5. **Dokumentiere Custom Entities** in `deleteHandler.config.js`

## Wartung

Neue Entität hinzufügen: **< 10 Zeilen Code**
Änderung an Delete-Logic: **1 Datei** (`deleteHandler.js`)
Endpoint ändern: **1 Zeile** (`deleteHandler.config.js`)

---

**Dokumentation Version**: 1.0  
**Letztes Update**: März 2026
