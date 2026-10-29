import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import Gsk from 'gi://Gsk?version=4.0'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import Graphene from 'gi://Graphene?version=1.0'
// Introspection only: never initialize a window, snapshot a widget or encode pixels.
const methods = [
	[Gtk.Widget.prototype, 'get_mapped'],
	[Gtk.Widget.prototype, 'get_native'],
	[Gtk.Widget.prototype, 'get_scale_factor'],
	[Gtk.Widget.prototype, 'get_first_child'],
	[Gtk.WidgetPaintable.prototype, 'snapshot'],
	[Gtk.Snapshot.prototype, 'to_node'],
	[Gtk.Native.prototype, 'get_renderer'],
	[Gsk.Renderer.prototype, 'render_texture'],
	[Gdk.Texture.prototype, 'save_to_png_bytes'],
	[GLib.Bytes.prototype, 'get_data'],
	[Gio.File, 'new_tmp'],
	[Gio.File.prototype, 'delete'],
	[Gio.FileIOStream.prototype, 'get_output_stream'],
	[Gio.OutputStream.prototype, 'write_all'],
	[GLib, 'base64_encode'],
	[Graphene.Rect.prototype, 'init'],
]
for (const [owner, name] of methods) {
	if (typeof owner[name] !== 'function') {
		throw new Error('Missing GTK API: ' + name)
	}
}
print(
	JSON.stringify({
		assertions: methods.length,
		gtk: [Gtk.get_major_version(), Gtk.get_minor_version(), Gtk.get_micro_version()].join('.'),
		captures: 0,
	}),
)
