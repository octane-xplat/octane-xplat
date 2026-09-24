// Deep links — native leaf. iOS delivers openUrl + launchOptions; Android
// delivers an intent on resume/newIntent. Handlers get the raw URL string —
// the app maps it onto its route table.
import { Application } from '@nativescript/core';

type LinkHandler = (url: string) => void;
const handlers = new Set<LinkHandler>();
let wired = false;
let initial: string | null = null;

function wire() {
	if (wired) return;
	wired = true;
	if (Application.ios) {
		Application.on('openUrl', (args: any) => {
			const url = args.url?.absoluteString ?? String(args.url ?? '');
			for (const h of handlers) h(url);
		});
	}
	if (Application.android) {
		Application.on(Application.resumeEvent, () => {
			const intent = Application.android.foregroundActivity?.getIntent?.();
			const url = intent?.getDataString?.();
			if (url) for (const h of handlers) h(url);
		});
	}
}

export function onDeepLink(cb: LinkHandler): () => void {
	wire();
	handlers.add(cb);
	return () => handlers.delete(cb);
}

export function consumeInitialUrl(): string | null {
	const u = initial;
	initial = null;
	return u;
}
