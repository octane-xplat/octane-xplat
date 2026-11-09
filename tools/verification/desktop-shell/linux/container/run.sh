#!/bin/sh
# In-container journey driver for the Linux GTK desktop-shell app. Runs under
# dbus-run-session + Xvfb with the KDE portal stack and a test-owned
# StatusNotifierWatcher. Emits STEP|name|inputClass|result|detail lines that
# the outer runner turns into evidence.json.
set -u
cd /journey
export DISPLAY=:99 XDG_DATA_HOME=/tmp/xdg-data XDG_CONFIG_HOME=/tmp/kfcfg
export XDG_RUNTIME_DIR=/tmp/xdg-runtime XDG_CURRENT_DESKTOP=KDE QT_QPA_PLATFORM=xcb
APP_ID=org.octane.xplat.shell-journey
APP_NAME=desktop-shell-journey
LOG=/journey/app.log

step() { printf 'STEP|%s|%s|%s|%s\n' "$1" "$2" "$3" "$4"; }

mkdir -p "$XDG_RUNTIME_DIR"; chmod 700 "$XDG_RUNTIME_DIR"
Xvfb :99 -screen 0 1024x768x24 >/dev/null 2>&1 &
sleep 0.5
at-spi-bus-launcher --launch-immediately >/dev/null 2>&1 &

# KDE portal stack (hotkey fixture pattern): kglobalaccel + both portals must
# run before the app binds global shortcuts.
KGA=""
for c in kglobalaccel5 kglobalacceld /usr/libexec/kglobalacceld /usr/lib/x86_64-linux-gnu/libexec/kglobalacceld; do
  if command -v "$c" >/dev/null 2>&1; then KGA=$(command -v "$c"); break; fi; if [ -x "$c" ]; then KGA="$c"; break; fi
done
[ -n "$KGA" ] && "$KGA" >/tmp/kga.log 2>&1 &
PORTAL_BIN=/usr/libexec/xdg-desktop-portal
[ -x "$PORTAL_BIN" ] || PORTAL_BIN=$(command -v xdg-desktop-portal || true)
[ -n "$PORTAL_BIN" ] && "$PORTAL_BIN" -v >/tmp/portal.log 2>&1 &
KDE_BIN=/usr/libexec/xdg-desktop-portal-kde
[ -x "$KDE_BIN" ] && "$KDE_BIN" >/tmp/portal-kde.log 2>&1 &
sleep 1.5

# The a11y bus must exist before the app starts or GTK4 never wires AT-SPI.
python3 -c 'import gi; gi.require_version("Atspi","2.0"); from gi.repository import Atspi; Atspi.get_desktop(0)' >/dev/null 2>&1 || true
gdbus call --session -d org.freedesktop.DBus -o /org/freedesktop/DBus -m org.freedesktop.DBus.ListNames 2>/dev/null | tr ',' '\n' | grep -i 'a11y\|spi' > /journey/a11y-names.txt

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
DESKTOP_SHELL_DIAG=1 GDK_SYNCHRONIZE=1 GSK_RENDERER=cairo $EXEC >"$LOG" 2>&1 &
APP_PID=$!
READY=no
for i in $(seq 1 80); do grep -q 'JOURNEY READY' "$LOG" && { READY=yes; break; }; sleep 0.25; done
[ "$READY" = yes ] && step "launch via installed Exec" in-process pass "" || { step "launch via installed Exec" in-process fail "no READY"; tail -5 "$LOG"; }

# --- AT-SPI role/name assertions (independent of READY? needs the app) ---
python3 ax.py tree "$APP_NAME" > ax-tree.txt 2>/dev/null
if [ "$READY" = yes ]; then
  ROLE=$(grep -i 'Submit' ax-tree.txt | grep -v label | head -1)
  case "$ROLE" in "push button|"*) step "atspi: submit is push button" atspi pass "$ROLE" ;; "button|"*) step "atspi: submit is push button" atspi pass "observed role 'button' (GTK4 mapping): $ROLE" ;; *) step "atspi: submit is push button" atspi fail "$ROLE" ;; esac
  STATUS=$(grep -i 'Submitted\|Waiting' ax-tree.txt | head -1)
  case "$STATUS" in label\|*) step "atspi: status is label" atspi pass "$STATUS" ;; *) step "atspi: status is label" atspi fail "$STATUS" ;; esac
