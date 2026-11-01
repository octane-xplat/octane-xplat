// GI (GObject Introspection) modules for the GTK/GJS leaves. The GTK vite
// bundle keeps `gi://` imports external — GJS resolves them to the system
// typelibs at runtime. Declared `any` so the shared typecheck compiles the
// .gtk leaves without host typelib metadata.
declare module 'gi://Gtk?version=4.0' {
	const Gtk: any
	export default Gtk
}
declare module 'gi://Gdk?version=4.0' {
	const Gdk: any
	export default Gdk
}
declare module 'gi://GdkPixbuf' {
	const GdkPixbuf: any
	export default GdkPixbuf
}
declare module 'gi://Gio' {
	const Gio: any
	export default Gio
}
declare module 'gi://GLib' {
	const GLib: any
	export default GLib
}
declare module 'gi://Soup?version=3.0' {
	const Soup: any
	export default Soup
}
