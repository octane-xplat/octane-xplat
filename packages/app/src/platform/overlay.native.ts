import { ContentView, getRootLayout } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { OverlayPanel } from '../OverlayPanel.tsrx';

let host: ContentView | null = null;

/**
 * Overlays layer over the app's RootLayout (decision #22): one ContentView
 * host, one Octane sub-root, RootLayout.open/close for z-order + shadeCover.
 */
export function openOverlay() {
	const rl = getRootLayout();
	if (!rl) {
		console.log('[probe] overlay: no rootlayout found');
		return;
	}
	if (!host) {
		host = new ContentView();
		host.id = 'overlay-host';
		createNativeScriptRoot(host).render(OverlayPanel as unknown as UniversalComponent, {});
	}
	rl.open(host, {
		shadeCover: { opacity: 0.4, tapToClose: true },
	});
	console.log('[probe] overlay open');
}

export function closeOverlay() {
	const rl = getRootLayout();
	if (rl && host) rl.close(host);
	console.log('[probe] overlay close');
}
