import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { runBench } from './bench.mjs'

await runBench({ Gtk, engine: 'gjs', now: () => GLib.get_monotonic_time() / 1000 })
