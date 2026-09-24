/** @jsxImportSource @nativescript-community/octane */
import { getRootLayout, GridLayout, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { ToastContent, ToastOptions } from './props';
import { cx } from './cx';
import { getColorScheme } from './theme/colorScheme.native.tsrx';

type ToastEntry = { content: ToastContent; options: ToastOptions };
type ActiveToast = ToastEntry & { host: GridLayout; root: any; timer: ReturnType<typeof setTimeout> | null };

const queue: ToastEntry[] = [];
let active: ActiveToast | null = null;

function ToastBody(props: { content: ToastContent }) @{
	@if (typeof props.content === 'string') {
		<label className="vx-toast">{props.content}</label>
	} @else {
		const Component = props.content;
		<gridlayout className="vx-toast"><Component /></gridlayout>
	}
}

function finishToast(entry: ActiveToast) {
	if (active !== entry) return;
	if (entry.timer !== null) clearTimeout(entry.timer);
	entry.timer = null;
	const rootLayout = getRootLayout();
	const finish = () => {
		entry.root.unmount?.();
		if (active === entry) active = null;
		showNext();
	};

	if ((rootLayout as any)?.hasChild?.(entry.host)) {
		rootLayout.close(entry.host).then(finish, (error) => {
			console.error('[Toast] close failed', error);
			finish();
		});
	} else finish();
}

function showNext() {
	if (active || queue.length === 0) return;
	const entry = queue.shift()!;
	const rootLayout = getRootLayout();
	if (!rootLayout) {
		console.warn('[Toast] RootLayout is not mounted; toast was skipped');
		return;
	}

	const host = new GridLayout();
	host.className = cx('vx-toast-host', getColorScheme() === 'dark' && 'ns-dark');
	host.horizontalAlignment = 'stretch';
	host.verticalAlignment = entry.options.position === 'top' ? 'top' : 'bottom';
	host.marginTop = entry.options.position === 'top' ? 24 : 0;
	host.marginBottom = entry.options.position === 'top' ? 0 : 24;
	Object.assign(host, isIOS ? entry.options.ios : isAndroid ? entry.options.android : undefined);
	const root = createNativeScriptRoot(host);
	const current: ActiveToast = { ...entry, host, root, timer: null };
	active = current;
	root.render(ToastBody as unknown as UniversalComponent, { content: entry.content });
	const open = () => {
		rootLayout.open(host).then(() => {
			if (active === current) current.timer = setTimeout(() => finishToast(current), Math.max(0, entry.options.duration ?? 3000));
		}, (error) => {
			console.error('[Toast] open failed', error);
			root.unmount?.();
			if (active === current) active = null;
			showNext();
		});
	};

	if ((rootLayout as any).hasChild?.(host)) {
		rootLayout.close(host).then(open, (error) => {
			console.error('[Toast] stale host close failed', error);
			if (active === current) active = null;
			showNext();
		});
	} else open();
}

/** FIFO queue; each toast is shown after the prior toast closes. */
export function showToast(content: ToastContent, options: ToastOptions = {}): void {
	queue.push({ content, options });
	showNext();
}
