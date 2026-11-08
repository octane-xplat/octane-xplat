// GI (GObject Introspection) modules for the GTK/GJS leaf. The GTK vite
// bundle keeps `gi://` imports external — GJS resolves them to the system
// typelibs at runtime. Declared `any` so the shared typecheck compiles the
// leaf without host typelib metadata.
declare module 'gi://Gtk?version=4.0' {
  const Gtk: any

  export default Gtk
}

declare module 'gi://Gdk?version=4.0' {
  const Gdk: any

  export default Gdk
}
