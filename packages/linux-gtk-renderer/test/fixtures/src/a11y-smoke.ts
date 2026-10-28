// Driver-level accessibility smoke — exercises the accessible-label binding
// and the widget-name fallback on real GJS+GTK, headless. The C varargs
// gtk_accessible_update_property is not introspectable; GJS binds
// gtk_accessible_update_property_value under the name update_property
// (parallel property/value arrays). Gtk.test_accessible_has_property gives
// the real GTK evidence. Prints one JSON result object; the node test
// asserts on it.
import Gtk from 'gi://Gtk?version=4.0'
import { createGtkContainer, gtkDriver } from '@octane-xplat/linux-gtk'
import type { GtkContainer } from '@octane-xplat/linux-gtk'
import type { UniversalHostCommand } from 'octane/universal/native'

function apply(container: GtkContainer, commands: UniversalHostCommand[]) {
	gtkDriver.prepareBatch(container, { renderer: 'gtk', commands }).apply()
}

const cmd = (op: string, id: number, extra: Record<string, unknown> = {}) =>
	({ op, id, ...extra }) as UniversalHostCommand

const out: Record<string, unknown> = { ok: false }

Gtk.init()

const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const win = new Gtk.Window()
win.set_child(host)
const container = createGtkContainer(host)

apply(container, [
	// (a) accessibilityLabel mirrors to the GTK widget name.
	cmd('create', 1, {
		type: 'button',
		props: { text: 'Save', accessibilityLabel: 'Save draft' },
	}),
	cmd('insert', 1, { parent: null, before: null }),
	// (b) testID wins the widget name; the accessible label still lands.
	cmd('create', 2, {
		type: 'button',
		props: { text: 'Save', testID: 'save-id', accessibilityLabel: 'Save draft' },
	}),
	cmd('insert', 2, { parent: null, before: null }),
	// (e) the label element gets the same treatment.
	cmd('create', 3, {
		type: 'label',
		props: { text: 'Status', accessibilityLabel: 'Status text' },
	}),
	cmd('insert', 3, { parent: null, before: null }),
])

const view = (id: number) => container.nodes.get(id)?.view
const hasLabel = (id: number) =>
	Gtk.test_accessible_has_property(view(id), Gtk.AccessibleProperty.LABEL)

// (a) label present, name mirrors accessibilityLabel.
out.aHasLabel = hasLabel(1)
out.aName = view(1)?.get_name()

// (b) testID wins the name; label still set.
out.bHasLabel = hasLabel(2)
out.bName = view(2)?.get_name()

// (c) complete-bag update dropping accessibilityLabel resets both.
apply(container, [cmd('update', 1, { props: { text: 'Save' } })])
out.cHasLabel = hasLabel(1)
out.cName = view(1)?.get_name()

// (d) complete-bag update dropping testID falls back to accessibilityLabel.
apply(container, [cmd('update', 2, { props: { text: 'Save', accessibilityLabel: 'Save draft' } })])
out.dHasLabel = hasLabel(2)
out.dName = view(2)?.get_name()

// (e) labels carry accessible labels too.
out.eHasLabel = hasLabel(3)
out.eName = view(3)?.get_name()

apply(container, [cmd('destroy', 1), cmd('destroy', 2), cmd('destroy', 3)])
win.destroy()

out.ok = true
print(`A11Y_SMOKE ${JSON.stringify(out)}`)
