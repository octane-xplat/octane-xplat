---
hype: 40
---

### Installable GTK apps and persistent settings on Linux

The GTK runtime now packages a real per-user install: `xplat build --targets linux` emits a `.desktop` entry, `install.sh`, and `uninstall.sh` alongside the `gjs -m` bundle — the same install surface the WebKitGTK runtime already had. `install.sh` copies the app into `~/.local/share/<applicationId>` (replacing a previous install cleanly) and registers the desktop entry; `uninstall.sh` removes only the install and entry, leaving `~/.config/<applicationId>` user settings untouched.

```sh
./my-app/install.sh     # per-user install + desktop entry
./my-app/uninstall.sh   # removes the install; keeps ~/.config/<applicationId>
```

`@octane-xplat/platform` `storage` and the UI query-storage seam now persist across launches on GTK: `ApplicationSettings` writes through a `GLib.KeyFile` at `~/.config/<applicationId>/settings.ini` instead of losing state on exit. `@octane-xplat/linux-gtk/host` exports `setWindowContentResolver` for `openWindow` content, and `runGtkApp`'s `mount` may return a cleanup the host runs once on application shutdown.
