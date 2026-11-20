### Linux GTK requires Mason — no more Gtk.Box fallback

**Breaking change.** `@octane-xplat/linux-gtk` now ships the Mason layout engine prebuilt for `x86_64` and `aarch64`, and every `masonview` is laid out by the real engine. The `Gtk.Box` fallback is removed; there is no compatibility path.

App builders get Mason automatically — `xplat build --targets linux` copies the binding into the bundle next to `app.js`. The prebuilt baseline is Ubuntu 24.04 (GTK 4.14, glibc 2.39); newer distributions with a compatible GTK4 run the same binding, and the app's runtime dependencies now include json-glib (Ubuntu: `libjson-glib-1.0-0`).

A machine without a resolvable binding now fails fast: `createGtkRoot` throws a diagnostic naming the architecture, the directories tried, and the override variable, instead of silently switching layout engines. Facade developers rebuilding the binding from the included C sources point `XPLAT_MASON_TYPELIB` at their `native/xplatmason/build.sh` output directory; the override takes priority over the bundled copy and is not needed by consumers.
