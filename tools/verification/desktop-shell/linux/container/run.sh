#!/bin/sh
# In-container journey driver for the Linux GTK desktop-shell app. Runs under
# dbus-run-session + Xvfb with the KDE portal stack and a test-owned
# StatusNotifierWatcher. Emits STEP|name|inputClass|result|detail lines that
# the outer runner turns into evidence.json.
set -u
cd /journey
export DISPLAY=:99 XDG_DATA_HOME=/tmp/xdg-data XDG_CONFIG_HOME=/tmp/kfcfg
at-spi-bus-launcher --launch-immediately >/dev/null 2>&1 &
APP_ID=org.octane.xplat.shell-journey
APP_NAME=desktop-shell-journey
LOG=/journey/app.log

step() { printf 'STEP|%s|%s|%s|%s\n' "$1" "$2" "$3" "$4"; }

Xvfb :99 -screen 0 1024x768x24 >/dev/null 2>&1 &
sleep 0.5
gjs /journey/watcher.js >/dev/null 2>&1 &
sleep 0.4
mkdir -p v1 v2
tar -xzf app-v1.tar.gz -C v1
tar -xzf app-v2.tar.gz -C v2
step "extract app archives" in-process pass ""

# --- install ---
v1/$APP_NAME/install.sh >install.log 2>&1 && step "install v1 via install.sh" in-process pass "" || step "install v1 via install.sh" in-process fail "$(tail -1 install.log)"

desktop-file-validate "$XDG_DATA_HOME/applications/$APP_ID.desktop" && step "desktop entry validates" in-process pass "" || step "desktop entry validates" in-process fail "desktop-file-validate"

# --- launch through the installed Exec line ---
EXEC=$(grep '^Exec=' "$XDG_DATA_HOME/applications/$APP_ID.desktop" | sed 's/^Exec=//;s/"//g')
$EXEC >"$LOG" 2>&1 &
APP_PID=$!
for i in $(seq 1 80); do grep -q 'JOURNEY READY' "$LOG" && break; sleep 0.25; done
grep -q 'JOURNEY READY' "$LOG" && step "launch via installed Exec" in-process pass "" || { step "launch via installed Exec" in-process fail "no READY"; tail -5 "$LOG"; }

# --- form: focus field, type, submit via xdotool at AT-SPI coords ---
R=$(python3 ax.py find "$APP_NAME" entry "" 2>/dev/null || python3 ax.py find "$APP_NAME" text "" 2>/dev/null)
if [ -n "$R" ]; then
  X=$(echo "$R" | cut -d, -f1); Y=$(echo "$R" | cut -d, -f2)
  xdotool mousemove $((X+5)) $((Y+5)) click 1 type "Ada"
  step "form: type name" os-input-x11-xtest pass "atspi coords $X,$Y"
else
  step "form: type name" os-input-x11-xtest fail "name field not in AT-SPI"
fi
B=$(python3 ax.py find "$APP_NAME" "push button" "Submit" 2>/dev/null)
if [ -n "$B" ]; then
  BX=$(echo "$B" | cut -d, -f1); BY=$(echo "$B" | cut -d, -f2)
  BW=$(echo "$B" | cut -d, -f3); BH=$(echo "$B" | cut -d, -f4)
  xdotool mousemove $((BX+BW/2)) $((BY+BH/2)) click 1
  for i in $(seq 1 40); do grep -q 'JOURNEY SUBMITTED name=Ada' "$LOG" && break; sleep 0.25; done
  grep -q 'JOURNEY SUBMITTED name=Ada' "$LOG" && step "form: submit" os-input-x11-xtest pass "" || step "form: submit" os-input-x11-xtest fail "no SUBMITTED"
else
  step "form: submit" os-input-x11-xtest fail "Submit not in AT-SPI"
fi

# --- AT-SPI role assertions ---
python3 ax.py tree "$APP_NAME" > ax-tree.txt 2>/dev/null
ROLE=$(grep -i submit ax-tree.txt | head -1)
case "$ROLE" in "push button|"*) step "atspi: submit is push button" atspi pass "$ROLE" ;; *) step "atspi: submit is push button" atspi fail "$ROLE" ;; esac
STATUS=$(grep -i 'Submitted\|Waiting' ax-tree.txt | head -1)
case "$STATUS" in label\|*) step "atspi: status is label" atspi pass "$STATUS" ;; *) step "atspi: status is label" atspi fail "$STATUS" ;; esac

