# src/vendor — NativeScript core CSS selector engine

Vendored from **@nativescript/core 9.1.3** (NativeScript/NativeScript tag
`9.1.3-core`, `packages/core/`), MIT licensed (see `LICENSE`). The
`packages/cli/patches/@nativescript__core@9.1.3.patch` hunks touching these
files (the `@layer` atrule mapping and cascade-layer ranking) are applied.

## File map

| File | Upstream source |
| --- | --- |
| `css-tree-parser.ts` | `css/css-tree-parser.ts` (+ patch: `@layer` atrule) |
| `reworkcss.ts` | `css/reworkcss.d.ts` (+ patch: `Layer` node type) |
| `css-selector.ts` | `ui/styling/css-selector.ts` (+ patch: `RuleSet.layerPath`, `compareLayerPaths` in `compareSelectors`) |
| `rules.ts` | `ui/styling/style-scope.ts` — `populateRulesFromImports`, `_populateRules`, the node predicates, `Keyframes`; same patch applied |
| `shorthands.ts` | `ui/core/properties` shorthand registry (`_expandCssShorthand`, `_pendingCssShorthandSubstitution`, `isCssVariable`, `CssPendingSubstitution`) + the shorthand converters from `ui/styling/style-properties.ts`, `ui/layouts/flexbox-layout/flexbox-layout-common.ts`, `ui/action-bar/action-bar-common.ts` |
| `css-utils.ts` | `ui/styling/css-utils.ts` — `cleanupImportantFlags` and the top-level split helpers |
| `media-query.ts` | replaces `media-query-list` `checkIfMediaQueryMatches` |

Runtime npm deps this code still shares with upstream: `css-tree` (the parser
the `__CSS_PARSER__ === 'css-tree'` build path — what @nativescript/vite
defines by default — uses), `css-what` (selector parsing inside
`createSelector`), and `@csstools/css-calc@2.1.4` (upstream's `calc()`
evaluator, used by `src/cascade.ts`). The other two upstream parser paths
(rework, CSS3Parser) are not ported.

## NS semantic notes the renderer relies on

- **No `!important` priority**: upstream `cleanupImportantFlags` strips the
  flag at declaration parse and warns — cascade order decides, exactly like
  NS 9.1.3.
- **`InheritedCssProperty` set (cssNames)** — `color`, `direction`,
  `font-family`, `font-size`, `font-style`, `font-weight`,
  `font-variation-settings`, `letter-spacing`, `line-height`, `text-align`,
  `text-transform`, `text-shadow`, `text-stroke`, `white-space`,
  `tint-color`, `selected-background-color`, `selected-text-color`,
  `_fontScaleInternal`.
- **Dynamic selectors**: `query()` may-return superset; callers re-check
  `sel.match(node)` at apply time (upstream `CssState` line ~778 semantics).


## Divergences from upstream

- **`IdSelector.match` and candidate lookup**: both honor `node.cssId` — the renderer's `node.id`
  is a numeric node id, not the CSS `#id` attribute.

  Candidate collection includes the CSS attribute as well as the native id,
  deduplicating equal identities. A match-only adaptation is insufficient:
  numeric host ids otherwise prevent authored #id rules from being considered.
  The desktop cascade regression tests cover id changes/removal, compound
  selectors and string-id deduplication.

- **Syntax**: enums/namespaces/decorators/parameter properties replaced with
  `as const` objects, module-level classes (`ChildGroup`, `SiblingGroup`,
  exported via a `Selector` compat object), and post-declaration prototype
  assignments — Node `--experimental-strip-types` requires erasable syntax.
- **Media queries**: `checkIfMediaQueryMatches` is injected via
  `setCssMediaQueryEvaluator(fn)`; the default evaluator matches nothing
  (upstream reads `Screen.mainScreen` + application properties and treats
  evaluation errors as non-matching).
- **`@import`**: upstream resolves through `CSSSource`/the app filesystem;
  here via `setCssImportLoader(fn)`. No loader → `@import` contributes
  nothing.
- **Shorthand values**: upstream converters produce `Length`/`PercentLength`/
  `Color`/`Font` objects; this port emits raw declaration strings. Longhand
  names, order, and splitting rules are identical. Registered shorthands:
  `margin`, `padding`, `gap`, `border-color`, `border-width`,
  `border-radius`, `flex-flow`, `flex`, `android-content-inset` (full
  converters), plus `background`, `transform`, `font` with longhand lists
  only — `var()`/`calc()` pending substitution expands, plain values pass
  through unexpanded (upstream would parse them into Color/Background/
  transform/Font objects).
- **`keyframes`**: collected as records; `CssAnimationParser` is not ported.
- **`Trace`** logging dropped; `globals` side-effect import removed.
- `Node` interface is unchanged (parent, id, cssType, cssClasses,
  cssPseudoClasses, getChildIndex/getChildAt/getChildrenCount).

## Usage

```ts
import { populateCssRules } from './rules.ts';
import { StyleSheetSelectorScope } from './css-selector.ts';
import { setCssMediaQueryEvaluator } from './media-query.ts';

setCssMediaQueryEvaluator((q) => myMediaMatch(q));
const { selectors, keyframes } = populateCssRules(cssText, 'app.css');
const scope = new StyleSheetSelectorScope(selectors);
const match = scope.query(node); // node implements the Node interface
```
