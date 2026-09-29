#!/bin/sh
# container-smoke.sh — runs gjs-host under Xvfb + a real D-Bus session inside
# a Linux container (OrbStack/docker). Exercises the bridge over BOTH load
# paths: the packaged xplat:// scheme (serving apps/linux/dist) and plain http
# (python static server — stands in for the vite dev server).
#
#   docker build -t xplat-linux-host apps/linux/host
#   docker run --rm --shm-size=1g --security-opt seccomp=unconfined \
#     -v <repo>:/work -w /work/apps/linux/host xplat-linux-host
set -e

# Static server for the http leg.
(cd /work/apps/linux/dist && python3 -m http.server 5201 >/dev/null 2>&1 &)

# xvfb-run hangs when it is container PID 1 (xauth/readiness loop) — drive
# Xvfb directly.
Xvfb :99 -screen 0 1280x1024x24 >/dev/null 2>&1 &
sleep 1
export DISPLAY=:99 GTK_A11Y=none

# dbus-run-session gives us a private session bus; gnome-keyring provides
# org.freedesktop.secrets — unlocked non-interactively with an empty password
# (fresh container: creates an unlocked "login" keyring, no prompter needed).
exec dbus-run-session -- sh -c '
	gnome-keyring-daemon --unlock --components=secrets </dev/null >/dev/null 2>&1 || true
	gnome-keyring-daemon --start --components=secrets >/dev/null 2>&1 || true
	# Debian ships no D-Bus activation file for notification-daemon — start it
	# directly; it claims org.freedesktop.Notifications on the session bus.
	/usr/lib/notification-daemon/notification-daemon >/dev/null 2>&1 &

	echo "=== xplat:// scheme leg ==="
	timeout 90 gjs gjs-host.js --self-test --bundle /work/apps/linux/dist xplat://localhost/
	echo "=== http leg ==="
	timeout 90 gjs gjs-host.js --self-test http://127.0.0.1:5201
'
