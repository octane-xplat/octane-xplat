/**
 * Vendored from @nativescript/core 9.1.3 `ui/styling/style-scope.ts` — the
 * AST → RuleSet population pipeline (`_populateRules`,
 * `populateRulesFromImports`, the isKeyframe/isMedia/isRule predicates, and
 * the `Keyframes` record), with the cascade-layer logic from
 * packages/cli/patches/@nativescript__core@9.1.3.patch applied.
 *
 * Divergences from upstream:
 * - `CssAnimationParser.keyframeAnimationsFromCSSDeclarations` is not ported;
 *   keyframes are collected as `Keyframes` records but not parsed into
 *   animations (the renderer has no NS animation engine).
 * - `@import` resolution is injected via `setCssImportLoader` instead of
 *   reading files through `CSSSource`/the app filesystem. Without a loader,
 *   `@import` rules contribute nothing.
 * - `Trace` calls are dropped.
 */
import { fromAstNode, RuleSet } from './css-selector.ts';
import type * as ReworkCSS from './reworkcss.ts';
import { cssTreeParse } from './css-tree-parser.ts';
import { registerDefaultCssShorthands } from './shorthands.ts';

export interface Keyframes {
	name: string;
	keyframes: ReworkCSS.Rule[];
	mediaQueryString?: string | string[];
}

const pattern = /('|")(.*?)\1/;

/**
 * Resolves the url of an `@import` to another stylesheet's already-built
 * rules — injected because upstream reads through the app module system.
 */
export type CssImportLoader = (url: string, source?: string) => { selectors: RuleSet[]; keyframes: Keyframes[] } | null;

let importLoader: CssImportLoader | null = null;

export function setCssImportLoader(loader: CssImportLoader | null): void {
	importLoader = loader;
}

// Cascade-layer registry: qualified name -> first-seen ordinal, shared across
// every stylesheet feeding the cascade (layer order is document-wide per spec).
// '~' synthesizes names for anonymous layers, which authors cannot reference —
// the char is illegal in a CSS ident, so they never collide with named layers.
const cascadeLayerOrdinals = new Map<string, number>();
let cascadeLayerCount = 0;
let anonymousLayerCount = 0;

function layerOrdinal(name: string): number {
	let ordinal = cascadeLayerOrdinals.get(name);
	if (ordinal === undefined) {
		ordinal = cascadeLayerCount++;
		cascadeLayerOrdinals.set(name, ordinal);
	}
	return ordinal;
}

// Rank path for `name` nested under the layer at prefixPath/prefixName. Dotted
// names register each ancestor on the way down, so a top-level `@layer a.b`
// refers to the same layer as `@layer a { @layer b }`.
function layerPathFor(name: string, prefixPath: number[], prefixName: string): number[] {
	const path = [...prefixPath];
	let qualified = prefixName;
	for (const segment of name.split('.')) {
		qualified = qualified ? `${qualified}.${segment}` : segment;
		path.push(layerOrdinal(qualified));
	}
	return path;
}

function populateRulesFromImports(nodes: ReworkCSS.Node[], rulesets: RuleSet[], keyframes: Keyframes[]): void {
	const imports = nodes.filter((r) => r.type === 'import');
	if (!imports.length) {
		return;
	}

	const urlFromImportObject = (importObject: any) => {
		const importItem = importObject['import'] as string;
		const urlMatch = importItem && importItem.match(pattern);

		return urlMatch && urlMatch[2];
	};

	const layerFromImportObject = (importObject: any) => {
		const importItem = importObject['import'];
		const layerMatch = importItem && importItem.match(/\blayer\b(?:\(\s*([^)]*?)\s*\))?/);
		return layerMatch ? layerMatch[1] ?? '' : null;
	};

	const sourceFromImportObject = (importObject: any) => importObject['position'] && importObject['position']['source'];

	const toUrlSourcePair = (importObject: any) => ({
		url: urlFromImportObject(importObject),
		source: sourceFromImportObject(importObject),
	});

	const loaded = imports
		.map((importObject: any) => ({ ...toUrlSourcePair(importObject), layer: layerFromImportObject(importObject) }))
		.filter(({ url }) => !!url)
		.map(({ url, source, layer }) => ({ cssFile: importLoader ? importLoader(url as string, source) : null, layer }));

	for (const { cssFile, layer } of loaded) {
		if (cssFile) {
			if (layer !== null) {
				// @import "x.css" layer(name) — the imported sheet joins the named
				// layer; its own layers become nested sublayers of it.
				const importPath = [layerOrdinal(layer.trim() || `~import-${anonymousLayerCount++}`)];
				for (const ruleset of cssFile.selectors) {
					ruleset.layerPath = [...importPath, ...(ruleset.layerPath ?? [])];
				}
			}
			rulesets.push(...cssFile.selectors);
			keyframes.push(...cssFile.keyframes);
		}
	}
}

