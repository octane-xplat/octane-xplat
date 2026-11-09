// Test-owned StatusNotifierWatcher — lives in its own process because D-Bus
// calls to an object exported on the same connection would deadlock the main
// context. Registrations append to watcher-registered.txt for the runner.
const Gio = imports.gi.Gio
const GLib = imports.gi.GLib

const XML = `<node>
	<interface name="org.kde.StatusNotifierWatcher">
		<method name="RegisterStatusNotifierItem"><arg type="s" direction="in"/></method>
		<method name="RegisterStatusNotifierHost"><arg type="s" direction="in"/></method>
		<property name="IsStatusNotifierHostRegistered" type="b" access="read"/>
		<property name="RegisteredStatusNotifierItems" type="as" access="read"/>
		<property name="ProtocolVersion" type="i" access="read"/>
	</interface>
</node>`

const log = Gio.File.new_for_path('/journey/watcher-registered.txt')
try { log.delete(null) } catch (e) {}
const exp = Gio.DBusExportedObject.wrapJSObject(XML, {
  get IsStatusNotifierHostRegistered() { return true },
  get RegisteredStatusNotifierItems() {
    try {
      const [, b] = log.load_contents(null)
      return new TextDecoder().decode(b).trim().split('\n').filter(Boolean)
    } catch (e) { return [] }
  },
  get ProtocolVersion() { return 0 },
  RegisterStatusNotifierItem(name) {
    const s = log.append_to(0, null)
    s.write_all(String(name) + '\n', null)
    s.close(null)
  },
  RegisterStatusNotifierHost(name) {},
})
const bus = Gio.bus_get_sync(Gio.BusType.SESSION, null)
exp.export(bus, '/StatusNotifierWatcher')
Gio.bus_own_name(Gio.BusType.SESSION, 'org.kde.StatusNotifierWatcher', Gio.BusNameOwnerFlags.NONE, null, null, null)
new GLib.MainLoop(null, false).run()
