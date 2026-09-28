# Container image for the gjs-host bridge smoke test (see container-smoke.sh).
#   docker build -t xplat-linux-host apps/linux/host
#   docker run --rm --shm-size=1g --security-opt seccomp=unconfined \
#     -v <repo>:/work -w /work/apps/linux/host xplat-linux-host
FROM debian:trixie

RUN apt-get update && apt-get install -y --no-install-recommends \
	gjs libgtk-4-1 gir1.2-gtk-4.0 libadwaita-1-0 gir1.2-adw-1 \
	libwebkitgtk-6.0-4 gir1.2-webkit-6.0 libsecret-1-0 gir1.2-secret-1 \
	dbus xvfb xauth python3 gnome-keyring notification-daemon \
	&& rm -rf /var/lib/apt/lists/*

# WebKitGTK's bubblewrap sandbox can't create namespaces in a container;
# Xvfb has no GL — force compositing/DMA-BUF off.
ENV WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1 \
	WEBKIT_DISABLE_COMPOSITING_MODE=1 \
	LIBGL_ALWAYS_SOFTWARE=1 \
	GTK_A11Y=none

CMD ["sh", "container-smoke.sh"]
