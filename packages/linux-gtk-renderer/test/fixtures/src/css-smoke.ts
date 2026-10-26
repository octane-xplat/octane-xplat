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
// A real window makes host.get_root() a Gtk.Window so the resize watch
// wires up — present() is not needed for default-width/height signals.
const win = new Gtk.Window()
win.set_child(host)
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
	cmd('create', 11, { type: 'label', props: { text: 'b', className: 'borders' } }),
	cmd('create', 12, { type: 'label', props: { text: 'sp', className: 'lspace' } }),
	cmd('create', 13, { type: 'switch', props: { className: 'sw', checked: true } }),
	cmd('create', 14, { type: 'label', props: { text: 'h', className: 'hid' } }),
	cmd('create', 15, { type: 'label', props: { text: 'c', className: 'col' } }),
	cmd('create', 16, { type: 'label', props: { text: 'r', className: 'rtl' } }),
	cmd('create', 17, { type: 'label', props: { text: 'e', className: 'ell' } }),
	cmd('create', 18, { type: 'label', props: { text: 'a', className: 'hal' } }),
	cmd('create', 19, { type: 'label', props: { text: 'h', className: 'hov' } }),
	cmd('create', 20, { type: 'textfield', props: { className: 'hf' } }),
	cmd('create', 21, { type: 'button', props: { text: 'p', className: 'hl' } }),
	cmd('create', 22, { type: 'label', props: { text: 'n', className: 'nrm' } }),
	cmd('create', 23, { type: 'masonview', props: { className: 'card' } }),
	cmd('create', 24, { type: 'label', props: { text: 't', className: 'title' } }),
	cmd('create', 25, { type: 'switch', props: { className: 'sw2' } }),
	cmd('create', 26, { type: 'label', props: { text: 'm', className: 'mqx' } }),
	cmd('create', 27, { type: 'label', props: { text: 's', className: 'sel' } }),
	cmd('insert', 8, { parent: 1, before: null }),
	cmd('insert', 11, { parent: 1, before: null }),
	cmd('insert', 12, { parent: 1, before: null }),
	cmd('insert', 13, { parent: 1, before: null }),
	cmd('insert', 14, { parent: 1, before: null }),
	cmd('insert', 15, { parent: 1, before: null }),
	cmd('insert', 16, { parent: 1, before: null }),
	cmd('insert', 17, { parent: 1, before: null }),
	cmd('insert', 18, { parent: 1, before: null }),
	cmd('insert', 19, { parent: 1, before: null }),
	cmd('insert', 20, { parent: 1, before: null }),
	cmd('insert', 21, { parent: 1, before: null }),
	cmd('insert', 22, { parent: 1, before: null }),
	cmd('insert', 23, { parent: 1, before: null }),
	cmd('insert', 24, { parent: 23, before: null }),
	cmd('insert', 25, { parent: 1, before: null }),
	cmd('insert', 26, { parent: 1, before: null }),
	cmd('insert', 27, { parent: 1, before: null }),
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

// ---- B1: per-side borders, letter-spacing, controls, visibility, text ----

// Longhand keys reach the computed bag (computeCascade borderLonghands).
out.borderTopWidth = node(11)?.computedStyle?.borderTopWidth
out.borderBottomWidth = node(11)?.computedStyle?.borderBottomWidth
out.borderRightColor = node(11)?.computedStyle?.borderRightColor
// Real GTK evidence: the provider lands a border on the style context.
const borderCtx = node(11)?.view?.get_style_context?.()
const gtkBorder = borderCtx?.get_border?.()
out.gtkBorderTop = gtkBorder ? gtkBorder.top : null
out.gtkBorderBottom = gtkBorder ? gtkBorder.bottom : null

// letter-spacing lands in the provider signature.
out.letterSpacingRule = String(node(12)?.cssSignature ?? '').includes('letter-spacing: 0.1em')

// Switch color/backgroundColor paint the slider gizmo + checked track, not
// the widget node — find the slider subnode and read its color.
const cssNameWalk = (w, name) => {
	for (let c = w.get_first_child?.(); c; c = c.get_next_sibling?.()) {
		if (c.get_css_name?.() === name) {
			return c
		}
		const nested = cssNameWalk(c, name)
		if (nested) {
			return nested
		}
	}
	return null
}
const swView = node(13)?.view
const swSlider = swView ? cssNameWalk(swView, 'slider') : null
out.switchThumbColor = swSlider?.get_color?.() ? {
	r: swSlider.get_color().red,
	g: swSlider.get_color().green,
	b: swSlider.get_color().blue,
} : null
out.switchOwnColor = String(node(13)?.cssSignature ?? '').includes('.xplat-n')
	? /xplat-n\d+ \{[^}]*\bcolor:/.test(String(node(13)?.cssSignature ?? ''))
	: null

// hidden keeps space (child-invisible); collapse unmaps.
out.hiddenVisible = node(14)?.view?.get_visible?.()
out.hiddenChildVisible = node(14)?.view?.get_child_visible?.()
out.collapseVisible = node(15)?.view?.get_visible?.()

// direction → set_direction.
out.directionRtl = node(16)?.view?.get_direction?.()

// whiteSpace/textOverflow/maxLines land on the Gtk.Label.
const ellView = node(17)?.view
out.ellipsize = ellView?.ellipsize
out.wrapNowrap = ellView?.wrap
out.maxLines = ellView?.lines

// horizontalAlign/verticalAlign outside a Mason subtree → halign/valign.
const halView = node(18)?.view
out.halign = halView?.halign ?? halView?.get_halign?.()
out.valign = halView?.valign ?? halView?.get_valign?.()

