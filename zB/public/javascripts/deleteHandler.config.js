/**
 * DeleteHandler Konfiguration
 * Registriert alle Entitäts-Profile für die Anwendung
 */

// Registriere Whitelist-Entität
DeleteHandler.registerEntity('whitelist', {
  endpoint: '/secured/whitelist/delete/',
  title: 'Whitelist-Eintrag löschen',
  getMessage: (name) => `Möchten Sie den Whitelist-Eintrag "${name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  errorContext: 'des Whitelist-Eintrags'
});

// Registriere VLAN-Entität
DeleteHandler.registerEntity('vlan', {
  endpoint: '/secured/vlan/delete/',
  title: 'VLAN löschen',
  getMessage: (name, id) => `Möchten Sie das VLAN "${name}" (ID: ${id}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  errorContext: 'des VLANs'
});

// Registriere User-Entität
DeleteHandler.registerEntity('user', {
  endpoint: '/secured/user/delete/',
  title: 'Benutzer löschen',
  nameAttribute: 'data-user-email', // User verwendet Email statt Name
  getMessage: (email) => `Möchten Sie den Benutzer "${email}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  errorContext: 'des Benutzers'
});

// Spezial-Konfiguration für Dashboard Whitelist (anderer Endpoint)
DeleteHandler.registerEntity('dashboard-whitelist', {
  selector: '[data-delete-dashboard-whitelist]',
  idAttribute: 'data-delete-dashboard-whitelist',
  nameAttribute: 'data-whitelist-name',
  rowSelector: 'tr[data-whitelist-id="{id}"]',
  endpoint: '/auth/dashboard/delete-whitelist/',
  title: 'Whitelist-Eintrag löschen',
  getMessage: (name) => `Möchten Sie den Whitelist-Eintrag "${name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
  errorContext: 'des Whitelist-Eintrags'
});
