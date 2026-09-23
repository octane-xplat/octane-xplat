// Native entry — the iOS/Android twin of main.web.tsrx. Same App.tsrx,
// different shell: a Frame hosting a Page that renders the universal root.
import { Application, Frame, Page } from '@nativescript/core';
import { renderNativeScriptApp } from '@nativescript-community/octane';
import { App } from './App.tsrx';
import '@octane-xplat/ui/theme/tokens.css';
import './style.css';

Application.run({
	create: () => {
		// Root is a Frame so navigate() can push Pages later — registered
		// stacks (@octane-xplat/ui registerStack) sit on top of this.
		const frame = new Frame();
		const page = new Page();
		page.actionBarHidden = true;
		renderNativeScriptApp(page, App);
		frame.navigate({ create: () => page });
		return frame;
	},
});
