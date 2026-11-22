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
sudo apt install -y git chromium
```

On some images the browser package is `chromium-browser` instead of `chromium`:

```bash
sudo apt install -y chromium-browser
```

Confirm:

```bash
git --version
chromium --version || chromium-browser --version
```

---

## Part B — House display (kiosk)

### B1. Clone the repo

```bash
cd ~
git clone https://github.com/Zamy97/house-display.git
cd ~/house-display
```

### B2. Run the installer

```bash
cd ~/house-display
chmod +x scripts/pi-kiosk/*.sh
./scripts/pi-kiosk/install.sh
```

This will:

- Create `~/.config/autostart/house-display-kiosk.desktop`
- Also append to `~/.config/labwc/autostart` (Bookworm/Trixie Wayland desktop)
- Open Chromium to `https://house-display.vercel.app/` when a desktop session is already up

The mouse cursor stays visible so you can open Settings.

If you ran the installer over **SSH**, Chromium cannot open yet (no desktop). That is expected. Desktop Autologin from A3, then reboot, and the display starts on the attached screen.

Log file:

```bash
tail -f ~/house-display-kiosk.log
```

To leave the kiosk (Wi-Fi, desktop):

```bash
~/house-display/scripts/pi-kiosk/stop-kiosk.sh
```

There is also a **Stop House Display** icon on the desktop.

### B3. Configure the house in Settings

1. Click the **gear** in the top-right corner.
2. Set that house’s location, prayer method, and OpenWeather key.
3. Set **Orientation** to **Horizontal** when the screen is wide. Vertical on a wide screen cuts off the calendar.
4. Save.
5. Reboot once and confirm it comes back full screen by itself:

```bash
sudo reboot
```

Settings live in `~/.config/house-display-kiosk/chromium`. A different browser, or a fresh profile, does not have them yet.

### B4. Uninstall / stop autostart

```bash
cd ~/house-display
./scripts/pi-kiosk/uninstall.sh
```

This removes the desktop and labwc autostart lines and closes Chromium. The repo and saved settings stay on the Pi.

---

## If something looks wrong

| What you see | What to do |
| --- | --- |
| `No graphical session` in the log | Installer was run over SSH. Enable **Desktop Autologin**, then `sudo reboot`. |
| Black screen / no browser after reboot | Check `~/.config/autostart/house-display-kiosk.desktop` and `~/.config/labwc/autostart`. Then `tail ~/house-display-kiosk.log`. |
| Browser opens then closes | Run `~/house-display/scripts/pi-kiosk/start-kiosk.sh` from the Pi desktop (not plain SSH) and read the errors. Confirm Chromium is installed. |
| Blank page | The Pi needs Wi-Fi. Open `https://house-display.vercel.app` in a normal browser first. |
| Calendar cut off on the left | Settings → Orientation → **Horizontal** for a wide screen. |
| Weather says to add an API key | That key is saved per browser. Enter it in Settings on this Pi. |
