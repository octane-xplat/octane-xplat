# Ubuntu 24.04 baseline for platforms/linux/prebuilt — GTK 4.14 headers,
# glibc 2.39. Build the image next to a pinned nativescript-mason checkout,
# then run build-prebuilt.sh inside it:
#
#   docker build --platform linux/<amd64|arm64> -t xplat-linux-prebuilt .
#   docker run --rm --platform linux/<amd64|arm64> \
#     -v <repo>:/repo -v <mason-checkout>:/mason xplat-linux-prebuilt \
#     /repo/packages/linux-gtk-renderer/native/xplatmason/build-prebuilt.sh <x86_64|aarch64> /mason
FROM ubuntu:24.04

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
		build-essential pkg-config python3 git curl ca-certificates nodejs file \
		libgtk-4-dev libjson-glib-dev gobject-introspection libgirepository1.0-dev \
	&& rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
	| sh -s -- -y --default-toolchain stable --profile minimal \
	&& /root/.cargo/bin/rustup target add x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu

ENV PATH=/root/.cargo/bin:$PATH
WORKDIR /work
