/**
 * Zentrale Delete-Handler Utility mit Auto-Initialization
 * Initialisiert Delete-Buttons mit Modal-Bestätigung und AJAX-Löschung
 * 
 * @example HTML (Declarative):
 * <button data-delete-entity="whitelist"
 *         data-delete-id="18"
 *         data-delete-name="SRF"
 *         data-delete-endpoint="/secured/whitelist/delete/18"
 *         data-delete-row="tr[data-whitelist-id='18']"
 *         data-delete-title="Whitelist-Eintrag löschen"
 *         data-delete-message="Möchten Sie 'SRF' wirklich löschen?">
 *   Löschen
 * </button>
 * 
 * @example JavaScript (Programmatic):
 * DeleteHandler.init({
 *   selector: '[data-delete-whitelist]',
 *   idAttribute: 'data-delete-whitelist',
 *   nameAttribute: 'data-whitelist-name',
 *   rowSelector: 'tr[data-whitelist-id="{id}"]',
 *   endpoint: '/secured/whitelist/delete/',
 *   title: 'Whitelist-Eintrag löschen',
 *   getMessage: (name) => `"${name}" wirklich löschen?`,
 *   csrfToken: csrfToken
 * });
 * 
 * @example JavaScript (Entity Preset):
 * DeleteHandler.registerEntity('whitelist', {
 *   endpoint: '/secured/whitelist/delete/',
 *   title: 'Whitelist-Eintrag löschen',
 *   getMessage: (name) => `"${name}" wirklich löschen?`
 * });
 */
