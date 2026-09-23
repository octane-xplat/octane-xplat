import type { RouteName } from '../screens';

// Web seam for the nav contract — hash change + history back stand in for a
// real URL router (the route table lands when route files exist).
export function navigate(name: RouteName, params: Record<string, unknown> = {}) {
	const q = new URLSearchParams(params as Record<string, string>).toString();
	location.hash = '#/' + name + (q ? '?' + q : '');
	console.log('[probe] nav web → #/' + name);
}

export function goBack() {
	history.back();
}