export function _populateRules(nodes: ReworkCSS.Node[], rulesets: RuleSet[], keyframes: Keyframes[], mediaQueryString?: string | string[], layerPath?: number[], layerPrefix?: string): void {
	for (const node of nodes) {
		if (isKeyframe(node)) {
			const keyframeRule: Keyframes = {
				name: node.name,
				keyframes: node.keyframes,
				mediaQueryString: mediaQueryString,
			};

			keyframes.push(keyframeRule);
		} else if (isMedia(node)) {
			// Media query can be an array of strings in case of nested queries
			let compositeMediaQuery: string | string[];

			if (mediaQueryString) {
				if (typeof mediaQueryString === 'string') {
					compositeMediaQuery = [mediaQueryString, node.media];
				} else {
					mediaQueryString.push(node.media);
					compositeMediaQuery = mediaQueryString;
				}
			} else {
				compositeMediaQuery = node.media;
			}

			_populateRules(node.rules, rulesets, keyframes, compositeMediaQuery, layerPath, layerPrefix);
		} else if (isLayer(node)) {
			const name = (node.layer ?? '').trim();
			if (node.rules) {
				// Block at-rule: a single name, or anonymous when the prelude is empty.
				const qualified = name ? (layerPrefix ? `${layerPrefix}.${name}` : name) : `${layerPrefix ?? ''}~${anonymousLayerCount++}`;
				const childPath = name ? layerPathFor(name, layerPath ?? [], layerPrefix ?? '') : [...(layerPath ?? []), layerOrdinal(qualified)];
				_populateRules(node.rules, rulesets, keyframes, mediaQueryString, childPath, qualified);
			} else {
				// Statement at-rule: `@layer a, b;` pre-declares order only.
				for (const declared of name.split(',')) {
					const declaredName = declared.trim();
					if (declaredName) {
						layerPathFor(declaredName, layerPath ?? [], layerPrefix ?? '');
					}
				}
			}
		} else if (isRule(node)) {
			const ruleset = fromAstNode(node);
			ruleset.mediaQueryString = mediaQueryString;
			if (layerPath?.length) {
				ruleset.layerPath = layerPath;
			}

			rulesets.push(ruleset);
		}
	}
}

/** `CSSSource.createSelectorsAndKeyframes` reduced to a string-in API. */
export function populateCssRules(css: string, source?: string): { selectors: RuleSet[]; keyframes: Keyframes[] } {
	registerDefaultCssShorthands();

	const ast = cssTreeParse(css, source);
	const rulesets: RuleSet[] = [];
	const keyframes: Keyframes[] = [];

	if (ast) {
		const nodes = ast.stylesheet.rules;
		populateRulesFromImports(nodes, rulesets, keyframes);
		_populateRules(nodes, rulesets, keyframes);
	}

	return { selectors: rulesets, keyframes };
}

function isMedia(node: ReworkCSS.Node): node is ReworkCSS.Media {
	return node.type === 'media';
}

function isKeyframe(node: ReworkCSS.Node): node is ReworkCSS.Keyframes {
	return node.type === 'keyframes';
}

function isLayer(node: ReworkCSS.Node): node is ReworkCSS.Layer {
	return node.type === 'layer';
}

function isRule(node: ReworkCSS.Node): node is ReworkCSS.Rule {
	return node.type === 'rule';
}
