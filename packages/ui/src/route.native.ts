/** Native twin of route.web — native navigation is Frame/Page stacks, not
 *  URL routes. These keep the import surface symmetric; they must never
 *  be called for real navigation (nav.native drives Frames directly). */
export type { Route } from './props';
import type { Route } from './props';
export function routeFor(_stack: string): Route | null {
	return null;
}
export function currentRoute(): Route | null {
	return null;
}
export function useRoute(_stack: string): Route | null {
	return null;
}
export function pushRoute(_r: Route): void {}
