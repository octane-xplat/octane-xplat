import { GridLayout } from '@nativescript/core'
import { topRootLayout, applyThemeClasses } from '@octane-xplat/ui'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import type { UniversalComponent } from 'octane/universal'
import { SheetPanel } from '../SheetPanel.tsrx'

// GridLayout, not ContentView: the root host must be multi-child —
// ContentView's `.content` assignment keeps only the last root view.
let host: GridLayout | null = null
let hostRoot: ReturnType<typeof createNativeScriptRoot> | null = null

/** Bottom-anchored sheet: RootLayout.open with a dedicated sub-root.
 *  Content is parameterized — callers pass any component (e.g. a demo
 *  render fn); defaults to the SheetPanel probe panel. */
export function openSheet(Component: unknown = SheetPanel, props: Record<string, unknown> = {}) {
	const rl = topRootLayout()
	if (!rl) {
		console.log('[probe] sheet: no rootlayout found')
		return
	}

	if (!host) {
		host = new GridLayout()
		host.id = 'sheet-host'
		// Theme classes don't cross imperative roots — stamp the current
		// scheme on the host so the sheet matches the app theme.
		applyThemeClasses(host, 'vx-sheet-host')
		// Bottom-dock the sheet inside the RootLayout grid.
		host.verticalAlignment = 'bottom'
		hostRoot = createNativeScriptRoot(host)
	}

	hostRoot!.render(Component as UniversalComponent, props)
	// rl.open rejects when the host is still attached — a re-open while a
	// previous sheet is up would crash as an unhandled rejection (seen as a
	// fatal JS exception on the release build). The host may be parented to
	// a DIFFERENT rootlayout than this open's (pushed page vs app root) —
	// close through the actual parent, then open on the current root.
	const open = () =>
		(
			rl.open(host!, {
				shadeCover: { opacity: 0.4, tapToClose: true },
				animation: {
					enterFrom: { translateY: 400, duration: 250 },
					exitTo: { translateY: 400, duration: 200 },
				},
			}) as Promise<unknown>
		).then(
			() => console.log('[probe] sheet open'),
			(e: Error) => console.log('[probe] sheet open FAILED: ' + e.message),
		)

	const owner = host!.parent as any
	if (owner?.hasChild?.(host)) owner.close(host).then(open, open)
	else open()
}

export function closeSheet() {
	// host may be parented to a rootlayout that isn't current — close via
	// the owning parent.
	const owner = host?.parent as any
	if (host && owner?.hasChild?.(host)) owner.close(host)
	console.log('[probe] sheet close')
}

/** The current sheet host view — for harness asserts (view identity beats
 *  tree search: the host's owning rootlayout may unload/reload). */
export function sheetHost() {
	return host
}
