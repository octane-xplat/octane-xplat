import type { RouteName } from '../screens';

// Web seam for the nav contract — hash change + history back stand in for a
// real URL router (the route table lands when route files exist).
// `into` (named parallel stack) is ignored: web has one linear URL stack —
// parallel stacks map to nested routes, a router-level concern.
export function navigate(
	name: RouteName,
	params: Record<string, unknown> = {},
	opts: { into?: string } = {},
) {
	const q = new URLSearchParams(params as Record<string, string>).toString();
	location.hash = '#/' + name + (q ? '?' + q : '');
	console.log('[probe] nav web → #/' + name);
}

export function goBack(_opts: { into?: string } = {}) {
	history.back();
}
