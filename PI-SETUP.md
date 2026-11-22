# Raspberry Pi setup — House display

Step-by-step for a **house display** on a **Raspberry Pi**. Chromium opens the hosted site full screen when the desktop logs in.

Use this every time you set up a new house so you do not have to dig up commands again.

**URL:** [house-display.vercel.app](https://house-display.vercel.app)

The Pi needs Wi-Fi. Settings (location, orientation, weather key) are saved in that Pi’s browser, not on the website.

Official kiosk notes: [How to use a Raspberry Pi in kiosk mode](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)

---

## What you need

- Raspberry Pi 4 (2GB+; **4GB recommended**)
- Official USB-C power supply
- MicroSD card (16GB+, 32GB fine)
- HDMI display / TV / monitor
- Keyboard + mouse for the first setup (can remove later)
- Wi-Fi

**Note on username:** Newer Raspberry Pi OS images often use a custom user, not `pi`. `~` always means the current user’s home.

---

## Part A — Prepare the Pi

### A1. Flash the OS

1. On your laptop, install [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2. Choose **Raspberry Pi OS (64-bit) with Desktop**.
3. Open **OS Customisation** (gear icon) and set:
   - Hostname (e.g. `house-display`)
   - Username + password
   - Wi-Fi SSID / password
   - Locale / timezone for that house
   - Enable **SSH** if you want remote setup
4. Write the image to the SD card.

### A2. First boot

1. Insert the SD card, connect HDMI + keyboard/mouse + power.
2. Finish the first-boot wizard if it appears.
3. Update packages:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

### A3. Auto-login + no screen blanking

```bash
sudo raspi-config
```

Then:

1. **System Options → Boot / Auto Login → Desktop Autologin**
2. **Display Options → Screen Blanking → No**
3. Finish and reboot if asked.

### A4. Install Chromium

```bash
sudo apt install -y chromium
```

On some images the browser package is `chromium-browser` instead of `chromium`:

```bash
sudo apt install -y chromium-browser
```

Confirm:

```bash
chromium --version || chromium-browser --version
```

---

## Part B — House display (kiosk)

Nothing from the repo is installed on the Pi. These steps only tell Chromium to open the site full screen at login.

### B1. Start script

```bash
mkdir -p ~/bin
nano ~/bin/house-display-kiosk.sh
```

Paste:

```bash
#!/usr/bin/env bash
URL="https://house-display.vercel.app/"
PROFILE_DIR="${HOME}/.config/house-display-kiosk/chromium"
mkdir -p "$PROFILE_DIR"

# Desktop login and labwc can both start this. Only one browser should open.
exec 9>"${HOME}/.config/house-display-kiosk/kiosk.lock"
flock -n 9 || exit 0

if command -v chromium >/dev/null 2>&1; then
  CHROMIUM=chromium
else
  CHROMIUM=chromium-browser
fi

while true; do
  "$CHROMIUM" \
    --kiosk "$URL" \
    --app="$URL" \
    --user-data-dir="$PROFILE_DIR" \
    --no-first-run \
    --no-default-browser-check \
    --disable-session-crashed-bubble \
    --disable-infobars \
    --disable-translate \
    --ozone-platform-hint=auto \
    --autoplay-policy=no-user-gesture-required || true
  sleep 3
done
```

```bash
chmod +x ~/bin/house-display-kiosk.sh
```

The profile folder is why Settings survive a reboot.

### B2. Autostart on desktop login

```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/house-display-kiosk.desktop <<EOF
[Desktop Entry]
Type=Application
Name=House Display
Comment=Full-screen house display
Exec=$HOME/bin/house-display-kiosk.sh
Terminal=false
X-GNOME-Autostart-enabled=true
EOF
```

### B3. labwc autostart

Current Raspberry Pi OS starts login programs from this file. Add the same script here too. The lock in B1 keeps it from opening a second browser.

```bash
mkdir -p ~/.config/labwc
nano ~/.config/labwc/autostart
```

Add:

```bash
sleep 3
"$HOME/bin/house-display-kiosk.sh" &
```

### B4. Configure the house in Settings

Reboot so the browser opens on the screen:

```bash
sudo reboot
```

1. Click the **gear** in the top-right corner.
2. Set that house’s location, prayer method, and OpenWeather key.
3. Set **Orientation** to **Horizontal** when the screen is wide. Vertical on a wide screen cuts off the calendar.
4. Save.
5. Reboot once more and confirm the same settings come back full screen.

To leave the kiosk and use the desktop, stop the script, then close Chromium:

```bash
pkill -f house-display-kiosk.sh
pkill -f house-display-kiosk/chromium
```

Reboot brings the display back. To stop that for good, delete `~/.config/autostart/house-display-kiosk.desktop` and remove the two lines you added to `~/.config/labwc/autostart`.

---

## If something looks wrong

| What you see | What to do |
| --- | --- |
| Black screen / no browser after reboot | Confirm **Desktop Autologin**. Check `~/.config/autostart/house-display-kiosk.desktop` and `~/.config/labwc/autostart`. |
| Browser opens then closes | On the Pi desktop, run `~/bin/house-display-kiosk.sh` and read the errors. Confirm Chromium is installed. |
| Blank page | The Pi needs Wi-Fi. Open `https://house-display.vercel.app` in a normal browser first. |
| Calendar cut off on the left | Settings → Orientation → **Horizontal** for a wide screen. |
| Weather says to add an API key | That key is saved per browser. Enter it in Settings on this Pi. |