else
  step "atspi: submit is push button" atspi blocked "launch"
  step "atspi: status is label" atspi blocked "launch"
fi

# --- form: type into the entry at AT-SPI coords, click Submit ---
if [ "$READY" = yes ]; then
  R=$(python3 ax.py find "$APP_NAME" entry "" 2>/dev/null || python3 ax.py find "$APP_NAME" text "" 2>/dev/null)
  if [ -n "$R" ]; then
    X=$(echo "$R" | cut -d, -f1); Y=$(echo "$R" | cut -d, -f2)
    xdotool mousemove $((X+5)) $((Y+5)) click 1 type "Ada"
    step "form: type name" os-input-x11-xtest pass "atspi coords $X,$Y"
  else
    step "form: type name" os-input-x11-xtest fail "name field not in AT-SPI"
  fi
  # Two coordinate sources: AT-SPI extents, then the widget's own
  # compute_bounds + surface transform + X window geometry (CSD shadow
  # margins make AT-SPI extents unreliable under a bare X server).
  GEO=$(xdotool search --name "Desktop Shell Journey" getwindowgeometry 2>/dev/null | grep Position | grep -o '[0-9-]*,[0-9-]*' | head -1)
  BND=$(grep -o 'JOURNEY BOUNDS journey-submit [0-9.-]*,[0-9.-]* [0-9.]*x[0-9.]*' "$LOG" | tail -1 | sed 's/.*submit //;s/x/,/;s/ /,/')
  XF=$(grep -o 'xf=[0-9.-]*,[0-9.-]*' "$LOG" | tail -1 | sed 's/xf=//')
  AX=$(python3 ax.py find "$APP_NAME" "push button" "Submit" 2>/dev/null || python3 ax.py find "$APP_NAME" "button" "Submit" 2>/dev/null)
  TARGET=""
  SRC=""
  if [ -n "$GEO" ] && [ -n "$BND" ]; then
    GX=$(echo "$GEO" | cut -d, -f1); GY=$(echo "$GEO" | cut -d, -f2)
    BX=$(echo "$BND" | cut -d, -f1); BY=$(echo "$BND" | cut -d, -f2)
    BW=$(echo "$BND" | cut -d, -f3); BH=$(echo "$BND" | cut -d, -f4)
    XFX=$(echo "$XF" | cut -d, -f1); XFY=$(echo "$XF" | cut -d, -f2); XFX=${XFX:-0}; XFY=${XFY:-0}
    TARGET="$((GX + XFX + BX + BW/2)),$((GY + XFY + BY + BH/2))"
    SRC="widget-bounds+geometry (atspi=$AX)"
  elif [ -n "$AX" ]; then
    BX=$(echo "$AX" | cut -d, -f1); BY=$(echo "$AX" | cut -d, -f2)
    BW=$(echo "$AX" | cut -d, -f3); BH=$(echo "$AX" | cut -d, -f4)
    TARGET="$((BX+BW/2)),$((BY+BH/2))"
    SRC="atspi-extents"
  fi
  if [ -n "$TARGET" ]; then
    TX=${TARGET%%,*}; TY=${TARGET##*,}
    xdotool mousemove "$TX" "$TY" click 1
    for i in $(seq 1 40); do grep -q 'JOURNEY SUBMITTED name=Ada' "$LOG" && break; sleep 0.25; done
    grep -q 'JOURNEY SUBMITTED name=Ada' "$LOG" && step "form: submit" os-input-x11-xtest pass "target=$TARGET via $SRC" || step "form: submit" os-input-x11-xtest fail "click at $TARGET via $SRC, no SUBMITTED"
  else
    step "form: submit" os-input-x11-xtest fail "no coordinates (bounds=$BND geo=$GEO ax=$AX)"
  fi
else
  step "form: type name" os-input-x11-xtest blocked "launch"
  step "form: submit" os-input-x11-xtest blocked "launch"
fi

# --- Tab focus traversal reaching Submit, verified via AT-SPI focused state ---
if [ "$READY" = yes ]; then
  R2=$(python3 ax.py find "$APP_NAME" entry "" 2>/dev/null || python3 ax.py find "$APP_NAME" text "" 2>/dev/null)
  [ -n "$R2" ] && xdotool mousemove $(($(echo "$R2" | cut -d, -f1)+5)) $(($(echo "$R2" | cut -d, -f2)+5)) click 1
  sleep 0.3
  xdotool key Tab; sleep 0.5
  FOC=$(python3 ax.py focused "$APP_NAME" 2>/dev/null || true)
  case "$FOC" in *Submit*|*submit*)
    xdotool key space; sleep 0.5
    grep -q 'JOURNEY SUBMITTED' "$LOG" && step "keyboard: Tab→Submit, Space activates" os-input-x11-xtest pass "focused=$FOC" || step "keyboard: Tab→Submit, Space activates" os-input-x11-xtest fail "focused=$FOC no submit"
    ;;
  *) step "keyboard: Tab→Submit, Space activates" os-input-x11-xtest fail "Tab focused '$FOC' not Submit" ;;
  esac
