import { ContentView, getRootLayout } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { SheetPanel } from '../SheetPanel.tsrx';

let host: ContentView | null = null;

/** Bottom-anchored sheet: RootLayout.open with a dedicated sub-root. */
export function openSheet() {
	const rl = getRootLayout();
	if (!rl) {
		console.log('[probe] sheet: no rootlayout found');
		return;
	}
	if (!host) {
		host = new ContentView();
		host.id = 'sheet-host';
		// Bottom-dock the sheet inside the RootLayout grid.
		host.verticalAlignment = 'bottom';
		createNativeScriptRoot(host).render(SheetPanel as unknown as UniversalComponent, {});
	}
	rl.open(host, {
		shadeCover: { opacity: 0.4, tapToClose: true },
		animation: {
			enterFrom: { translateY: 400, duration: 250 },
			exitTo: { translateY: 400, duration: 200 },
		},
	});
	console.log('[probe] sheet open');
}

export function closeSheet() {
	const rl = getRootLayout();
	if (rl && host) rl.close(host);
	console.log('[probe] sheet close');
}