window.DeleteHandler = {
  /**
   * Registrierte Entitäts-Profile
   * @private
   */
  _entities: {},

  /**
   * CSRF-Token Cache
   * @private
   */
  _csrfToken: null,

  /**
   * Default-Konfiguration
   */
  defaults: {
    confirmText: 'Löschen',
    cancelText: 'Abbrechen',
    danger: true,
    fadeOutDuration: 300,
    debug: false,
    autoInit: true
  },

  /**
   * Holt CSRF-Token aus verschiedenen Quellen
   * @private
   */
  _getCsrfToken: function() {
    if (this._csrfToken) return this._csrfToken;

    // 1. Aus Meta-Tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      this._csrfToken = metaTag.getAttribute('content');
      return this._csrfToken;
    }

    // 2. Aus globalem Window-Objekt
    if (window.csrfToken) {
      this._csrfToken = window.csrfToken;
      return this._csrfToken;
    }

    // 3. Aus Script-Variable (für Inline-Scripts)
    if (typeof csrfToken !== 'undefined') {
      this._csrfToken = csrfToken;
      return this._csrfToken;
    }

    console.warn('[DeleteHandler] CSRF-Token nicht gefunden');
    return null;
  },

  /**
   * Validiert die Konfiguration
   * @private
   */
  _validateConfig: function(config) {
    const required = ['selector', 'idAttribute', 'nameAttribute', 'rowSelector', 'endpoint', 'title', 'getMessage'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
      throw new Error(`DeleteHandler: Fehlende erforderliche Parameter: ${missing.join(', ')}`);
    }

    if (typeof config.getMessage !== 'function') {
      throw new Error('DeleteHandler: getMessage muss eine Funktion sein');
    }

    return true;
  },

  /**
   * Loggt Debug-Informationen wenn aktiviert
   * @private
   */
  _log: function(config, ...args) {
    if (config?.debug || this.defaults.debug) {
      console.log('[DeleteHandler]', ...args);
    }
  },

  /**
   * Führt die Lösch-Operation aus
   * @private
   */
  _performDelete: async function(id, config) {
    this._log(config, `Lösche Eintrag mit ID: ${id}`);
    
    const csrfToken = config.csrfToken || this._getCsrfToken();
    
    if (!csrfToken) {
      throw new Error('CSRF-Token nicht verfügbar');
    }
    
    const response = await fetch(`${config.endpoint}${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unbekannter Fehler');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response;
  },

  /**
   * Entfernt die Zeile mit Animation aus der Tabelle
   * @private
   */
  _removeRow: function(id, config) {
    const rowSelector = config.rowSelector.replace('{id}', id);
    const row = document.querySelector(rowSelector);
    
    if (!row) {
      this._log(config, `Warnung: Zeile mit Selector "${rowSelector}" nicht gefunden`);
      return;
    }

    const duration = config.fadeOutDuration || this.defaults.fadeOutDuration;
    row.style.transition = `opacity ${duration}ms`;
    row.style.opacity = '0';
    
    setTimeout(() => {
      row.remove();
      this._log(config, `Zeile mit ID ${id} entfernt`);
      
      // Callback nach Entfernung
      if (config.onRemoved) {
        config.onRemoved(id, row);
      }
    }, duration);
  },

  /**
   * Zeigt eine Fehlermeldung an
   * @private
   */
  _showError: function(error, config) {
    const context = config?.errorContext ? ` ${config.errorContext}` : '';
    const message = `Fehler beim Löschen${context}`;
    
    console.error('[DeleteHandler]', message, error);
    
    if (config?.onError) {
      config.onError(error, message);
    } else {
      alert(message);
    }
  },

  /**
   * Initialisiert einen einzelnen Delete-Button (Declarative API)
   * @private
   */
  _initDeclarativeButton: function(btn) {
    const entityType = btn.getAttribute('data-delete-entity');
    const id = btn.getAttribute('data-delete-id');
    const name = btn.getAttribute('data-delete-name') || 'dieser Eintrag';
    const endpoint = btn.getAttribute('data-delete-endpoint');
    const rowSelector = btn.getAttribute('data-delete-row');
    const title = btn.getAttribute('data-delete-title') || 'Eintrag löschen';
    const message = btn.getAttribute('data-delete-message') || `"${name}" wirklich löschen?`;

    if (!endpoint || !id) {
      console.error('[DeleteHandler] Button benötigt data-delete-endpoint und data-delete-id', btn);
      return;
    }

    const self = this;
    
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      if (typeof Modal === 'undefined') {
        alert('Fehler: Modal-System nicht geladen. Bitte Seite neu laden.');
        return;
      }

      Modal.open({
        title: title,
        message: message,
        confirmText: this.defaults.confirmText,
        cancelText: this.defaults.cancelText,
        danger: this.defaults.danger,
        onConfirm: async () => {
          try {
            // Direkter Fetch-Call für declarative Buttons
            const csrfToken = self._getCsrfToken();
            if (!csrfToken) {
              throw new Error('CSRF-Token nicht verfügbar');
            }

            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              }
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            // Zeile entfernen wenn Selector angegeben
            if (rowSelector) {
              const row = document.querySelector(rowSelector);
              if (row) {
                row.style.transition = `opacity ${self.defaults.fadeOutDuration}ms`;
                row.style.opacity = '0';
                setTimeout(() => row.remove(), self.defaults.fadeOutDuration);
              }
            }

            self._log(null, `Declarative delete erfolgreich: ${id}`);
          } catch (error) {
            self._showError(error, { errorContext: entityType ? `des ${entityType}-Eintrags` : '' });
          }
        }
      });
    });
  },

  /**
   * Registriert ein Entitäts-Profile für wiederverwendbare Konfigurationen
   * 
   * @param {string} entityName - Name der Entität (z.B. 'whitelist', 'user', 'vlan')
   * @param {Object} profile - Konfigurationsprofil
   * @param {string} profile.endpoint - API-Endpoint-Basis (z.B. '/secured/whitelist/delete/')
   * @param {string} profile.title - Modal-Titel
   * @param {Function} profile.getMessage - Message-Generator: (name, id) => string
   * @param {string} [profile.errorContext] - Fehlerkontext
   * @param {string} [profile.idAttribute] - Default: 'data-delete-{entityName}'
   * @param {string} [profile.nameAttribute] - Default: 'data-{entityName}-name'
   * @param {string} [profile.rowSelector] - Default: 'tr[data-{entityName}-id="{id}"]'
   * 
   * @example
   * DeleteHandler.registerEntity('whitelist', {
   *   endpoint: '/secured/whitelist/delete/',
   *   title: 'Whitelist-Eintrag löschen',
   *   getMessage: (name) => `"${name}" wirklich löschen?`
   * });
   * 
   * // Später: Auto-initialization findet alle [data-delete-whitelist] Buttons
   */
  registerEntity: function(entityName, profile) {
    // Setze Convention-over-Configuration Defaults
    const defaults = {
      idAttribute: profile.idAttribute || `data-delete-${entityName}`,
      nameAttribute: profile.nameAttribute || `data-${entityName}-name`,
      rowSelector: profile.rowSelector || `tr[data-${entityName}-id="{id}"]`,
      selector: profile.selector || `[data-delete-${entityName}]`
    };

    this._entities[entityName] = { ...defaults, ...profile };
    this._log(null, `Entity registriert: ${entityName}`, this._entities[entityName]);

    // Auto-init wenn bereits geladen
    if (this.defaults.autoInit && document.readyState !== 'loading') {
      this.initEntity(entityName);
    }
  },

  /**
   * Initialisiert alle Buttons für eine registrierte Entität
   * 
   * @param {string} entityName - Name der registrierten Entität
   */
  initEntity: function(entityName) {
    const profile = this._entities[entityName];
    
    if (!profile) {
      console.error(`[DeleteHandler] Entität '${entityName}' nicht registriert`);
      return;
    }

    const csrfToken = this._getCsrfToken();
    
    this.init({
      ...profile,
      csrfToken: csrfToken
    });
  },

  /**
   * Auto-Initialisierung: Findet alle Buttons mit data-delete-* Attributen
   */
  autoInit: function() {
    this._log(null, 'Auto-Initialization gestartet');

    // 1. Initialisiere registrierte Entitäten
    Object.keys(this._entities).forEach(entityName => {
      this.initEntity(entityName);
    });

    // 2. Initialisiere declarative Buttons (data-delete-entity)
    const declarativeButtons = document.querySelectorAll('[data-delete-entity]');
    this._log(null, `${declarativeButtons.length} declarative Button(s) gefunden`);
    
    declarativeButtons.forEach(btn => {
      this._initDeclarativeButton(btn);
    });
  },

  /**
   * Initialisiert Delete-Buttons für eine bestimmte Entität (Programmatic API)
   * 
   * @param {Object} config - Konfigurationsobjekt
   * @param {string} config.selector - CSS-Selector für Delete-Buttons
   * @param {string} config.idAttribute - Data-Attribut für die ID
   * @param {string} config.nameAttribute - Data-Attribut für den Namen
   * @param {string} config.rowSelector - Selector für die zu löschende Zeile (verwende {id} als Platzhalter)
   * @param {string} config.endpoint - API-Endpoint zum Löschen (ohne ID am Ende)
   * @param {string} config.title - Modal-Titel
   * @param {Function} config.getMessage - Funktion die Modal-Nachricht erstellt: (name, id) => string
   * @param {string} [config.csrfToken] - CSRF-Token (wird automatisch gesucht wenn nicht angegeben)
   * @param {string} [config.errorContext] - Zusätzlicher Kontext für Fehlermeldungen
   * @param {string} [config.confirmText='Löschen'] - Text für Bestätigungs-Button
   * @param {string} [config.cancelText='Abbrechen'] - Text für Abbrechen-Button
   * @param {boolean} [config.danger=true] - Ob Modal als danger markiert werden soll
   * @param {number} [config.fadeOutDuration=300] - Dauer der Fade-Out-Animation in ms
   * @param {Function} [config.onSuccess] - Callback bei erfolgreichem Löschen: (id, name) => void
   * @param {Function} [config.onError] - Callback bei Fehler: (error, message) => void
   * @param {Function} [config.onRemoved] - Callback nach DOM-Entfernung: (id, row) => void
   * @param {boolean} [config.debug=false] - Debug-Ausgaben aktivieren
   * 
   * @throws {Error} Wenn erforderliche Parameter fehlen oder ungültig sind
   */
  init: function(config) {
    // Validiere Konfiguration
    try {
      this._validateConfig(config);
    } catch (error) {
      console.error(error.message);
      return;
    }

    // Merge mit Defaults
    const finalConfig = { ...this.defaults, ...config };
    
    // Auto-detect CSRF Token wenn nicht angegeben
    if (!finalConfig.csrfToken) {
      finalConfig.csrfToken = this._getCsrfToken();
    }
    
    const self = this;

    function initDeleteButtons() {
      // Prüfe ob Modal verfügbar ist
      if (typeof Modal === 'undefined') {
        const error = 'Modal ist nicht verfügbar. Stelle sicher, dass modal.js geladen ist.';
        console.error('[DeleteHandler]', error);
        alert('Fehler: Modal-System nicht geladen. Bitte Seite neu laden.');
        return;
      }
      
      const deleteButtons = document.querySelectorAll(finalConfig.selector);
      self._log(finalConfig, `${deleteButtons.length} Delete-Button(s) gefunden für Selector: ${finalConfig.selector}`);
      
      if (deleteButtons.length === 0) {
        self._log(finalConfig, `Warnung: Keine Buttons mit Selector "${finalConfig.selector}" gefunden`);
      }
      
      deleteButtons.forEach((btn, index) => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          
          const id = btn.getAttribute(finalConfig.idAttribute);
          const name = btn.getAttribute(finalConfig.nameAttribute);
          
          if (!id) {
            console.error(`[DeleteHandler] Button ${index} hat kein ${finalConfig.idAttribute} Attribut`);
            return;
          }
          
          self._log(finalConfig, `Button geklickt - ID: ${id}, Name: ${name}`);
          
          Modal.open({
            title: finalConfig.title,
            message: finalConfig.getMessage(name, id),
            confirmText: finalConfig.confirmText,
            cancelText: finalConfig.cancelText,
            danger: finalConfig.danger,
            onConfirm: async () => {
              try {
                await self._performDelete(id, finalConfig);
                self._removeRow(id, finalConfig);
                
                // Success Callback
                if (finalConfig.onSuccess) {
                  finalConfig.onSuccess(id, name);
                }
                
                self._log(finalConfig, `Erfolgreich gelöscht: ID ${id}`);
              } catch (error) {
                self._showError(error, finalConfig);
              }
            }
          });
        });
      });
    }
    
    // Initialisiere entweder sofort oder nach DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDeleteButtons);
    } else {
      initDeleteButtons();
    }
  }
};

// Auto-Initialization beim Laden
if (DeleteHandler.defaults.autoInit) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DeleteHandler.autoInit());
  } else {
    DeleteHandler.autoInit();
  }
}