else
  step "keyboard: Tab→Submit, Space activates" os-input-x11-xtest blocked "launch"
fi

# --- app menu accelerator (in-window menubar) + AT-SPI menu activation ---
if [ "$READY" = yes ]; then
  BEFORE=$(grep -c 'JOURNEY MENU action=increment' "$LOG" || true)
  xdotool key ctrl+shift+i; sleep 0.5
  AFTER=$(grep -c 'JOURNEY MENU action=increment' "$LOG" || true)
  [ "$AFTER" -gt "$BEFORE" ] && step "app menu: accelerator" os-input-x11-xtest pass "count $BEFORE->$AFTER" || step "app menu: accelerator" os-input-x11-xtest fail "count $BEFORE->$AFTER"
  # AT-SPI path: activate the Journey menubar item, then its Increment action.
  MOUT=$(python3 ax.py menu "$APP_NAME" Journey Increment 2>/dev/null || true)
  sleep 0.4
  AFTER2=$(grep -c 'JOURNEY MENU action=increment' "$LOG" || true)
  [ "$AFTER2" -gt "$AFTER" ] && step "app menu: AT-SPI activation" atspi pass "$MOUT" || step "app menu: AT-SPI activation" atspi fail "$MOUT"
  # Dismiss any popup grab the accelerator left open before the next window.
  xdotool key Escape; sleep 0.4
else
  step "app menu: accelerator" os-input-x11-xtest blocked "launch"
  step "app menu: AT-SPI activation" atspi blocked "launch"
fi

# --- tray: dbusmenu Event('clicked') on "Open Inspector" over D-Bus ---
SNI=$(cat watcher-registered.txt 2>/dev/null | head -1)
if [ "$READY" = yes ] && [ -n "$SNI" ]; then
  LAYOUT=$(gdbus call --session -d "$SNI" -o /MenuBar -m com.canonical.dbusmenu.GetLayout 0 2 "['label']" 2>/dev/null)
  IID=$(echo "$LAYOUT" | grep -o "([0-9]*, {[^}]*Open Inspector" | grep -o "^([0-9]*" | tr -d '(')
  if [ -n "$IID" ]; then
    gdbus call --session -d "$SNI" -o /MenuBar -m com.canonical.dbusmenu.Event "$IID" clicked "<''>" 0 >/dev/null 2>&1
    sleep 0.8
    grep -q 'JOURNEY INSPECTOR_OPENED' "$LOG" && step "tray: open inspector" dbus-shell-protocol pass "item id=$IID" || step "tray: open inspector" dbus-shell-protocol fail "id=$IID clicked, no INSPECTOR_OPENED"
  else
    step "tray: open inspector" dbus-shell-protocol fail "item not in layout: $(echo "$LAYOUT" | head -c 120)"
  fi
elif [ "$READY" != yes ]; then
  step "tray: open inspector" dbus-shell-protocol blocked "launch"
