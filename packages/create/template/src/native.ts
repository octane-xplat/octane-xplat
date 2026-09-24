// Native entry — the iOS/Android twin of main.web.tsrx. Same App.tsrx,
// different shell: a Frame hosting a Page that renders the universal root.
import { Application, Frame, Page } from '@nativescript/core';
import { renderNativeScriptApp } from '@nativescript-community/octane';
import { App } from './App.tsrx';
import '@octane-xplat/ui/theme/tokens.css';
import './style.css';

const entry = {
	create: () => {
		// Root is a Frame so pushRoute() can push Pages later — a Frame
		// window root doubles as the 'root' stack with no registration;
		// named stacks come from TabSpec.stack or registerStack. Route
		// pushes also need registerScreens({name: Component}) at boot.
		const frame = new Frame();
		const page = new Page();
		page.actionBarHidden = true;
		renderNativeScriptApp(page, App);
		frame.navigate({ create: () => page });
		return frame;
	},
};

// Under the vite dev session the placeholder bootstrap has already run
// Application.run(), and a module-graph reload re-evaluates this entry.
// Android's run() throws "Application is already started" on re-entry
// (iOS core handles the placeholder handoff internally); resetRootView is
// the documented way to swap the root of a running app.
if (Application.started) {
	Application.resetRootView(entry);
} else {
	Application.run(entry);
}
