import type { ProbeContext } from '../../scripts/probe/context'

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
	ctx.assert(
		'return to system snapshot',
		bridge.getColorScheme(),
		app.effectiveAppearance.bestMatchFromAppearancesWithNames([
			'NSAppearanceNameAqua',
			'NSAppearanceNameDarkAqua',
		]) === 'NSAppearanceNameDarkAqua'
			? 'dark'
			: 'light',
	)
}
