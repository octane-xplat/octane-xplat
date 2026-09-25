/** @jsxImportSource @nativescript-community/octane */
import { GridLayout, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { Popover } from './Popover.native.tsrx';
import { topRootLayout } from './root-layout.native';
import { applyThemeClasses } from './theme/theme-scheme';
import type { ToastContent, ToastOptions, ToastPosition } from './props';

type ToastEntry = { content: ToastContent; options: ToastOptions };
type ActiveToast = ToastEntry & { host: GridLayout; root: any; timer: ReturnType<typeof setTimeout> | null; unbindTheme?: () => void };
const queue: ToastEntry[] = [];
let active: ActiveToast | null = null;

function placementFor(position: ToastPosition = 'bottom'): 'top' | 'bottom' {
	return position.startsWith('top') ? 'top' : 'bottom';
}

function horizontalFor(position: ToastPosition = 'bottom'): 'left' | 'center' | 'right' {
	if (position.endsWith('-start')) return 'left';
	if (position.endsWith('-end')) return 'right';
	return 'center';
}

function ToastBody(props: ToastEntry & { open: boolean }) @{
	@if (props.options.anchor) {
		<Popover
			open={props.open}
			anchor={props.options.anchor}
			placement={props.options.placement ?? placementFor(props.options.position)}
			dismissOnOutsideTap={false}
		>
			<gridlayout className="vx-toast">
				@if (typeof props.content === 'string') {
					<label>{props.content}</label>
				} @else {
					const Component = props.content;
					<Component />
				}
			</gridlayout>
		</Popover>
	} @else {
		@if (typeof props.content === 'string') {
			<label className="vx-toast">{props.content}</label>
		} @else {
			const Component = props.content;
			<gridlayout className="vx-toast"><Component /></gridlayout>
		}
	}
}

function finishToast(entry: ActiveToast) {
	if (active !== entry) return;
	if (entry.timer !== null) clearTimeout(entry.timer);
	entry.timer = null;
	const cleanup = () => {
		entry.unbindTheme?.();
		entry.root.unmount?.();
		if (active === entry) active = null;
		showNext();
	};

	if (entry.options.anchor) {
		entry.root.render(ToastBody as unknown as UniversalComponent, { ...entry, open: false });
		setTimeout(cleanup, 0);
		return;
	}

	const rootLayout = topRootLayout();
	if (rootLayout && (rootLayout as any).hasChild?.(entry.host)) {
		rootLayout.close(entry.host).then(cleanup, (error: unknown) => {
			console.error('[Toast] close failed', error);
			cleanup();
		});
	} else cleanup();
}

function showNext() {
	if (active || queue.length === 0) return;
	const entry = queue.shift()!;
	const anchored = Boolean(entry.options.anchor);
	const rootLayout = topRootLayout();
	if (!anchored && !rootLayout) {
		console.warn('[Toast] RootLayout is not mounted; toast was skipped');
		showNext();
		return;
	}

	const host = new GridLayout();
	const position = entry.options.position ?? 'bottom';
	const unbindTheme = applyThemeClasses(host, 'vx-toast-host');
	const root = createNativeScriptRoot(host);
	const current: ActiveToast = { ...entry, host, root, timer: null, unbindTheme };
	active = current;
	root.render(ToastBody as unknown as UniversalComponent, { ...entry, open: true });

	if (anchored) {
		current.timer = setTimeout(() => finishToast(current), Math.max(0, entry.options.duration ?? 3000));
		return;
	}

	host.horizontalAlignment = horizontalFor(position);
	host.verticalAlignment = placementFor(position) === 'top' ? 'top' : 'bottom';
	host.marginTop = placementFor(position) === 'top' ? 24 : 0;
	host.marginBottom = placementFor(position) === 'top' ? 0 : 24;
	Object.assign(host, isIOS ? entry.options.ios : isAndroid ? entry.options.android : undefined);
	rootLayout!.open(host).then(() => {
		if (active === current) current.timer = setTimeout(() => finishToast(current), Math.max(0, entry.options.duration ?? 3000));
	}, (error: unknown) => {
		console.error('[Toast] open failed', error);
		root.unmount?.();
		if (active === current) active = null;
		showNext();
	});
}

/** FIFO queue. Anchored options use Popover; unanchored options use the
 * RootLayout with top/bottom start/end alignment. */
export function showToast(content: ToastContent, options: ToastOptions = {}): void {
	queue.push({ content, options });
	showNext();
}
