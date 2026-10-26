import type { ProbeContext } from '../../scripts/probe/context'
// Deep leaf import: the @octane-xplat/ui barrel pulls table modules the
// macOS universal compiler currently rejects — the theme leaf only needs
// the bridge, which is what this case exercises.
import { setThemePreference } from '../../packages/ui/src/theme/theme-scheme.macos'

export async function run(ctx: ProbeContext) {
	const bridge = (globalThis as any).__xplatAppKit
	const app = NSApplication.sharedApplication
	const original = app.appearance
	// This case changes only its process's application appearance, never OS settings.
	ctx.onCleanup(() => {
		app.appearance = original
	})

	ctx.assert('framework producer installed', typeof bridge.getColorScheme, 'function')
	app.appearance = NSAppearance.appearanceNamed('NSAppearanceNameAqua')
	ctx.assert('initial light', bridge.getColorScheme(), 'light')
	let changes = 0
	const close = bridge.onAppearanceChange(() => {
		changes++
	})

	ctx.onCleanup(close)
	app.appearance = NSAppearance.appearanceNamed('NSAppearanceNameDarkAqua')
	await ctx.waitFor(() => changes > 0, { timeout: 2000 })
	ctx.assert('dark override', bridge.getColorScheme(), 'dark')
	close()
	const count = changes
	app.appearance = NSAppearance.appearanceNamed('NSAppearanceNameAqua')
	ctx.assert('closed consumer untouched', changes, count)
	const reopen = bridge.onAppearanceChange(() => {
		changes++
	})

	ctx.onCleanup(reopen)
	ctx.assert('reopened light', bridge.getColorScheme(), 'light')
	app.appearance = null
	const systemScheme = () =>
		app.effectiveAppearance.bestMatchFromAppearancesWithNames([
			'NSAppearanceNameAqua',
			'NSAppearanceNameDarkAqua',
		]) === 'NSAppearanceNameDarkAqua'
			? 'dark'
			: 'light'
	ctx.assert('return to system snapshot', bridge.getColorScheme(), systemScheme())

	// The app preference drives the same override: setThemePreference pins
	// NSApp.appearance through the bridge setter; 'system' releases it. Pin
	// the opposite of the host scheme so the effectiveAppearance change is
	// observable regardless of OS mode.
	ctx.assert('appearance setter installed', typeof bridge.setAppearanceOverride, 'function')
	bridge.setAppearanceOverride('dark')
	ctx.assert('bridge override dark', bridge.getColorScheme(), 'dark')
	bridge.setAppearanceOverride('light')
	ctx.assert('bridge override light', bridge.getColorScheme(), 'light')
	bridge.setAppearanceOverride(null)
	ctx.assert('bridge override cleared', bridge.getColorScheme(), systemScheme())
	const opposite = systemScheme() === 'dark' ? 'light' : 'dark'
	const watched = changes
	setThemePreference(opposite)
	await ctx.waitFor(() => changes > watched, { timeout: 2000 })
	ctx.assert('preference pins AppKit', bridge.getColorScheme(), opposite)
	setThemePreference('system')
	ctx.assert('system preference restores host', bridge.getColorScheme(), systemScheme())
	ctx.assert('system preference clears NSApp.appearance', app.appearance ?? null, null)
}
