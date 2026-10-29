// GJS runtime modules are provided by the GTK host, not by npm.
declare module 'gi://Gtk?version=4.0' {
	const Gtk: any
	export default Gtk
}
declare module 'gi://GLib' {
	const GLib: any
	export default GLib
}
declare module 'gi://Gio' {
	const Gio: any
	export default Gio
}
declare module 'gi://Graphene?version=1.0' {
	const Graphene: any
	export default Graphene
}