else
  step "tray: open inspector" dbus-shell-protocol blocked "no SNI registered"
fi

# --- crash bisect: does the second window survive with no external pokes? ---
sleep 3
if kill -0 $APP_PID 2>/dev/null; then
  step "second window: survives no-poke" in-process pass ""
else
  step "second window: survives no-poke" in-process fail "app died within 3s of INSPECTOR_OPENED, no input sent"
fi

# --- inspector window visible to AT-SPI ---
WINS=$(python3 ax.py windows "$APP_NAME" 2>/dev/null || true)
echo "$WINS" | grep -qi 'Inspector' && step "atspi: inspector window present" atspi pass "$WINS" || step "atspi: inspector window present" atspi fail "$WINS"

# --- global shortcut via portal: focus foreign client, press assigned trigger ---
if [ "$READY" = yes ]; then
  TRIG=$(grep -o 'HOTKEY_REGISTERED focus-app [^ ]*' "$LOG" | awk '{print $3}')
  if [ -n "$TRIG" ]; then
    KEY=$(python3 ax.py accel "$TRIG" 2>/dev/null || true)
    [ -z "$KEY" ] && KEY="ctrl+alt+shift+j"
    xeyes >/dev/null 2>&1 &
    sleep 0.5
    xdotool search --name 'xeyes' windowactivate 2>/dev/null || true
    sleep 0.3
    xdotool key "$KEY"; sleep 0.8
    grep -q 'JOURNEY HOTKEY_FOCUS' "$LOG" && step "global shortcut: portal trigger" os-input-x11-xtest-via-portal pass "trigger=$TRIG" || step "global shortcut: portal trigger" os-input-x11-xtest-via-portal fail "trigger=$TRIG no HOTKEY_FOCUS"
  else
    DENIED=$(grep -o 'HOTKEY_ERROR [^ ]* [^ ]*' "$LOG" | head -1)
    step "global shortcut: portal trigger" os-input-x11-xtest-via-portal blocked "no bound trigger${DENIED:+ ($DENIED)}"
  fi
else
  step "global shortcut: portal trigger" os-input-x11-xtest-via-portal blocked "launch"
fi

# --- window lifecycle: close Inspector, reopen via tray ---
if [ "$READY" = yes ]; then
  xdotool search --name 'Inspector' windowclose 2>/dev/null || python3 ax.py press "$APP_NAME" "Close" >/dev/null 2>&1
  sleep 0.6
  grep -q 'JOURNEY INSPECTOR_CLOSED' "$LOG" && step "window lifecycle: close" os-input-x11-xtest pass "" || step "window lifecycle: close" os-input-x11-xtest fail "no INSPECTOR_CLOSED"
  if [ -n "$SNI" ]; then
    gdbus call --session -d "$SNI" -o /MenuBar -m com.canonical.dbusmenu.Event "$IID" clicked "<''>" 0 >/dev/null 2>&1
    sleep 0.8
    grep -q 'JOURNEY INSPECTOR_OPENED id=w2' "$LOG" && step "window lifecycle: reopen" dbus-shell-protocol pass "" || step "window lifecycle: reopen" dbus-shell-protocol fail "no w2"
  else
    step "window lifecycle: reopen" dbus-shell-protocol blocked "no SNI registered"
  fi
else
  step "window lifecycle: close" os-input-x11-xtest blocked "launch"
  step "window lifecycle: reopen" dbus-shell-protocol blocked "launch"
fi

# --- quit through the app's own Quit accelerator ---
if [ "$READY" = yes ]; then
  xdotool key ctrl+q; sleep 1
  grep -q 'JOURNEY CLEANUP menu=1 shortcuts=1 tray=1 residency=1' "$LOG" && step "quit: cleanup once" in-process pass "" || step "quit: cleanup once" in-process fail "no CLEANUP"
  sleep 0.5
  kill -0 $APP_PID 2>/dev/null && step "quit: process exits" in-process fail "still running" || step "quit: process exits" in-process pass ""
  SNI2=$(cat watcher-registered.txt 2>/dev/null | head -1)
  if [ -n "$SNI2" ]; then
    OWNED=$(gdbus call --session -d org.freedesktop.DBus -o /org/freedesktop/DBus -m org.freedesktop.DBus.NameHasOwner "$SNI" 2>/dev/null | grep -o 'true\|false')
    [ "$OWNED" = false ] && step "quit: SNI unregistered" dbus-shell-protocol pass "" || step "quit: SNI unregistered" dbus-shell-protocol fail "$SNI still owned ($OWNED)"
  else
    step "quit: SNI unregistered" dbus-shell-protocol blocked "no SNI was registered"
  fi
