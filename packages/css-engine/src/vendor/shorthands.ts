/**
 * Replaces the pieces of @nativescript/core 9.1.3 `ui/core/properties` that
 * `css-selector` depends on: `_expandCssShorthand`,
 * `_pendingCssShorthandSubstitution`, `isCssVariable`, and
 * `CssPendingSubstitution`.
 *
 * Upstream populates `cssShorthandConverters` as a side effect of registering
 * `ShorthandProperty` instances across `ui/styling/style-properties.ts`,
 * `ui/layouts/flexbox-layout/flexbox-layout-common.ts`, and
 * `ui/action-bar/action-bar-common.ts`. This port keeps the same registry
 * shape but seeds it from `registerDefaultCssShorthands()` below instead of
 * property registration.
 *
 * Value divergence from upstream: upstream converters parse values into
 * `Length`/`PercentLength`/`Color`/`Font`/transform objects. This port's
 * converters emit raw declaration strings (same longhand names, same order,
 * same splitting rules). For pending var()/calc() substitution the marker
 * class is unchanged.
 */
import { splitOnTopLevelSpacesAndCommas } from './css-utils.ts';

const CSS_VARIABLE_NAME_RE = /^--[^,\s]+?$/;

export function isCssVariable(property: string) {
	return CSS_VARIABLE_NAME_RE.test(property);
}

export function isCssCalcExpression(value: string) {
	return value.includes('calc(');
}

export function isCssVariableExpression(value: string) {
	return value.includes('var(--');
}

/**
 * Marker for a shorthand declaration that cannot expand until the view
 * resolves var()/calc() - upstream `CssPendingSubstitution`.
 * @see https://drafts.csswg.org/css-variables/#variables-in-shorthands
 */
export class CssPendingSubstitution {
	public readonly shorthand: string;
	public readonly value: string;

	constructor(shorthand: string, value: string) {
		this.shorthand = shorthand;
		this.value = value;
	}

	toString(): string {
		return this.value;
	}
}

export function isCssPendingSubstitution(value: unknown): value is CssPendingSubstitution {
	return value instanceof CssPendingSubstitution;
}

/** Longhand cssName + expanded declaration value, in cascade order. */
export type CssShorthandConverter = (value: unknown) => [string, any][];

interface CssShorthandEntry {
	/** Explicit longhand names; used for var()/calc() pending substitution. */
	longhands?: string[];
	converter?: CssShorthandConverter;
}

const cssShorthands = new Map<string, CssShorthandEntry>();
const probedLonghands = new Map<string, string[]>();

export function registerCssShorthand(cssName: string, entry: CssShorthandEntry): void {
	cssShorthands.set(cssName, entry);
	probedLonghands.delete(cssName);
}

/** Sentinel matching upstream `unsetValue` (`{}` is enough for probing). */
const unsetValue = {};

/**
 * The longhands a shorthand expands into. Explicit `longhands` win; otherwise
 * the converter is probed with an unset sentinel like upstream
 * `getCssShorthandLonghands`.
 */
function getCssShorthandLonghands(cssName: string): string[] | undefined {
	const known = probedLonghands.get(cssName);
	if (known) {
		return known;
	}

	const entry = cssShorthands.get(cssName);
	if (!entry) {
		return undefined;
	}

	if (entry.longhands) {
		probedLonghands.set(cssName, entry.longhands);
		return entry.longhands;
	}

	if (!entry.converter) {
		return undefined;
	}

	try {
		const probed = entry.converter(unsetValue);
		if (!probed?.length) {
			return undefined;
		}

		const longhands: string[] = [];
		for (let i = 0, length = probed.length; i < length; i++) {
			longhands.push(probed[i][0]);
		}

		probedLonghands.set(cssName, longhands);

		return longhands;
	} catch {
		return undefined;
	}
}

/**
 * One pending-substitution value per longhand of the shorthand, or `undefined`
 * when the longhands cannot be determined.
 */
export function _pendingCssShorthandSubstitution(cssName: string, value: string): [string, CssPendingSubstitution][] | undefined {
	const longhands = getCssShorthandLonghands(cssName);
	if (!longhands) {
		return undefined;
	}

	const pending = new CssPendingSubstitution(cssName, value);
	const declarations: [string, CssPendingSubstitution][] = [];
	for (let i = 0, length = longhands.length; i < length; i++) {
		declarations.push([longhands[i], pending]);
	}

	return declarations;
}

/**
 * Expand a shorthand declaration into its longhand declarations, or `undefined`
 * when the property is not a shorthand, the value still has to be evaluated per
 * view (`var()`/`calc()`), or it does not parse.
 */
