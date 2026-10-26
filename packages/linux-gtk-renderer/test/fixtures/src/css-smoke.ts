// Driver-level CSS smoke — exercises the stylesheet cascade end to end on
// real GJS+GTK, headless: the imported .css file reaches the renderer through
// the CLI's inline-stylesheet injection, registerStylesheet restyles live
// widgets, and widget.get_color() gives real GTK evidence. Prints one JSON
// result object; the node test asserts on it. The XplatMason typelib is not
// required — the Gtk.Box masonview fallback is fine.
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkContainer, gtkDriver, registerStylesheet } from '@octane-xplat/linux-gtk'
import type { GtkContainer } from '@octane-xplat/linux-gtk'
import type { UniversalHostCommand } from 'octane/universal/native'
import './css-smoke.css'
import tokensCss from '@octane-xplat/ui/theme/tokens.css?raw'
import chromeCss from '@octane-xplat/ui/theme/chrome.css?raw'

// console.warn is non-configurable in GJS — the [linux-gtk-css] warn-once
// evidence lands on stderr; the node test counts it there.
function apply(container: GtkContainer, commands: UniversalHostCommand[]) {
	gtkDriver.prepareBatch(container, { renderer: 'gtk', commands }).apply()
}

function idle(): Promise<void> {
	return new Promise((resolve) => {
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => {
			resolve()
			return false
		})
	})
}

const cmd = (op: string, id: number, extra: Record<string, unknown> = {}) =>
	({ op, id, ...extra }) as UniversalHostCommand

const out: Record<string, unknown> = { ok: false }

Gtk.init()

const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const container = createGtkContainer(host)

apply(container, [
	cmd('create', 1, { type: 'masonview', props: { className: 'inherit-host' } }),
	cmd('create', 2, { type: 'label', props: { text: 'a', className: 'accent' } }),
	cmd('create', 3, { type: 'label', props: { text: 'v', className: 'uses-var' } }),
	cmd('create', 4, {
		type: 'label',
		props: { text: 'i', className: 'accent', style: { color: '#0000ff' } },
	}),
	cmd('create', 5, { type: 'label', props: { text: 'd', className: 'dis' } }),
	cmd('create', 6, { type: 'label', props: { text: 'w', className: 'w1' } }),
	cmd('create', 7, { type: 'label', props: { text: 'w', className: 'w1' } }),
	cmd('create', 8, { type: 'label', props: { text: 's', className: 'second' } }),
	cmd('insert', 1, { parent: null, before: null }),
	cmd('insert', 2, { parent: 1, before: null }),
	cmd('insert', 3, { parent: 1, before: null }),
	cmd('insert', 4, { parent: 1, before: null }),
	cmd('insert', 5, { parent: 1, before: null }),
	cmd('insert', 6, { parent: 1, before: null }),
	cmd('insert', 7, { parent: 1, before: null }),
	cmd('insert', 8, { parent: 1, before: null }),
])

const node = (id: number) => container.nodes.get(id)
const colorOf = (id: number) => node(id)?.computedStyle?.color

// Class selector: computed bag AND real GTK evidence.
out.classColor = colorOf(2)
const rgba = node(2)?.view?.get_color?.()
out.widgetColor = rgba ? { r: rgba.red, g: rgba.green, b: rgba.blue } : null

// Inheritance: color/font-size declared on the masonview reach the child
// label (node 2 is a plain .accent descendant of the .inherit-host).
out.inheritedFontSize = node(2)?.computedStyle?.fontSize

// var(--pv) declared on .ns-root resolves in a descendant.
out.varColor = colorOf(3)

// Root ambient classes.
const rootClasses = [...(node(1)?.cssClasses ?? [])].sort()
out.rootClasses = rootClasses

// Inline style beats the class rule.
out.inlineWins = colorOf(4)

// :disabled matches and un-matches.
apply(container, [cmd('update', 5, { props: { text: 'd', className: 'dis', enabled: false } })])
out.disabledColor = colorOf(5)
apply(container, [cmd('update', 5, { props: { text: 'd', className: 'dis', enabled: true } })])
out.enabledColor = colorOf(5)



// Adjacent-sibling rule re-matches after inserting a .first before .second.
out.siblingBefore = colorOf(8)
apply(container, [
	cmd('create', 9, { type: 'label', props: { text: 'f', className: 'first' } }),
	cmd('insert', 9, { parent: 1, before: 8 }),
])
out.siblingAfter = colorOf(8)

// className must not reach the widget's own GTK css classes — only the
// per-node xplat-n<id> carrier class does.
out.widgetHasAccent = node(2)?.view?.has_css_class?.('accent') ?? null
out.widgetHasXplatClass = (node(2)?.view?.get_css_classes?.() ?? []).some((c: string) =>
	c.startsWith('xplat-n'),
)

// Runtime registerStylesheet: registration and replace-in-place both restyle
// mounted widgets after a microtask.
registerStylesheet('rt', '.rt { color: #101010 }')
apply(container, [
	cmd('create', 10, { type: 'label', props: { text: 'r', className: 'rt' } }),
	cmd('insert', 10, { parent: 1, before: null }),
])
out.rtFirst = colorOf(10)
registerStylesheet('rt', '.rt { color: #202020 }')
await idle()
out.rtReplaced = colorOf(10)

// Theme-sheet parse timing — reported, not asserted.
const t0 = GLib.get_monotonic_time()
registerStylesheet('theme', `${tokensCss}\n${chromeCss}`)
const themeMs = (GLib.get_monotonic_time() - t0) / 1000
out.themeMs = Math.round(themeMs * 100) / 100
out.themeSelectors = `${tokensCss}\n${chromeCss}`.split('{').length - 1

out.ok = true
print(`CSS_SMOKE ${JSON.stringify(out)}`)