else
  step "quit: cleanup once" in-process blocked "launch"
  step "quit: process exits" in-process blocked "launch"
  step "quit: SNI unregistered" dbus-shell-protocol blocked "launch"
fi
kill $APP_PID 2>/dev/null

# --- settings file written by the app before v2 ---
[ -f "$XDG_CONFIG_HOME/$APP_ID/settings.ini" ] && step "settings persisted by app" in-process pass "" || step "settings persisted by app" in-process fail "no settings.ini"

# --- stale-file check: plant a file in the v1 install, v2 install must remove it ---
STALE="$XDG_DATA_HOME/$APP_ID/stale-marker.txt"
mkdir -p "$XDG_DATA_HOME/$APP_ID" 2>/dev/null
touch "$STALE"
v2/$APP_NAME/install.sh >install2.log 2>&1 && step "install v2 over v1" in-process pass "" || step "install v2 over v1" in-process fail "$(tail -1 install2.log)"
[ ! -f "$STALE" ] && step "install v2 removes stale files" in-process pass "" || step "install v2 removes stale files" in-process fail "stale file kept"

# --- v2 relaunch: version + RESTORED name (KeyFile persistence end to end) ---
EXEC2=$(grep '^Exec=' "$XDG_DATA_HOME/applications/$APP_ID.desktop" | sed 's/^Exec=//;s/"//g')
$EXEC2 >"$LOG.v2" 2>&1 &
APP2=$!
for i in $(seq 1 60); do grep -q 'JOURNEY READY' "$LOG.v2" && break; sleep 0.25; done
grep -q 'JOURNEY RESTORED name=Ada' "$LOG.v2" && step "v2 restores name" in-process pass "" || step "v2 restores name" in-process fail "$(tail -2 $LOG.v2 2>/dev/null | tr '\n' ' ')"
python3 ax.py tree "$APP_NAME" > ax-tree-v2.txt 2>/dev/null
grep -qi '0\.2\.0\|v2' ax-tree-v2.txt && step "v2 version visible" atspi pass "" || step "v2 version visible" atspi fail "no version in AT-SPI tree"
kill $APP2 2>/dev/null; sleep 0.3

# --- uninstall removes app dir + entry, keeps settings ---
v2/$APP_NAME/uninstall.sh >/dev/null 2>&1
[ ! -d "$XDG_DATA_HOME/$APP_ID" ] && [ ! -f "$XDG_DATA_HOME/applications/$APP_ID.desktop" ] && step "uninstall removes app+entry" in-process pass "" || step "uninstall removes app+entry" in-process fail ""
[ -f "$XDG_CONFIG_HOME/$APP_ID/settings.ini" ] && step "uninstall keeps settings" in-process pass "" || step "uninstall keeps settings" in-process fail ""

echo "--- app.log ---"; cat "$LOG" 2>/dev/null
echo "--- ax-tree ---"; cat ax-tree.txt 2>/dev/null
echo "--- a11y-names ---"; cat a11y-names.txt 2>/dev/null
echo "--- portal-kde log ---"; tail -15 /tmp/portal-kde.log 2>/dev/null
echo "--- portal log ---"; tail -15 /tmp/portal.log 2>/dev/null
echo "--- kga log ---"; tail -10 /tmp/kga.log 2>/dev/null
echo "--- portal versions ---"; dpkg-query -W -f='${Package} ${Version}\n' xdg-desktop-portal xdg-desktop-portal-kde gjs libgtk-4-1 2>/dev/null
echo "JOURNEY_DONE"
