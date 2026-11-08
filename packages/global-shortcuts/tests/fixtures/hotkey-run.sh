#!/usr/bin/env bash
# Container orchestration for the XDG GlobalShortcuts portal fixture: Xvfb ->
# dbus session -> kglobalaccel -> xdg-desktop-portal (+kde backend) -> GJS
# bundle -> xdotool input phases with a foreign window focused.
set -u
export DISPLAY=:99
export XDG_RUNTIME_DIR=/tmp/xdg-runtime
export XDG_CURRENT_DESKTOP=KDE
export QT_QPA_PLATFORM=xcb
mkdir -p "$XDG_RUNTIME_DIR"; chmod 700 "$XDG_RUNTIME_DIR"

Xvfb :99 -screen 0 1280x800x24 >/tmp/xvfb.log 2>&1 &
sleep 1

dbus-run-session -- bash -c '
set -u
export DISPLAY=:99 XDG_RUNTIME_DIR=/tmp/xdg-runtime XDG_CURRENT_DESKTOP=KDE QT_QPA_PLATFORM=xcb

KGA=""
for c in kglobalaccel5 kglobalacceld /usr/libexec/kglobalacceld /usr/lib/x86_64-linux-gnu/libexec/kglobalacceld; do
  if command -v "$c" >/dev/null 2>&1; then KGA=$(command -v "$c"); break; fi; if [ -x "$c" ]; then KGA="$c"; break; fi
done
echo "kglobalaccel binary: ${KGA:-MISSING}"
if [ -n "$KGA" ]; then QT_QPA_PLATFORM=xcb "$KGA" >/tmp/kga.log 2>&1 & fi
sleep 1

PORTAL_BIN=/usr/libexec/xdg-desktop-portal
[ -x "$PORTAL_BIN" ] || PORTAL_BIN=$(command -v xdg-desktop-portal || true)
echo "portal binary: ${PORTAL_BIN:-MISSING}"
[ -n "$PORTAL_BIN" ] && "$PORTAL_BIN" -v >/tmp/portal.log 2>&1 &
sleep 1
KDE_BIN=/usr/libexec/xdg-desktop-portal-kde
if [ -x "$KDE_BIN" ]; then
  "$KDE_BIN" >/tmp/portal-kde.log 2>&1 &
  echo "kde backend started explicitly"
else
  echo "kde backend binary missing"
fi
sleep 2

echo "--- portal names on session bus ---"
gdbus call --session -d org.freedesktop.DBus -o /org/freedesktop/DBus -m org.freedesktop.DBus.ListNames 2>&1 | tr "," "\n" | grep -i -E "portal|kglobal" || true
echo "--- end names ---"

rm -f /tmp/ghk-cmd
gjs -m /probe/bundle.mjs >/tmp/gjs.log 2>&1 &
GJSPID=$!

for i in $(seq 1 60); do grep -q "GHK bound" /tmp/gjs.log 2>/dev/null && break; sleep 0.5; done
echo "--- gjs log (startup) ---"; cat /tmp/gjs.log; echo "---"
grep -q "GHK bound" /tmp/gjs.log || { echo "GHK_LINUX_FAIL no bind"; cat /tmp/portal-kde.log 2>/dev/null; exit 1; }

# The desktop-reported trigger drives the injected chord (usually the
# preferred trigger). Map the label to xdotool syntax.
TRIGGER=$(grep -o "GHK bound trigger=.*" /tmp/gjs.log | tail -1 | sed "s/.*trigger=//")
echo "assigned trigger: $TRIGGER"
XDOTOOL_KEY=$(echo "$TRIGGER" | tr "[:upper:]" "[:lower:]" | sed -e "s/meta/super/g" -e "s/command/super/g" -e "s/logo/super/g" -e "s/ctrl/control/g" -e "s/alt/alt/g" -e "s/+k$/+k/" )
echo "xdotool key: $XDOTOOL_KEY"

xeyes >/tmp/xeyes.log 2>&1 &
sleep 1
xdotool search --sync --class xeyes windowfocus --sync 2>/dev/null || true
sleep 0.5
echo "FOCUSED_WINDOW=$(xdotool getwindowfocus getwindowname 2>&1)"

ACT1=$(grep -c "GHK ACTIVATED" /tmp/gjs.log 2>/dev/null || true)
xdotool key "$XDOTOOL_KEY"
sleep 1.5
ACT2=$(grep -c "GHK ACTIVATED" /tmp/gjs.log 2>/dev/null || true)
echo "PHASE1 activated before=$ACT1 after=$ACT2"
[ "$ACT2" -gt "$ACT1" ] || { echo "GHK_LINUX_FAIL no activation from xdotool input"; cat /tmp/gjs.log; exit 1; }

echo close > /tmp/ghk-cmd
for i in $(seq 1 20); do grep -q "GHK UNBOUND" /tmp/gjs.log 2>/dev/null && break; sleep 0.5; done
grep -q "GHK UNBOUND" /tmp/gjs.log || { echo "GHK_LINUX_FAIL no unbind"; cat /tmp/gjs.log; exit 1; }
ACT3=$(grep -c "GHK ACTIVATED" /tmp/gjs.log 2>/dev/null || true)
xdotool key "$XDOTOOL_KEY"
sleep 1.5
ACT4=$(grep -c "GHK ACTIVATED" /tmp/gjs.log 2>/dev/null || true)
echo "PHASE2 activated pre-unbind=$ACT3 post-unbind=$ACT4"
[ "$ACT4" -eq "$ACT3" ] || { echo "GHK_LINUX_FAIL delivery after unregister"; cat /tmp/gjs.log; exit 1; }

echo exit > /tmp/ghk-cmd
for i in $(seq 1 20); do grep -q "GHK DONE" /tmp/gjs.log 2>/dev/null && break; sleep 0.5; done
kill $GJSPID 2>/dev/null || true
echo "=== gjs log ==="; cat /tmp/gjs.log
echo "=== portal log ==="; cat /tmp/portal.log
grep -q "GHK GTK_FAIL" /tmp/gjs.log && { echo "GHK_LINUX_FAIL fixture error"; exit 1; }
echo "GHK_LINUX_OK"
'
