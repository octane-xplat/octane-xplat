### Try native GTK windows from an npm app

The experimental Linux GTK renderer joins the lockstep release. Workshop and
CLI consumers can install it without a framework checkout after the first
automated release. It ships JavaScript, uses Gtk.Box when the optional native
Mason build is absent, and applies explicit accessible names through GTK.
Production qualification remains incomplete.

```sh
pnpm add -D @octane-xplat/linux-gtk
pnpm exec xplat workshop doctor
```

[Linux GTK setup](https://octane-xplat.goddardai.org/linux-gtk)
