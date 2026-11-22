#!/usr/bin/env bash
# Stop the house display and leave the Pi desktop free.
# Chromium stays closed until you run start-kiosk.sh or reboot.
set -euo pipefail

CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/house-display-kiosk"
PAUSE_FILE="$CONFIG_DIR/paused"
PROFILE_DIR="$CONFIG_DIR/chromium"

mkdir -p "$CONFIG_DIR"
touch "$PAUSE_FILE"

pkill -f "house-display/scripts/pi-kiosk/start-kiosk.sh" 2>/dev/null || true
sleep 0.3

pkill -f "house-display-kiosk/chromium" 2>/dev/null || true
if [[ -d "$PROFILE_DIR" ]]; then
  pkill -f "--user-data-dir=$PROFILE_DIR" 2>/dev/null || true
fi

echo "House display kiosk stopped."
echo "Desktop is free. To bring the display back:"
echo "  ~/house-display/scripts/pi-kiosk/start-kiosk.sh"
echo "  or reboot."
