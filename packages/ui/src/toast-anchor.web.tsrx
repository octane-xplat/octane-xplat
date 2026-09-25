import { createRoot } from 'octane';
import { Popover } from './Popover.web.tsrx';
import type { ToastContent, ToastOptions, ToastPosition } from './props';
import { cx } from './cx';
import { applyThemeClasses } from './theme/theme-scheme';

type ToastEntry = { content: ToastContent; options: ToastOptions };
const queue: ToastEntry[] = [];
let active = false;

function ToastBody(props: ToastEntry & { open: boolean }) @{
	@if (props.options.anchor) {
		<Popover
			open={props.open}
			anchor={props.options.anchor}
			placement={props.options.placement ?? placementFor(props.options.position)}
			dismissOnOutsideTap={false}
		>
			@if (typeof props.content === 'string') {
				<div className="vx-toast">{props.content}</div>
			} @else {
				const Component = props.content;
				<div className="vx-toast"><Component /></div>
			}
		</Popover>
	} @else {
		@if (typeof props.content === 'string') {
			<div className="vx-toast">{props.content}</div>
		} @else {
			const Component = props.content;
			<div className="vx-toast"><Component /></div>
		}
	}
}

function placementFor(position: ToastPosition = 'bottom'): 'top' | 'bottom' {
	return position.startsWith('top') ? 'top' : 'bottom';
}

function applyWebProps(host: HTMLElement, props?: Record<string, any>) {
	for (const [key, value] of Object.entries(props ?? {})) {
		if (key.includes('-')) host.setAttribute(key, String(value));
		else (host as any)[key] = value;
	}
}

function alignmentFor(position: ToastPosition = 'bottom') {
	if (position.endsWith('-start')) return 'flex-start';
	if (position.endsWith('-end')) return 'flex-end';
	return 'center';
}

function showNext() {
	if (active || queue.length === 0) return;
	active = true;
	const entry = queue.shift()!;
	const anchored = Boolean(entry.options.anchor);
	const host = document.createElement('div');
	const position = entry.options.position ?? 'bottom';
	const unbindTheme = applyThemeClasses(host, cx('vx-toast-host', placementFor(position) === 'top' ? 'vx-toast-top' : 'vx-toast-bottom'));
	applyWebProps(host, entry.options.web);
	if (anchored) host.style.display = 'none';
	else host.style.justifyContent = alignmentFor(position);

	document.body.appendChild(host);
	const root = createRoot(host);
	root.render(ToastBody, { ...entry, open: true });

	const finish = () => {
		const cleanup = () => {
			unbindTheme();
			root.unmount();
			host.remove();
			active = false;
			showNext();
		};

		if (anchored) {
			root.render(ToastBody, { ...entry, open: false });
			setTimeout(cleanup, 0);
		} else cleanup();
	};

	setTimeout(finish, Math.max(0, entry.options.duration ?? 3000));
}

/** FIFO queue. `anchor` uses the same portal positioning as Popover; without
 * one, top/bottom and their start/end alignment variants use the viewport. */
export function showToast(content: ToastContent, options: ToastOptions = {}): void {
	queue.push({ content, options });
	showNext();
}
