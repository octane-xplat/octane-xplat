import { namespaces, beginScope } from './bindings.mjs'
import { runBench } from './bench.mjs'

beginScope()
await runBench({ Gtk: namespaces.Gtk, engine: 'native', now: () => namespaces.GLib.get_monotonic_time() / 1000 })
