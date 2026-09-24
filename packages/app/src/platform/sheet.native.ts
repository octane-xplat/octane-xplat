import { GridLayout, getRootLayout } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { SheetPanel } from '../SheetPanel.tsrx';

// GridLayout, not ContentView: the root host must be multi-child —
// ContentView's `.content` assignment keeps only the last root view.
let host: GridLayout | null = null;
let hostRoot: ReturnType<typeof createNativeScriptRoot> | null = null;

/** Bottom-anchored sheet: RootLayout.open with a dedicated sub-root.
 *  Content is parameterized — callers pass any component (e.g. a demo
 *  render fn); defaults to the SheetPanel probe panel. */
export function openSheet(Component: unknown = SheetPanel, props: Record<string, unknown> = {}) {
	const rl = getRootLayout();
	if (!rl) {
		console.log('[probe] sheet: no rootlayout found');
		return;
	}

	if (!host) {
		host = new GridLayout();
		host.id = 'sheet-host';
		// Bottom-dock the sheet inside the RootLayout grid.
		host.verticalAlignment = 'bottom';
		hostRoot = createNativeScriptRoot(host);
	}

	hostRoot!.render(Component as UniversalComponent, props);
	// rl.open rejects when the host is still attached — a re-open while a
	// previous sheet is up would crash as an unhandled rejection (seen as a
	// fatal JS exception on the release build). Close before reopening and
	// always handle the promise.
	if ((rl as any).hasChild?.(host)) (rl as any).close(host);
	(rl.open(host, {
		shadeCover: { opacity: 0.4, tapToClose: true },
		animation: {
			enterFrom: { translateY: 400, duration: 250 },
			exitTo: { translateY: 400, duration: 200 },
		},
	}) as Promise<unknown>).then(
		() => console.log('[probe] sheet open'),
		(e: Error) => console.log('[probe] sheet open FAILED: ' + e.message),
	);
}

export function closeSheet() {
	const rl = getRootLayout();
	if (rl && host) rl.close(host);
	console.log('[probe] sheet close');
}
