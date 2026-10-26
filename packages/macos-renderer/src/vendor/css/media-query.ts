/**
 * Replaces @nativescript/core 9.1.3 `media-query-list`/`checkIfMediaQueryMatches`.
 *
 * Upstream evaluates `matchQuery` from the bundled `css-mediaquery` package
 * against `Screen.mainScreen` and application properties. The macOS renderer
 * owns its window state, so the evaluator is injected:
 * `setCssMediaQueryEvaluator(fn)` must be called before rules inside `@media`
 * blocks can match. The default evaluator matches nothing — the conservative
 * choice, matching upstream's behavior of treating evaluation errors as
 * non-matching.
 */

export type CssMediaQueryEvaluator = (mediaQueryString: string) => boolean;

let evaluator: CssMediaQueryEvaluator = () => false;

export function setCssMediaQueryEvaluator(fn: CssMediaQueryEvaluator | undefined): void {
	evaluator = fn ?? (() => false);
}

/** Internal: invoked by the vendored selector scope for each query string. */
export function checkIfMediaQueryMatches(mediaQueryString: string): boolean {
	try {
		return evaluator(mediaQueryString);
	} catch {
		return false;
	}
}
