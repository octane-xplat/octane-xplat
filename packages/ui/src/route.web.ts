import { useSyncExternalStore } from 'octane';

/** Web route store — the browser half of the nav contract. One linear URL
 *  stack; `stack` names the conceptual outlet ('root' covers the app, a
 *  named stack is the pane that owns it — parallel stacks map to nested
 *  routes). URL shape: /<stack>/<name>?params or /<name>?params for root.
 *  Module-scope like every other store — the pane that owns `stack`
 *  subscribes with useRoute(stack) and swaps its content. */

export interface Route {
	stack: string;
	name: string;
	params: Record<string, unknown>;
}

const listeners = new Set<() => void>();
let current: Route | null = parse();

function parse(): Route | null {
	const parts = location.pathname.split('/').filter(Boolean);
	if (!parts.length) return null;
	const [name, stack] = parts.length === 1 ? [parts[0], 'root'] : [parts[1], parts[0]];
	const params: Record<string, unknown> = {};
	new URLSearchParams(location.search).forEach((v, k) => (params[k] = v));
	return { stack, name, params };
}

function build(r: Route): string {
	const q = new URLSearchParams(r.params as Record<string, string>).toString();
	const path = r.stack === 'root' ? '/' + r.name : '/' + r.stack + '/' + r.name;
	return path + (q ? '?' + q : '');
}

function emit() {
	listeners.forEach((l) => l());
}

export function pushRoute(r: Route): void {
	history.pushState(null, '', build(r));
	current = r;
	emit();
}

window.addEventListener('popstate', () => {
	current = parse();
	emit();
});

/** Current route if it targets `stack`, else null. */
export function routeFor(stack: string): Route | null {
	return current && current.stack === stack ? current : null;
}

/** The route active at boot — for deep-link tab selection. */
export function currentRoute(): Route | null {
	return current;
}

export function useRoute(stack: string): Route | null {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb);
			return () => listeners.delete(cb);
		},
		() => routeFor(stack),
	);
}