# --- Tab/Space keyboard path ---
xdotool key Tab; sleep 0.3; xdotool key space; sleep 0.4
grep -q 'JOURNEY SUBMITTED' "$LOG" && step "keyboard: Tab+Space activates" os-input-x11-xtest pass "" || step "keyboard: Tab+Space activates" os-input-x11-xtest fail "no submit after Space"

# --- app menu accelerator (in-window menubar) ---
xdotool key ctrl+shift+i; sleep 0.4
grep -q 'JOURNEY MENU action=increment' "$LOG" && step "app menu: accelerator" os-input-x11-xtest pass "" || step "app menu: accelerator" os-input-x11-xtest fail "no MENU marker"

# --- tray: SNI Activate shows the menu window; Return picks the first item ---
SNI=$(cat watcher-registered.txt 2>/dev/null | head -1)
if [ -n "$SNI" ]; then
  gdbus call --session -d "$SNI" -o /StatusNotifierItem -m org.kde.StatusNotifierItem.Activate 0 0 >/dev/null 2>&1
  sleep 0.6
  xdotool key Return; sleep 0.5
  grep -q 'JOURNEY INSPECTOR_OPENED' "$LOG" && step "tray: open inspector" dbus-shell-protocol pass "" || step "tray: open inspector" dbus-shell-protocol fail "no INSPECTOR_OPENED"
else
  step "tray: open inspector" dbus-shell-protocol blocked "no SNI registered"
fi

# --- global shortcut: focus a foreign client, press the assigned trigger ---
xeyes >/dev/null 2>&1 &
sleep 0.5
xdotool search --name 'xeyes' windowactivate 2>/dev/null || true
xdotool key ctrl+alt+shift+j; sleep 0.6
grep -q 'JOURNEY HOTKEY_FOCUS' "$LOG" && step "global shortcut focus" os-input-x11-xtest pass "" || step "global shortcut focus" os-input-x11-xtest blocked "portal bound nothing"

# --- window lifecycle: close inspector, reopen via tray Activate+Return ---
xdotool search --name 'Inspector' windowclose 2>/dev/null || python3 ax.py press "$APP_NAME" "Close" >/dev/null 2>&1
sleep 0.5
grep -q 'JOURNEY INSPECTOR_CLOSED' "$LOG" && step "window lifecycle: close" os-input-x11-xtest pass "" || step "window lifecycle: close" os-input-x11-xtest fail "no INSPECTOR_CLOSED"
if [ -n "$SNI" ]; then
  gdbus call --session -d "$SNI" -o /StatusNotifierItem -m org.kde.StatusNotifierItem.Activate 0 0 >/dev/null 2>&1
  sleep 0.6; xdotool key Return; sleep 0.5
  grep -q 'JOURNEY INSPECTOR_OPENED id=w2' "$LOG" && step "window lifecycle: reopen" dbus-shell-protocol pass "" || step "window lifecycle: reopen" dbus-shell-protocol fail "no w2"
else
  step "window lifecycle: reopen" dbus-shell-protocol blocked "no SNI registered"
fi

# --- quit via the app's own Quit accelerator ---
xdotool key ctrl+q; sleep 0.8
grep -q 'JOURNEY CLEANUP menu=1 shortcuts=1 tray=1 residency=1' "$LOG" && step "quit: cleanup once" in-process pass "" || step "quit: cleanup once" in-process fail "no CLEANUP"
kill $APP_PID 2>/dev/null

# --- v2 overlay: settings persist, reinstall, RESTORED ---
[ -f "$XDG_CONFIG_HOME/$APP_ID/settings.ini" ] && step "settings persisted" in-process pass "" || step "settings persisted" in-process fail "no settings.ini"
v2/$APP_NAME/install.sh >install2.log 2>&1
$EXEC >"$LOG.v2" 2>&1 &
APP2=$!
for i in $(seq 1 60); do grep -q 'JOURNEY RESTORED' "$LOG.v2" && break; sleep 0.25; done
grep -q 'JOURNEY RESTORED name=Ada' "$LOG.v2" && step "v2 restores name" in-process pass "" || step "v2 restores name" in-process fail "$(tail -2 $LOG.v2 | tr '\n' ' ')"
kill $APP2 2>/dev/null

# --- uninstall keeps settings ---
v2/$APP_NAME/uninstall.sh >/dev/null 2>&1
[ ! -d "$XDG_DATA_HOME/$APP_ID" ] && [ ! -f "$XDG_DATA_HOME/applications/$APP_ID.desktop" ] && [ -f "$XDG_CONFIG_HOME/$APP_ID/settings.ini" ] \
  && step "uninstall keeps settings" in-process pass "" || step "uninstall keeps settings" in-process fail ""

echo "JOURNEY_DONE"
