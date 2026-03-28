/**
 * Datum/Zeit Utility-Funktionen
 */

/**
 * Formatiert einen Datetime-String für die Anzeige (DD.MM.YYYY HH:MM)
 * @param {string} dateString - ISO-Datetime-String aus der Datenbank
 * @returns {string} Formatierter String oder leerer String bei Fehler
 */
function formatDatetimeDisplay(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch (err) {
    return '';
  }
}

/**
 * Konvertiert DB-Datetime zu datetime-local Format für HTML5 Input (YYYY-MM-DDTHH:MM)
 * @param {string} dateString - ISO-Datetime-String aus der Datenbank
 * @returns {string} Formatierter String oder leerer String bei Fehler
 */
function formatDatetimeLocal(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (err) {
    return '';
  }
}

/**
 * Konvertiert datetime-local Format (YYYY-MM-DDTHH:MM) zu ISO-Datetime für DB
 * @param {string} dateString - Datetime-local String vom HTML5 Input
 * @returns {string|null} ISO-Datetime-String oder null
 */
function parseLocalDatetime(dateString) {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (err) {
    return null;
  }
}

/**
 * Prüft ob ein Datum in der Vergangenheit liegt
 * @param {string} dateString - ISO-Datetime-String
 * @returns {boolean} true wenn in der Vergangenheit
 */
function isPast(dateString) {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return date.getTime() < Date.now();
  } catch (err) {
    return false;
  }
}

/**
 * Prüft ob ein Datum in der Zukunft liegt
 * @param {string} dateString - ISO-Datetime-String
 * @returns {boolean} true wenn in der Zukunft
 */
function isFuture(dateString) {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    return date.getTime() > Date.now();
  } catch (err) {
    return false;
  }
}

module.exports = {
  formatDatetimeDisplay,
  formatDatetimeLocal,
  parseLocalDatetime,
  isPast,
  isFuture
};
