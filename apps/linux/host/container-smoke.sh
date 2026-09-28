#!/bin/sh
# container-smoke.sh — runs gjs-host under Xvfb + a real D-Bus session inside
# a Linux container (OrbStack/docker). Usage:
#   docker run --rm --shm-size=1g --security-opt seccomp=unconfined \
#     -e WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1 \
#     -e WEBKIT_DISABLE_COMPOSITING_MODE=1 -e LIBGL_ALWAYS_SOFTWARE=1 \
#     -e GTK_A11Y=none -v <repo>:/work -w /work/apps/linux/host \
#     debian:trixie sh -c '<apt install …> && sh container-smoke.sh'
set -e

# Static server for the built bundle (independent of vite).
(cd /work/apps/linux/dist && python3 -m http.server 5201 >/dev/null 2>&1 &)
sleep 1

# dbus-run-session gives us a private session bus; gnome-keyring provides
# org.freedesktop.secrets — unlocked non-interactively with an empty password
# (fresh container: creates an unlocked "login" keyring, no prompter needed).
exec xvfb-run -a dbus-run-session -- sh -c '
	set -e
	gnome-keyring-daemon --unlock --components=secrets </dev/null >/dev/null 2>&1 || true
	gnome-keyring-daemon --start --components=secrets >/dev/null 2>&1 || true
	# Debian ships no D-Bus activation file for notification-daemon — start it
	# directly; it claims org.freedesktop.Notifications on the session bus.
	/usr/lib/notification-daemon/notification-daemon >/dev/null 2>&1 &
	timeout 90 gjs gjs-host.js --self-test http://127.0.0.1:5201
'
