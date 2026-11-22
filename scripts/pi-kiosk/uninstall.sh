#!/usr/bin/env bash
# Remove house-display autostart. Leaves the repo and saved settings in place.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
AUTOSTART_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/autostart/house-display-kiosk.desktop"
LABWC_AUTOSTART="${XDG_CONFIG_HOME:-$HOME/.config}/labwc/autostart"
STOP_DESKTOP="${XDG_DATA_HOME:-$HOME/.local/share}/applications/house-display-kiosk-stop.desktop"

"$SCRIPT_DIR/stop-kiosk.sh" || true

rm -f "$AUTOSTART_FILE" "$STOP_DESKTOP"
rm -f "$HOME/Desktop/Stop House Display.desktop"

if [[ -f "$LABWC_AUTOSTART" ]] && grep -qE 'house-display-kiosk|house-display/scripts/pi-kiosk/start-kiosk\.sh' "$LABWC_AUTOSTART"; then
  tmp="$(mktemp)"
  awk '
    /^# house-display-kiosk/ { skip=2; next }
    skip>0 { skip--; next }
    /house-display\/scripts\/pi-kiosk\/start-kiosk\.sh/ { next }
    { print }
  ' "$LABWC_AUTOSTART" >"$tmp"
  mv "$tmp" "$LABWC_AUTOSTART"
  echo "Removed labwc autostart entry."
fi

echo "House display autostart removed."