export function _expandCssShorthand(cssName: string, value: string): [string, any][] | undefined {
	const converter = cssShorthands.get(cssName)?.converter;
	if (!converter) {
		return undefined;
	}

	if (typeof value === 'string' && (isCssVariableExpression(value) || isCssCalcExpression(value))) {
		return undefined;
	}

	try {
		return converter(value);
	} catch {
		return undefined;
	}
}

// ---- Default shorthand table -------------------------------------------

// Upstream `parseShorthandPositioning` / `positioningFromParts`
// (ui/styling/style-properties.ts).
interface ShorthandPositioning {
	top: string;
	right: string;
	bottom: string;
	left: string;
}

function positioningFromParts(arr: string[], value: string): ShorthandPositioning {
	let top: string;
	let right: string;
	let bottom: string;
	let left: string;

	if (arr.length === 1) {
		top = arr[0];
		right = arr[0];
		bottom = arr[0];
		left = arr[0];
	} else if (arr.length === 2) {
		top = arr[0];
		bottom = arr[0];
		right = arr[1];
		left = arr[1];
	} else if (arr.length === 3) {
		top = arr[0];
		right = arr[1];
		left = arr[1];
		bottom = arr[2];
	} else if (arr.length === 4) {
		top = arr[0];
		right = arr[1];
		bottom = arr[2];
		left = arr[3];
	} else {
		throw new Error('Expected 1, 2, 3 or 4 parameters. Actual: ' + value);
	}

	return { top, right, bottom, left };
}

function parseShorthandPositioning(value: string): ShorthandPositioning {
	return positioningFromParts(value.split(/[ ,]+/), value);
}

// Upstream `parseBorderColorPositioning` — colors can be functions with spaces
// and commas in their arguments, so only top-level separators delimit sides.
function parseBorderColorPositioning(value: string): ShorthandPositioning {
	return positioningFromParts(splitOnTopLevelSpacesAndCommas(value.trim()), value);
}

// Upstream `convertToMargins` — upstream parses each side with
// PercentLength.parse; this port keeps the raw side string.
function convertToMargins(value: unknown): [string, any][] {
	if (typeof value === 'string' && value !== 'auto') {
		const thickness = parseShorthandPositioning(value);

		return [
			['margin-top', thickness.top],
			['margin-right', thickness.right],
			['margin-bottom', thickness.bottom],
			['margin-left', thickness.left],
		];
	}

	return [
		['margin-top', value],
		['margin-right', value],
		['margin-bottom', value],
		['margin-left', value],
	];
}

// Upstream `convertToPaddings`.
function convertToPaddings(value: unknown): [string, any][] {
	if (typeof value === 'string' && value !== 'auto') {
		const thickness = parseShorthandPositioning(value);

		return [
			['padding-top', thickness.top],
			['padding-right', thickness.right],
			['padding-bottom', thickness.bottom],
			['padding-left', thickness.left],
		];
	}

	return [
		['padding-top', value],
		['padding-right', value],
		['padding-bottom', value],
		['padding-left', value],
	];
}

// Upstream `parseShorthandGap` + `convertToGaps`.
function convertToGaps(value: unknown): [string, any][] {
	let rowGap: unknown;
	let colGap: unknown;

	if (typeof value === 'string' && value !== 'auto') {
		if (value.length) {
			const arr = value.split(/[ ,]+/);
			if (arr.length === 1) {
				rowGap = arr[0];
				colGap = arr[0];
			} else if (arr.length === 2) {
				rowGap = arr[0];
				colGap = arr[1];
			} else {
				throw new Error('Expected 1 or 2 parameters. Actual: ' + value);
			}
		} else {
			rowGap = 0;
			colGap = 0;
		}
	} else {
		rowGap = value;
		colGap = value;
	}

	return [
		['row-gap', rowGap],
		['column-gap', colGap],
	];
}

const FLEX_DIRECTIONS = new Set(['row', 'row-reverse', 'column', 'column-reverse']);
const FLEX_WRAPS = new Set(['nowrap', 'wrap', 'wrap-reverse']);
const isNonNegativeNumber = (value: any): boolean => {
	const parsed = parseInt(value);
	return isFinite(parsed) && value >= 0;
};

// Upstream flexbox-layout-common `flex-flow` converter.
function convertToFlexFlow(value: unknown): [string, any][] {
	const properties: [string, any][] = [];
	if (value === unsetValue) {
		properties.push(['flex-direction', value]);
		properties.push(['flex-wrap', value]);
	} else {
		const trimmed = typeof value === 'string' && value.trim();
		if (trimmed) {
			const values = trimmed.split(/\s+/);
			if (values.length >= 1 && FLEX_DIRECTIONS.has(values[0])) {
				properties.push(['flex-direction', values[0]]);
			}
			if ((value as string).length >= 2 && FLEX_WRAPS.has(values[1])) {
				properties.push(['flex-wrap', values[1]]);
			}
		}
	}

	return properties;
}

