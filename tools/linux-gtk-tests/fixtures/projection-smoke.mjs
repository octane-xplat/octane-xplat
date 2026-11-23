// Low-level projection contracts; run with test:gtk -- projection.
import GLib from 'gi://GLib'
import Gtk from 'gi://Gtk?version=4.0'
import Gsk from 'gi://Gsk?version=4.0'
import Graphene from 'gi://Graphene?version=1.0'

Gtk.init()
const failures = []
let checks = 0
const check = (name, ok) => {
  checks++
  if (!ok) {
    failures.push(name)
  }
}
const same = (actual, expected) =>
  actual instanceof Uint8Array &&
  actual.length === expected.length &&
  actual.every((value, index) => value === expected[index])

const decoded = GLib.base64_decode('AP9BAA==')
check('transfer-full byte array', same(decoded, [0, 255, 65, 0]))
check('empty transfer-full byte array', same(GLib.base64_decode(''), []))
const bytes = new GLib.Bytes(decoded)
decoded[1] = 42
check('GBytes copies input', same(bytes.get_data(), [0, 255, 65, 0]))
const borrowed = bytes.get_data()
borrowed[0] = 99
check('borrowed byte array is copied', same(bytes.get_data(), [0, 255, 65, 0]))
check('empty borrowed byte array', same(new GLib.Bytes(new Uint8Array()).get_data(), []))
check(
  'GBytes toArray convenience',
  same(new GLib.Bytes(new Uint8Array([2, 0, 3])).toArray(), [2, 0, 3]),
)
for (let i = 0; i < 100; i++) {
  const data = GLib.base64_decode('AP9BAA==')
  if (!same(new GLib.Bytes(data).get_data(), [0, 255, 65, 0])) {
    throw Error('Byte array repeat failed')
  }
}
check('repeated byte array conversion', true)
const entry = new Gtk.Entry()
const button = new Gtk.Button()
entry.placeholder_text = ''
check('empty string property is distinct from null', entry.placeholder_text === '')
check(
  'class property lookup finds the declared property',
  Gtk.TextView.find_property('wrap-mode') != null,
)
check(
  'class property lookup returns null for an absent property',
  Gtk.TextView.find_property('visibility') == null,
)
entry.set_text('AB')
check(
  'editable inout position is returned',
  entry.insert_text('é', -1, 1) === 2 && entry.get_text() === 'AéB',
)
check('native GType includes its name', Gtk.Entry.$gtype.name === 'GtkEntry')
check('Entry implements Editable', entry instanceof Gtk.Editable)
check('Entry implements Accessible', entry instanceof Gtk.Accessible)
check('Button implements Accessible', button instanceof Gtk.Accessible)
check('Button does not implement Editable', !(button instanceof Gtk.Editable))
check('null is not Editable', !(null instanceof Gtk.Editable))
check('plain object is not Editable', !({} instanceof Gtk.Editable))
check('class inheritance still works', entry instanceof Gtk.Widget)
const inactiveWindow = new Gtk.Window()
check('native property takes precedence over same-named method', inactiveWindow.is_active === false)
inactiveWindow.destroy()
const errorDomain = GLib.quark_from_string('xplat-projection-smoke')
const projectedError = GLib.Error.new_literal(errorDomain, 17, 'example error')
check('GError carries its message', projectedError.message === 'example error')
check('GError matches its domain and code', projectedError.matches(errorDomain, 17))
check('GError rejects another code', !projectedError.matches(errorDomain, 18))
const point = new Graphene.Point({ x: 4, y: 5 })
const at = (transform, x, y) => {
  const result = transform.transform_point(point)
  return Math.abs(result.x - x) < 0.001 && Math.abs(result.y - y) < 0.001
}
const identity = new Gsk.Transform()
check('opaque transform constructor', at(identity, 4, 5))
const scaled = identity.scale(2, 3)
check('transform scale', at(scaled, 8, 15))
check('consuming method preserves receiver wrapper', at(identity, 4, 5))
const translated = scaled.translate(new Graphene.Point({ x: 10, y: 20 }))
check('transform chain', at(translated, 28, 75))
check('consuming chain preserves previous wrapper', at(scaled, 8, 15))
for (let i = 0; i < 100; i++) {
  const next = identity.scale(2, 3)
  if (!at(next, 8, 15) || !at(identity, 4, 5)) {
    throw Error('Transform repeat failed')
  }
}
check('repeated consuming transform calls', true)
print(
  'GTK_PROJECTION ' +
    JSON.stringify({
      checks,
      failures,
      osInput: false,
      gtk: `${Gtk.get_major_version()}.${Gtk.get_minor_version()}.${Gtk.get_micro_version()}`,
    }),
)
