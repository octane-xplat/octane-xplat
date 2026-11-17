FROM debian:trixie
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    gjs gir1.2-glib-2.0 gir1.2-gtk-4.0 xvfb xdotool \
    dbus dbus-x11 x11-utils x11-apps \
    xdg-desktop-portal xdg-desktop-portal-kde kglobalacceld libglib2.0-bin \
 && rm -rf /var/lib/apt/lists/*
RUN printf '[Desktop Entry]\nType=Application\nName=Global Shortcuts Probe\nExec=/bin/true\n' > /usr/share/applications/org.octane.GlobalShortcutsProbe.desktop
COPY bundle.mjs /probe/bundle.mjs
COPY run.sh /probe/run.sh
RUN chmod +x /probe/run.sh
ENTRYPOINT ["/probe/run.sh"]