// Upstream flexbox-layout-common `flex` converter.
function convertToFlex(value: unknown): [string, any][] {
	const properties: [string, any][] = [];
	if (value === unsetValue) {
		properties.push(['flex-grow', value]);
		properties.push(['flex-shrink', value]);
	} else {
		const trimmed = typeof value === 'string' && value.trim();
		if (trimmed) {
			const values = trimmed.split(/\s+/);
			if (values.length === 1) {
				switch (values[0]) {
					case 'inital':
						properties.push(['flex-grow', 0]);
						properties.push(['flex-shrink', 1]);
						break;
					case 'auto':
						properties.push(['flex-grow', 1]);
						properties.push(['flex-shrink', 1]);
						break;
					case 'none':
						properties.push(['flex-grow', 0]);
						properties.push(['flex-shrink', 0]);
						break;
					default:
						if (isNonNegativeNumber(values[0])) {
							properties.push(['flex-grow', parseFloat(values[0])]);
							properties.push(['flex-shrink', 1]);
						}
				}
			}
			if (values.length >= 2) {
				if (isNonNegativeNumber(values[0]) && isNonNegativeNumber(values[1])) {
					properties.push(['flex-grow', parseFloat(values[0])]);
					properties.push(['flex-shrink', parseFloat(values[1])]);
				}
			}
		}
	}

	return properties;
}

// Upstream action-bar-common `convertToContentInset`.
function convertToContentInset(value: unknown): [string, any][] {
	if (typeof value === 'string' && value !== 'auto') {
		const insets = value.split(/[ ,]+/);

		return [
			['android-content-inset-left', insets[0]],
			['android-content-inset-right', insets[1] || insets[0]],
		];
	}

	return [
		['android-content-inset-left', value],
		['android-content-inset-right', value],
	];
}

let defaultsRegistered = false;

/**
 * Register every shorthand NativeScript core 9.1.3 expands. Idempotent.
 *
 * `background`, `transform`, and `font` have converters upstream that need the
 * color/gradient/matrix/font machinery; here they carry explicit longhands so
 * var()/calc() pending substitution still expands, but plain values pass
 * through unexpanded (see README divergence notes).
 */
export function registerDefaultCssShorthands(): void {
	if (defaultsRegistered) {
		return;
	}
	defaultsRegistered = true;

	registerCssShorthand('margin', { converter: convertToMargins });
	registerCssShorthand('padding', { converter: convertToPaddings });
	registerCssShorthand('gap', { converter: convertToGaps });
	registerCssShorthand('border-color', {
		converter: (value) => {
			if (typeof value === 'string') {
				const colors = parseBorderColorPositioning(value);
				return [
					['border-top-color', colors.top],
					['border-right-color', colors.right],
					['border-bottom-color', colors.bottom],
					['border-left-color', colors.left],
				];
			}
			return [
				['border-top-color', value],
				['border-right-color', value],
				['border-bottom-color', value],
				['border-left-color', value],
			];
		},
	});
	registerCssShorthand('border-width', {
		converter: (value) => {
			if (typeof value === 'string' && value !== 'auto') {
				const widths = parseShorthandPositioning(value);
				return [
					['border-top-width', widths.top],
					['border-right-width', widths.right],
					['border-bottom-width', widths.bottom],
					['border-left-width', widths.left],
				];
			}
			return [
				['border-top-width', value],
				['border-right-width', value],
				['border-bottom-width', value],
				['border-left-width', value],
			];
		},
	});
	registerCssShorthand('border-radius', {
		converter: (value) => {
			if (typeof value === 'string') {
				const radius = parseShorthandPositioning(value);
				return [
					['border-top-left-radius', radius.top],
					['border-top-right-radius', radius.right],
					['border-bottom-right-radius', radius.bottom],
					['border-bottom-left-radius', radius.left],
				];
			}
			return [
				['border-top-left-radius', value],
				['border-top-right-radius', value],
				['border-bottom-right-radius', value],
				['border-bottom-left-radius', value],
			];
		},
	});
	registerCssShorthand('flex-flow', { converter: convertToFlexFlow });
	registerCssShorthand('flex', { converter: convertToFlex });
	registerCssShorthand('android-content-inset', { converter: convertToContentInset });

	registerCssShorthand('background', {
		longhands: ['background-color', 'background-image', 'background-repeat', 'background-position'],
	});
	registerCssShorthand('transform', {
		longhands: ['translateX', 'translateY', 'scaleX', 'scaleY', 'rotate', 'rotatex', 'rotatey'],
	});
	registerCssShorthand('font', {
		longhands: ['font-style', 'font-weight', 'font-size', 'font-family'],
	});
}
