#!/bin/bash

# GateKeeper nftables Auto-Update Script
# Dieses Script aktualisiert die nftables-Regeln basierend auf aktiven Whitelists
# Verwendung: Als Cronjob einrichten für automatische Updates

# Konfiguration
GATEKEEPER_URL="http://localhost:3000"
SESSION_COOKIE_FILE="/etc/gatekeeper/session-cookie.txt"
LOG_FILE="/var/log/gatekeeper-nftables.log"
LOG_MAX_LINES=1000

# Farben für Output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging-Funktion
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Log-Datei rotieren wenn zu groß
rotate_log() {
    if [ -f "$LOG_FILE" ]; then
        LINE_COUNT=$(wc -l < "$LOG_FILE")
        if [ "$LINE_COUNT" -gt "$LOG_MAX_LINES" ]; then
            tail -n 500 "$LOG_FILE" > "$LOG_FILE.tmp"
            mv "$LOG_FILE.tmp" "$LOG_FILE"
            log "Log-Datei rotiert (war $LINE_COUNT Zeilen)"
        fi
    fi
}

# Prüfe ob Session-Cookie existiert
if [ ! -f "$SESSION_COOKIE_FILE" ]; then
    echo -e "${RED}Fehler: Session-Cookie-Datei nicht gefunden: $SESSION_COOKIE_FILE${NC}"
    echo "Erstelle die Datei und füge dein Session-Cookie hinzu:"
    echo "  echo 'your-session-cookie-here' > $SESSION_COOKIE_FILE"
    echo "  chmod 600 $SESSION_COOKIE_FILE"
    exit 1
fi

# Lese Session-Cookie
SESSION_COOKIE=$(cat "$SESSION_COOKIE_FILE")

if [ -z "$SESSION_COOKIE" ]; then
    echo -e "${RED}Fehler: Session-Cookie ist leer${NC}"
    exit 1
fi

log "Starte nftables-Update..."

rotate_log

# Rufe GateKeeper API auf
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
    "$GATEKEEPER_URL/secured/nftables/apply" \
    -H "Cookie: connect.sid=$SESSION_COOKIE")

# Trenne Response Body und HTTP Code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

# Prüfe HTTP Status Code
if [ "$HTTP_CODE" -eq 200 ]; then
    # Prüfe ob JSON-Response erfolgreich war
    SUCCESS=$(echo "$HTTP_BODY" | grep -o '"success":\s*true')
    
    if [ -n "$SUCCESS" ]; then
        MESSAGE=$(echo "$HTTP_BODY" | grep -o '"message":"[^"]*"' | sed 's/"message":"\(.*\)"/\1/')
        log "${GREEN}✓ Erfolgreich: $MESSAGE${NC}"
        exit 0
    else
        ERROR=$(echo "$HTTP_BODY" | grep -o '"error":"[^"]*"' | sed 's/"error":"\(.*\)"/\1/')
        MESSAGE=$(echo "$HTTP_BODY" | grep -o '"message":"[^"]*"' | sed 's/"message":"\(.*\)"/\1/')
        log "${RED}✗ Fehler: $MESSAGE${NC}"
        [ -n "$ERROR" ] && log "Details: $ERROR"
        exit 1
    fi
else
    log "${RED}✗ HTTP-Fehler: Status Code $HTTP_CODE${NC}"
    
    if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 403 ]; then
        log "Session-Cookie möglicherweise abgelaufen. Bitte erneuern!"
    fi
    
    exit 1
fi