// ---- B2: pseudo-classes, media-on-resize, root classes -------------------

const idleStyles = async () => {
	await idle()
}
const setFlags = (id, flags) => node(id).view.set_state_flags(flags, true)
const unsetFlags = (id, flags) => node(id).view.unset_state_flags(flags)

// :hover via PRELIGHT.
out.hoverColorBefore = colorOf(19)
setFlags(19, Gtk.StateFlags.PRELIGHT)
await idleStyles()
out.hoverColor = colorOf(19)
unsetFlags(19, Gtk.StateFlags.PRELIGHT)
await idleStyles()
out.hoverColorOff = colorOf(19)

// :focus — textfield uses FOCUS_WITHIN.
out.focusColorBefore = colorOf(20)
setFlags(20, Gtk.StateFlags.FOCUS_WITHIN)
await idleStyles()
out.focusColor = colorOf(20)

// :highlighted/:active/:pressed via ACTIVE on the button.
setFlags(21, Gtk.StateFlags.ACTIVE)
await idleStyles()
out.highlightedColor = colorOf(21)
out.hlPseudos = [...(node(21)?.cssPseudoClasses ?? [])].sort()

// :normal is on only while no other visual state is active.
out.normalBefore = colorOf(22)
setFlags(22, Gtk.StateFlags.ACTIVE)
await idleStyles()
out.normalDuringHighlight = colorOf(22)
out.normalPseudos = [...(node(22)?.cssPseudoClasses ?? [])].sort()
unsetFlags(22, Gtk.StateFlags.ACTIVE)
await idleStyles()
out.normalRestored = colorOf(22)

// Descendant selector `.card:hover .title`.
setFlags(23, Gtk.StateFlags.PRELIGHT)
await idleStyles()
out.descendantHoverColor = colorOf(24)
out.descendantHoverColorRead = node(24)?.computedStyle?.color

// :normal survives PRELIGHT — hover is a desktop extra, not an NS visual
// state (view-common.js visual states only).
setFlags(22, Gtk.StateFlags.PRELIGHT)
await idleStyles()
out.normalUnderHover = [...(node(22)?.cssPseudoClasses ?? [])].includes('normal')
unsetFlags(22, Gtk.StateFlags.PRELIGHT)
await idleStyles()

// :checked via switch notify::active.
out.checkedBefore = node(25)?.computedStyle?.opacity
const swNode = node(25)
if (swNode?.view) {
	swNode.view.active = true
}
await idleStyles()
out.checkedOpacity = node(25)?.computedStyle?.opacity

// An untracked pseudo-class change must not restyle: SELECTED is not in any
// registered selector — the provider signature stays identical.
const sigBefore = node(27)?.cssSignature
setFlags(27, Gtk.StateFlags.SELECTED)
await idleStyles()
out.untrackedSignatureSame = sigBefore === node(27)?.cssSignature

// Media query flips when the window resizes past the breakpoint — this one
// rode the imported .css through the bundle (prelude px survives the
// build-time rewrite now).
out.mediaBefore = colorOf(26)
win.set_default_size(400, 300)
await idleStyles()
await idleStyles()
out.mediaAfter = colorOf(26)

// Root classes: orientation from the new size, direction from the default.
out.rootClassesB2 = [...(node(1)?.cssClasses ?? [])].sort()

// ---- Keyframe animations ---------------------------------------------------
const sleep = (ms: number) =>
	new Promise<void>((resolve) => {
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		})
	})
registerStylesheet(
	'anim',
	`@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
	.fade { animation: fade 300ms linear forwards; }
	@keyframes slide { from { transform: translateX(0); } to { transform: translateX(100); } }
	.slide { animation-name: slide; animation-duration: 300ms; animation-timing-function: linear; }`,
)
await idle()
apply(container, [
	cmd('create', 40, { type: 'label', props: { text: 'f', className: 'fade' } }),
	cmd('create', 41, { type: 'label', props: { text: 's', className: 'slide' } }),
	cmd('insert', 40, { parent: null, before: null }),
	cmd('insert', 41, { parent: null, before: null }),
])
// Segment 0 lands synchronously at play.
out.fadeStart = node(40)?.view?.get_opacity()
await sleep(150)
out.fadeMid = node(40)?.view?.get_opacity()
out.slideMidCss = node(41)?.cssSignature
// An inline-style restyle mid-animation must not restart it.
apply(container, [cmd('update', 40, { props: { text: 'f', className: 'fade', style: { color: '#010203' } } })])
out.fadeAfterInline = node(40)?.view?.get_opacity()
await sleep(300)
out.fadeEnd = node(40)?.view?.get_opacity()
out.fadeHoldsOverlay = node(40)?.animatedStyle?.opacity
out.slideEndOverlay = node(41)?.animatedStyle ?? null
out.slideEndCss = node(41)?.cssSignature
// A class change re-matches → NS updateDynamicState restarts the animation.
apply(container, [
	cmd('update', 40, { props: { text: 'f', className: 'fade again', style: { color: '#010203' } } }),
])
out.fadeRestart = node(40)?.view?.get_opacity()
// Destroy mid-animation stops it — no frame writes to a dead node.
apply(container, [cmd('remove', 40), cmd('destroy', 40)])
await sleep(50)
out.fadeDestroyedOverlay = container.nodes.get(40) ?? null

out.ok = true
print(`CSS_SMOKE ${JSON.stringify(out)}`)
