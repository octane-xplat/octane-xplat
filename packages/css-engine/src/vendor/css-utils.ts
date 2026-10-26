/**
 * Vendored from @nativescript/core 9.1.3 `ui/styling/css-utils.ts` — only the
 * helpers css-selector/shorthand expansion use. Upstream's `!important` notice
 * goes through Trace; this port drops the trace (no Trace infrastructure in
 * the renderer) and keeps the strip behavior identical.
 */

export function cleanupImportantFlags(value: unknown, _propertyName: string) {
	if (typeof value !== 'string') {
		return '' + value;
	}

	const index = value?.indexOf('!important');
	if (index >= 0) {
		return value.substring(0, index).trim();
	}
	return value;
}

function isWhiteSpaceCode(code: number): boolean {
	return code === 32 || (code >= 9 && code <= 13) || code === 160;
}

const ANY_WHITE_SPACE_RE = /\s+/;
const SPACES_AND_COMMAS_RE = /[\s,]+/;

/**
 * Matches whitespace outside of parenthesis, but only reliably for a single
 * nesting level - fine for `rgb(a, b, c)`, wrong for `color-mix(...)` holding
 * nested functions.
 */
const FLAT_WHITE_SPACE_RE = /\s(?![^(]*\))/;

/**
 * The comma form of {@link FLAT_WHITE_SPACE_RE}, with the same one-level limit.
 */
const FLAT_COMMA_RE = /,(?![^(]*\))/;

function isNotEmpty(part: string): boolean {
	return part !== '';
}

function hasNestedParens(value: string, open: number): boolean {
	while (open !== -1) {
		const nextOpen = value.indexOf('(', open + 1);
		if (nextOpen === -1) {
			return false;
		}

		const close = value.indexOf(')', open + 1);
		if (close === -1 || nextOpen < close) {
			return true;
		}

		open = nextOpen;
	}

	return false;
}

// The character scan below is what handles arbitrary nesting, but without a JIT
// it is several times slower than the native regex engine - so values a regex
// splits correctly (none or a single level of parenthesis) keep taking one.
function splitTopLevel(value: string, commaIsSeparator: boolean): string[] {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;

	for (let i = 0, length = value.length; i < length; i++) {
		const code = value.charCodeAt(i);
		if (code === 40 /* ( */) {
			depth++;
		} else if (code === 41 /* ) */) {
			if (depth > 0) {
				depth--;
			}
		} else if (depth === 0 && (isWhiteSpaceCode(code) || (commaIsSeparator && code === 44))) {
			if (i > start) {
				parts.push(value.slice(start, i));
			}
			start = i + 1;
		}
	}

	if (start < value.length) {
		parts.push(value.slice(start));
	}

	return parts;
}

/**
 * Split on whitespace outside of any parenthesis, so function values keep their
 * arguments together whatever their nesting - e.g. `color-mix(in srgb, var(--x) 35%, transparent)`.
 * Consecutive whitespace produces no empty parts.
 */
export function splitOnTopLevelWhiteSpace(value: string): string[] {
	const open = value.indexOf('(');
	if (open === -1) {
		return value.split(ANY_WHITE_SPACE_RE).filter(isNotEmpty);
	}
	if (!hasNestedParens(value, open)) {
		return value.split(FLAT_WHITE_SPACE_RE).filter(isNotEmpty);
	}

	return splitTopLevel(value, false);
}

/**
 * Like {@link splitOnTopLevelWhiteSpace}, but commas separate too - the tolerant
 * form positioning shorthands like `border-color` accept.
 */
export function splitOnTopLevelSpacesAndCommas(value: string): string[] {
	if (!value.includes('(')) {
		return value.split(SPACES_AND_COMMAS_RE).filter(isNotEmpty);
	}

	return splitTopLevel(value, true);
}

/**
 * Split on commas outside of any parenthesis - e.g. `rgb(a, b, c), rgb(d, e, f)`
 * splits only between the two functions. Empty parts are kept, like `String.split`.
 */
export function splitOnTopLevelComma(value: string): string[] {
	const open = value.indexOf('(');
	if (open === -1) {
		return value.split(',');
	}
	if (!hasNestedParens(value, open)) {
		return value.split(FLAT_COMMA_RE);
	}

	return splitTopLevelComma(value);
}

function splitTopLevelComma(value: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;

	for (let i = 0, length = value.length; i < length; i++) {
		const code = value.charCodeAt(i);
		if (code === 40 /* ( */) {
			depth++;
		} else if (code === 41 /* ) */) {
			if (depth > 0) {
				depth--;
			}
		} else if (depth === 0 && code === 44) {
			parts.push(value.slice(start, i));
			start = i + 1;
		}
	}

	parts.push(value.slice(start));

	return parts;
}
