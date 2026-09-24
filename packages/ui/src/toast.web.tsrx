import { createRoot } from 'octane';
import type { ToastContent, ToastOptions } from './props';
import { cx } from './cx';

type ToastEntry = { content: ToastContent; options: ToastOptions };
const queue: ToastEntry[] = [];
let active = false;

function ToastBody(props: { content: ToastContent }) @{
	@if (typeof props.content === 'string') {
		<div className="vx-toast">{props.content}</div>
	} @else {
		const Component = props.content;
		<div className="vx-toast"><Component /></div>
	}
}

function applyWebProps(host: HTMLElement, props?: Record<string, any>) {
	if (!props) return;
	for (const [key, value] of Object.entries(props)) {
		if (key.includes('-')) host.setAttribute(key, String(value));
		else (host as any)[key] = value;
	}
}

function showNext() {
	if (active || queue.length === 0) return;
	active = true;
	const entry = queue.shift()!;
	const host = document.createElement('div');
	host.className = cx('vx-toast-host', entry.options.position === 'top' ? 'vx-toast-top' : 'vx-toast-bottom');
	applyWebProps(host, entry.options.web);
	document.body.appendChild(host);
	const root = createRoot(host);
	root.render(ToastBody, { content: entry.content });
	setTimeout(() => {
		root.unmount();
		host.remove();
		active = false;
		showNext();
	}, Math.max(0, entry.options.duration ?? 3000));
}

/** FIFO queue; each toast is shown after the prior toast closes. */
export function showToast(content: ToastContent, options: ToastOptions = {}): void {
	queue.push({ content, options });
	showNext();
}
