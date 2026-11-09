FROM debian:trixie
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    gjs gir1.2-glib-2.0 gir1.2-gtk-4.0 xvfb xdotool \
    dbus dbus-x11 x11-utils x11-apps \
    python3 python3-gi python3-pyatspi gir1.2-atspi-2.0 at-spi2-core \
    desktop-file-utils libglib2.0-bin \
    xdg-desktop-portal xdg-desktop-portal-kde kglobalacceld \
 && rm -rf /var/lib/apt/lists/*
COPY app.tar.gz watcher.js ax.py run.sh /journey/
RUN chmod +x /journey/run.sh
WORKDIR /journey
ENTRYPOINT ["/journey/run.sh"]
