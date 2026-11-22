#!/usr/bin/env bash
# Open https://house-display.vercel.app full screen on desktop login.
# Safe to re-run.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
AUTOSTART_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/autostart"
DESKTOP_FILE="$AUTOSTART_DIR/house-display-kiosk.desktop"
LABWC_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/labwc"
LABWC_AUTOSTART="$LABWC_DIR/autostart"
LOG_FILE="$HOME/house-display-kiosk.log"
START_SCRIPT="$SCRIPT_DIR/start-kiosk.sh"

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This installer must be run on the Raspberry Pi." >&2
  exit 1
fi

has_graphical_session() {
  local runtime
  runtime="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
  [[ -n "${DISPLAY:-}" || -n "${WAYLAND_DISPLAY:-}" ]] && return 0
  [[ -S "$runtime/wayland-0" || -S "$runtime/wayland-1" || -S /tmp/.X11-unix/X0 ]]
}

install_labwc_autostart() {
  # Bookworm/Trixie desktop uses labwc. Its autostart file is what actually
  # opens the browser. The .desktop file is the other login path.
  mkdir -p "$LABWC_DIR"
  if [[ -f "$LABWC_AUTOSTART" ]] && grep -qF "$START_SCRIPT" "$LABWC_AUTOSTART"; then
    echo "labwc autostart already set: $LABWC_AUTOSTART"
    return 0
  fi
  if [[ ! -f "$LABWC_AUTOSTART" ]]; then
    if [[ -f /etc/xdg/labwc/autostart ]]; then
      cp /etc/xdg/labwc/autostart "$LABWC_AUTOSTART"
    else
      printf '%s\n' '#!/bin/sh' >"$LABWC_AUTOSTART"
    fi
  fi
  {
    echo ""
    echo "# house-display-kiosk"
    echo "sleep 3"
    echo "\"$START_SCRIPT\" >>\"$LOG_FILE\" 2>&1 &"
  } >>"$LABWC_AUTOSTART"
  chmod +x "$LABWC_AUTOSTART"
  echo "labwc autostart: $LABWC_AUTOSTART"
}

chmod +x "$START_SCRIPT" "$SCRIPT_DIR/stop-kiosk.sh" "$SCRIPT_DIR/uninstall.sh"
mkdir -p "$AUTOSTART_DIR"

cat >"$DESKTOP_FILE" <<EOF
[Desktop Entry]
Type=Application
Name=House Display
Comment=Full-screen house display
Exec="$START_SCRIPT"
Terminal=false
X-GNOME-Autostart-enabled=true
EOF

APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
mkdir -p "$APPS_DIR"
cat >"$APPS_DIR/house-display-kiosk-stop.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Stop House Display
Comment=Close the kiosk so you can use Wi-Fi / desktop
Exec="$SCRIPT_DIR/stop-kiosk.sh"
Terminal=true
Categories=Utility;
EOF
if [[ -d "$HOME/Desktop" ]]; then
  cp "$APPS_DIR/house-display-kiosk-stop.desktop" "$HOME/Desktop/Stop House Display.desktop"
  chmod +x "$HOME/Desktop/Stop House Display.desktop" 2>/dev/null || true
fi

install_labwc_autostart

echo
echo "House display kiosk installed."
echo "URL: https://house-display.vercel.app/"
echo "Desktop autostart: $DESKTOP_FILE"
echo "Keep Wi-Fi on. Settings stay in this Pi's browser."

if has_graphical_session; then
  echo "Desktop session detected — starting kiosk now..."
  nohup "$START_SCRIPT" >>"$LOG_FILE" 2>&1 &
  echo "Log: $LOG_FILE"
else
  cat <<EOF
No desktop session in this terminal (common over SSH).
Enable Desktop Autologin, then: sudo reboot
After reboot Chromium should open the house display.
Check: tail -f $LOG_FILE
EOF
fi
