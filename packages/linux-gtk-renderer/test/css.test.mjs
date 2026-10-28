// Runtime-level stylesheet smoke — builds the css-smoke fixture bundle and
// runs it under real GJS+GTK. Skipped only when gjs is missing; the
// XplatMason typelib is NOT required (the Gtk.Box masonview fallback still
// participates in the cascade). This IS runtime evidence — a real CssProvider
// lands on real widgets and widget.get_color() reflects it.
import assert from 'node:assert/strict'
import { rmSync } from 'node:fs'
import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import test from 'node:test'
import { build } from 'vite'
import { xplatLinuxGtk } from '../../cli/src/linux-gtk/vite.ts'

const pkg = fileURLToPath(new URL('..', import.meta.url))
const fixture = join(pkg, 'test', 'fixtures')
const outDir = join(fixture, 'dist-css')

function gjsAvailable() {
	try {
		execFileSync('gjs', ['--version'], { stdio: 'pipe' })
		return true
	} catch {
		return false
	}
}

test('stylesheets cascade through the GTK driver under real GJS+GTK', async (t) => {
	if (!gjsAvailable()) {
		t.skip('gjs is not installed')
		return
	}
	rmSync(outDir, { recursive: true, force: true })
	await build({
		logLevel: 'error',
		...(await xplatLinuxGtk('production', {
			root: fixture,
			entry: 'src/css-smoke.ts',
			outDir,
		})),
	})

	// Homebrew gjs needs its lib dir on the dyld fallback path; on Linux the
	// system GI paths are enough.
	const dyld =
		process.platform === 'darwin' ? `${execSync('brew --prefix').toString().trim()}/lib` : undefined
	const env = { ...process.env }
	if (dyld) {
		env.DYLD_FALLBACK_LIBRARY_PATH = [dyld, process.env.DYLD_FALLBACK_LIBRARY_PATH]
			.filter(Boolean)
			.join(':')
	}

	// stderr carries console.warn — the warn-once evidence lives there.
	const {
		stdout: output,
		stderr,
		status,
	} = spawnSync('gjs', ['-m', join(outDir, 'app.js')], {
		env,
		encoding: 'utf8',
	})
	assert.equal(status, 0, `gjs failed:\n${stderr}`)
	const line = output.split('\n').find((l) => l.startsWith('CSS_SMOKE '))
	assert.ok(line, `smoke marker missing — gjs output:\n${output}\n${stderr}`)
	const r = JSON.parse(line.slice('CSS_SMOKE '.length))

	// The .css import rode the bundle's __xplatStylesheets push — a class
	// selector landed on the computed bag AND on the real widget.
	assert.equal(r.classColor, 'red')
	assert.ok(r.widgetColor, 'widget.get_color() returned a color')
	assert.ok(r.widgetColor.r > 0.9 && r.widgetColor.g < 0.1 && r.widgetColor.b < 0.1)

	// color/font-size inherit from the masonview to a child label.
	assert.equal(r.inheritedFontSize, 22)

	// var(--pv) declared on .ns-root resolves in a descendant.
	assert.equal(r.varColor, '#123456')

	// Root ambient classes.
	assert.ok(r.rootClasses.includes('ns-root'))
	assert.ok(r.rootClasses.includes('ns-gtk'))
	assert.equal(
		r.rootClasses.filter((c) => c === 'ns-light' || c === 'ns-dark').length,
		1,
		`exactly one scheme class: ${r.rootClasses}`,
	)

	// Inline style beats the class rule.
	assert.equal(r.inlineWins, '#0000ff')

	// :disabled matches and un-matches.
	assert.equal(r.disabledColor, '#123')
	// Re-enabled, the rule un-matches — the inherited host color returns.
	assert.equal(r.enabledColor, '#0f0')

	// Unsupported CSS property warns exactly once across both .w1 nodes.
	assert.equal(stderr.split('ignored unsupported property cursor').length - 1, 1, stderr)

	// Adjacent-sibling rule re-matches after an insert (before: only the
	// inherited host color applies).
	assert.equal(r.siblingBefore, '#0f0')
	assert.equal(r.siblingAfter, '#0ff')

	// className feeds the cascade only — never the widget's GTK css classes.
	assert.equal(r.widgetHasAccent, false)
	assert.equal(r.widgetHasXplatClass, true)

	// Runtime registerStylesheet restyles mounted widgets after a microtask,
	// and re-registering the same id replaces it.
	assert.equal(r.rtFirst, '#101010')
	assert.equal(r.rtReplaced, '#202020')

	// ---- B1: longhands + direct writes ------------------------------------

	// Per-side borders reach the computed bag AND the widget's GTK border.
	assert.equal(r.borderTopWidth, 2)
	assert.equal(r.borderBottomWidth, 4)
	assert.equal(r.borderRightColor, '#00ff4f')
	assert.equal(r.gtkBorderTop, 2)
	assert.equal(r.gtkBorderBottom, 4)

	// letter-spacing lands in the provider rule.
	assert.equal(r.letterSpacingRule, true)

	// Switch color paints the slider gizmo (red); the widget node itself
	// does not carry a color declaration.
	assert.ok(r.switchThumbColor, 'slider gizmo color readable')
	assert.ok(
		r.switchThumbColor.r > 0.9 && r.switchThumbColor.g < 0.1,
		JSON.stringify(r.switchThumbColor),
	)
	assert.equal(r.switchOwnColor, false)

	// hidden keeps space via child-invisible; collapse unmaps entirely.
	assert.equal(r.hiddenVisible, true)
	assert.equal(r.hiddenChildVisible, false)
	assert.equal(r.collapseVisible, false)

	// direction: rtl → Gtk.TextDirection.RTL = 2.
	assert.equal(r.directionRtl, 2)

	// whiteSpace nowrap → wrap=false, textOverflow → ellipsize 3, maxLines.
	assert.equal(r.wrapNowrap, false)
	assert.equal(r.ellipsize, 3)
	assert.equal(r.maxLines, 2)

	// horizontal/vertical align map to halign/valign outside Mason subtrees
	// (Gtk.Align.CENTER = 3, START = 1).
	assert.equal(r.halign, 3)
	assert.equal(r.valign, 1)

	// ---- B2: pseudo-classes, media-on-resize, root classes ----------------

	// :hover toggles through PRELIGHT state flags.
	assert.equal(r.hoverColorBefore, '#0f0') // inherited host color
	assert.equal(r.hoverColor, '#f0f')
	assert.equal(r.hoverColorOff, '#0f0')

	// :focus on the textfield via FOCUS_WITHIN.
	assert.equal(r.focusColorBefore, '#0f0')
	assert.equal(r.focusColor, '#f80')

	// :highlighted plus its :active/:pressed aliases from ACTIVE.
	assert.equal(r.highlightedColor, '#123')
	for (const p of ['highlighted', 'active', 'pressed']) {
		assert.ok(r.hlPseudos.includes(p), `missing ${p} in ${r.hlPseudos}`)
	}

	// :normal holds only while no visual state is active.
	assert.equal(r.normalBefore, '#0f0')
	assert.equal(r.normalDuringHighlight, 'red')
	assert.ok(!r.normalPseudos.includes('normal'), `still normal: ${r.normalPseudos}`)
	assert.equal(r.normalRestored, '#0f0')

	// Descendant `.card:hover .title`.
	assert.equal(r.descendantHoverColor, '#f0f')

	// :normal survives hover — hover must not cancel it.
	assert.equal(r.normalUnderHover, true)

	// :checked from the switch's active property.
	assert.equal(r.checkedBefore, undefined)
	assert.equal(r.checkedOpacity, 0.5)

	// An untracked state change (SELECTED has no selector) leaves the
	// provider signature byte-identical.
	assert.equal(r.untrackedSignatureSame, true)

	// @media (min-width: 300px) flips after window.set_default_size.
	assert.equal(r.mediaAfter, 'red')

	// Root classes gained orientation + direction.
	assert.ok(r.rootClassesB2.includes('ns-ltr'))
	assert.ok(
		r.rootClassesB2.includes('ns-landscape') || r.rootClassesB2.includes('ns-portrait'),
		`orientation classes: ${r.rootClassesB2}`,
	)
	assert.equal(r.rootClassesB2.includes('ns-landscape'), true) // 400x300

	// Keyframe animations: segment 0 is instant, frames advance on the GLib
	// timer, forwards fill holds, a non-forwards animation drops its overlay,
	// inline-style restyles keep playing, and a class change restarts.
	assert.equal(r.fadeStart, 0)
	assert.ok(r.fadeMid > 0.2 && r.fadeMid < 0.95, `fadeMid ${r.fadeMid}`)
	assert.match(r.slideMidCss, /transform: translate\(/)
	assert.ok(r.fadeAfterInline > 0.2, `inline restyle restarted the fade: ${r.fadeAfterInline}`)
	assert.equal(r.fadeEnd, 1)
	assert.equal(r.fadeHoldsOverlay, 1)
	assert.equal(r.slideEndOverlay, null)
	assert.doesNotMatch(r.slideEndCss, /transform:/)
	assert.equal(r.fadeRestart, 0)
	assert.equal(r.fadeDestroyedOverlay, null)

	assert.equal(r.ok, true)
	t.diagnostic(`theme sheets: ${r.themeSelectors} rule bodies in ${r.themeMs}ms`)
}, 120000)

test.after(() => {
	rmSync(outDir, { recursive: true, force: true })
})
