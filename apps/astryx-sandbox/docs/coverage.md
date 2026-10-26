# Astryx sandbox coverage and API mappings

Baseline: `facebook/astryx@ebd939b665361a078015377c0dfe50cc3c1d70a4`
(`@astryxdesign/core` 0.6.4, MIT). Oracle: upstream
`apps/sandbox/scripts/next-export-routes.json` — 771 routes, verified by
`scripts/generate-coverage.mjs` against a pinned checkout (bijection enforced
between oracle routes and upstream sources; HEAD must equal the pin).

Generated registry: `src/coverage/pinned.ts`. Status join:
`src/coverage/coverage.ts` — `ported` (real Octane implementation),
`pending` (honest placeholder), `blocked` (recorded framework gap). Rows are
never dropped; the ledger at `/templates/` renders this data live.

## Route inventory

| Kind | Count | Upstream source | Port status |
| --- | --- | --- | --- |
| fixed (`/`, `/404/`) | 2 | `(sandbox)/page.tsx`, generated | both ported |
| category indexes | 3 | `[category]/CategoryContent.tsx` | all ported |
| template index (`/templates/`) | 1 | `(sandbox)/templates/page.tsx` | ported as coverage ledger |
| authored pages (`/pages/*`) | 51 | `(sandbox\|fullscreen\|raw)/pages/**/page.tsx` | 8 ported (5 palettes, tap-targets, textarea-counter, component-scores), 43 pending |
| block templates | 659 | `cli/assets/templates/blocks/components/<Family>/<Name>.tsx` | 186 ported (Button ×6, Text ×9, overlays ×56, forms/selection/date ×99, flat tables ×15, pagination ×1), 473 pending |
| page templates | 55 | `cli/assets/templates/pages/<slug>/page.tsx` | 2 ported (`table`, `table-page`), 53 pending |

Routing preserves the pinned URL space (trailing-slash routes resolve
against `/templates/:name` and `/pages/*rest`; unmatched URLs land on the
catch-all 404 screen). Upstream generates a static page per route; this port
is a client-routed SPA — adaptation recorded.

## API mappings and substitutions (unit 1)

| Upstream API | Xplat equivalent | Disposition |
| --- | --- | --- |
| `Theme`/`defineTheme`/`useTheme` + 6 theme packages | `Theme`/`defineTheme`/`useTheme`/`useThemeName`/`registerTheme`/`resolveThemeTokens`/`generateThemeCss` in `@octane-xplat/ui` (new public API); 7 theme packages ported under `src/themes/` from `@astryxdesign/theme-*@0.6.4` built CSS | **ported** — all six root themes selectable; light/dark, nested scopes, persistence, embed-query precedence work |
| `localStorage` theme/mode + `?embed/theme/mode` | `persist.web.ts` leaf + `Theme` root scope | same keys (`astryx-sandbox-theme/mode`); embed beats storage and skips writes |
| `LayerProvider` root | internal layer stack exists; no public provider | finding (unit 4): no public surface needed by unit-1 screens |
| `LinkProvider component={SandboxLink}` + `useLinkComponent` | `LinkProvider`/`useLinkComponent`/`LinkContext` in `@octane-xplat/ui` (new public API, unit 3) | **ported** — provider mounted at app root; `Link`, `SideNav`, `TopNav`, `TabList`, `Breadcrumbs`, and `TreeList` leaf rows resolve `as` → provider → platform default. Custom components receive `to={href}` (router-style); `isSafeDestination` guards both destination props. `SandboxLink` accepts `to` and navigates via the canonical router |
| `PreviewShell` (toolbar, tree nav, ⌘-palette, source view, copy, viewport sizes, embed iframe) | composed in `shell/PreviewShell.web.tsrx` from `Button`/`DropdownMenu`/`SegmentedControl`/`CommandPalette`+`createStaticSource`/`TreeList`/`CodeBlock`/`useClipboard` | **ported** — palette catalog covers all 714 template routes plus authored pages (upstream listed categories only; recorded superset). `embed.html` sibling → same-route `?embed=1` SPA adaptation; `astryx-theme-sync` postMessage contract preserved |
| `sourceRegistry` (generated upstream sources) | `src/source-registry.ts` — `import.meta.glob('?raw')` over the ported examples/pages | **adapted** — code view shows the Octane `.tsrx` actually running; pending rows state "Source not available" + upstream path rather than quoting code that isn't running |
| `SegmentedControl`+`SegmentedControlItem` children | options-driven `options={[{value,label}]}` | adaptation — no child part (F-6); segments show text labels instead of icon-only |
| `Layout`, `LayoutHeader`, `LayoutContent` | `Layout`/`LayoutHeader`/`LayoutContent` in `@octane-xplat/ui` (new public API) | **ported** — every screen composes the real regions (`hasDivider`, `padding={6}`); `PageLayout.tsrx` deleted. `LayoutFooter`/`LayoutPanel`/`GridSpan` remain unported (F-3 partial) |
| `TreeListItemData.href`/`isSelected` | `TreeListNode.href` (new) + `selectedKeys`/`selectionMode` | **ported** — href rows render the injected link element; leaf activation also reports `onAction` for keyboard paths |
| `Grid columns={{minWidth}}` responsive | none — track grammar is static | `.sb-card-grid` CSS `repeat(auto-fill, minmax(320px,1fr))` — adaptation |
| `Text`/`Heading` `type`/`size`/`color`/`weight`/`maxLines` props | **ported** in `@octane-xplat/ui` — `type`/`size`/`color`/`weight` resolve the theme's `--text-*`/`--font-*`/`--color-text-*` scale; `maxLines` replaces `numberOfLines`/`ellipsize`. `wordBreak`/`textWrap`/`display`/`hasStrikethrough`/`hasTabularNumbers`/`hasTruncateTooltip`/`as` remain unported (style props and the `sb-block`/`sb-strikethrough`/`sb-tabular` helpers cover them) |
| `Badge variant="info|warning|neutral" label` | `Badge` unstyled container | `.sb-badge--*` classes — adaptation |
| `Icon icon={<Icon icon={HeroIcon}/>}` (heroicons) | `icon` prop takes registered `IconName` | `sandbox-*` glyph registrations, same MIT path data |
| `ToggleButtonGroup`/`ToggleButton` (single select) | same shape (value/onChange/children) | **ported** — F-7 resolved; the home filter row and `activeTab` grouping match upstream (see F-7) |
| `TextInput isLabelHidden startIcon` | `TextInput` `label`/`isLabelHidden`/`startIcon`/`size="lg"` | **ported** — home and category/template-index search fields use `TextInput` directly |
| `SideNav*` `as={Link}` | `SideNavItem as` prop + `href` | direct shape parity |
| `DropdownMenu button={…isIconOnly}` | `DropdownMenu` `button` prop (renders the shared `Button`) + `menuWidth`/`hasChevron` | **ported** — `SandboxNav` theme/mode triggers use `button={{…, isIconOnly: true}}`; `items` keep the `MenuData` contract (`type:'action'`/`onSelect` maps upstream `{label, onClick}`) |
| `localStorage` theme/mode + `?embed/theme/mode` | `persist.web.ts` leaf (same keys: `astryx-sandbox-theme/mode`) | implemented for mode; theme param honored when a theme exists |
| `matchMedia`-gated `hideOnSmall/hideOnLarge` home classes | — | dropped cosmetic responsive duplication on the home filter row (visible always); recorded, not load-bearing |

## API mappings and substitutions (unit 4 — layers and overlays)

| Upstream API | Xplat equivalent | Disposition |
| --- | --- | --- |
| `LayerProvider` + `LayerContext` + toast config | `LayerProvider`/`LayerContext`/`useLayerContext`/`LayerToastConfig` in `@octane-xplat/ui` (new public API) | **ported** — provider mounts the configured `ToastViewport`; nested providers pass through; sandbox `App` mounts it at root |
| `usePopover` | `usePopover` in `@octane-xplat/ui` (new public API, built on `useLayer`) | **ported** — `triggerRef`/`triggerProps`/`toggle`/`render` contract; upstream's `hasAutoFocus`/`hasCloseButton`/`isModal`/`role`/`hasSurface`/`padding`/`surfaceTarget` options out of scope (PopoverHookUsage exercises `dialogLabel` only) |
| `useTooltip` | `useTooltip` in `@octane-xplat/ui` (new public API) | **ported** — web leaf mirrors `useHoverCard` machinery (hover/focus intent, delays, scroll/Escape dismiss, `aria-describedby` on the resolved focusable trigger, `role="tooltip"` surface with pointer-events off); AppKit leaf hosts the anchored popup through `appKitHost`; iOS/Android leaf binds refs but never mounts (matches `Tooltip`) |
| `useMediaQuery` | `useMediaQuery` in `@octane-xplat/ui` (new public API) | **ported** — web `matchMedia`; iOS/Android evaluate a restricted grammar (`(max|min)-(width|height)`, `pointer`, `hover`, `orientation`, `and`/`or`/`,`/`not`) against `Screen.mainScreen` — screen, not window, is the documented approximation |
| `DropdownMenu`/`ContextMenu` `presentation="bottom-sheet"\|"adaptive"`, `label` | same props added to `DropdownMenu`/`ContextMenu` | **ported** — sheets mount `MenuData` rows inside `BottomSheet` under a `MenuProvider`; adaptive resolves via `(max-width: 768px) and (pointer: coarse)` on web and always-sheet on mobile (same predicate as `MoreMenu`) |
| Menu item `description`, `variant="destructive"` | `MenuItemData.description`/`variant` + `MenuItemProps.variant` | **ported** — rows paint `.vx-menu-item--destructive` (error text color) |
| `useImperativeDialog(defaults)` | `useImperativeDialog(defaults?: DialogOptions)` | **ported** — defaults merge under per-`show` options |
| `Overlay` media-scrim component (3 templates) | name collision with Xplat `Overlay` (modal scrim) | **adapted** — `examples/overlay/MediaOverlay.tsrx` composes the scrim+content pattern from `View`; upstream `<img>` sources substituted with themed gradient blocks |
| `Layout`/`LayoutContent`/`LayoutFooter` slot composition (dialog examples) | `Layout`/`LayoutContent` now exist in `@octane-xplat/ui`; `LayoutFooter` still missing | remains re-authored as `VStack` + padded sections until `LayoutFooter` lands |
| `Button` `onClick` | `clickAction` | direct map (upstream contract preserved) |
| `Text` `type`/`weight`/`color` | native `Text` props (`type`/`size`/`color`/`weight`) in `@octane-xplat/ui` | **ported** — all screens and examples pass the real props; the `sb-type-*`/`sb-color-*` shims are removed |
| DropdownMenu `button={{label,variant,icon,isIconOnly}}` + `hasChevron` | `button` prop + `hasChevron` on `DropdownMenu` | **ported** — the trigger is the shared `Button` (a real `<button>`); menu examples use `button={{label, variant, icon, isIconOnly}}` |
| `ContextMenu` `menuContent` | `menu` prop | direct map |
| heroicons (`PencilSquareIcon`, `TrashIcon`, `ShareIcon`, `DocumentDuplicateIcon`, `EllipsisHorizontalIcon`, `MapPinIcon`, `Arrow*Icon`, `ArrowUturnLeftIcon`, `FlagIcon`, `CalendarIcon`, `TagIcon`, `UserIcon`, `FolderIcon`) | `sandbox-*` glyph registrations | same MIT heroicon path data; ellipsis maps to built-in `xplat-more-horizontal` |

## Framework findings carried forward (unit-1 evidence)

- `F-1` Multi-DefinedTheme runtime — **resolved in unit 2** by the public
  `Theme`/`defineTheme`/`useTheme`/`generateThemeCss` API in
  `packages/ui/src/theme/`: web emits `light-dark()` scope rules keyed on
  `.xds-theme-<name>` + `color-scheme`; native emits class-split rules via
  `Application.addCss` (UNVERIFIED on actual hosts). Scope rules also carry
  the theme's body font + primary text color (upstream's `:scope`
  `font-family`/wrapper `color`), and the root scope mirrors onto `<html>`
  (`data-xds-theme` + `xds-theme-<name>` + mode classes + `color-scheme`)
  so theme tokens cover the document; `themeSchemeClasses()` restamps
  overlay hosts. Theme fonts load through the Google Fonts link in
  `index.html`, matching upstream's head.
- `F-2` `LinkProvider`/`useLinkComponent` link injection — **resolved in
  unit 3** by `LinkProvider`/`useLinkComponent`/`LinkContext` in
  `packages/ui` (`link-context.ts`, `LinkProvider.*`, `use-link-component.*`).
  Resolution order is upstream's: `as` prop → provider → `'a'`/platform
  default; the web leaf wraps resolutions in the safe-destination + `to`
  handoff contract. Consumed by `Link`, `SideNav` items/heading rows,
  `TopNav` items/mega-menu, `TabList`, `Breadcrumbs`, and `TreeList` leaf
  rows (`TreeListNode.href`). Caveats: native/macOS leafs keep the
  canonical-router `followHref` path (the provider default resolves to the
  `'a'` sentinel there; `Link`'s native leaf does render an injected
  component); injected components on native receive `href`/`onPress`.
- `F-8` Router search-param contract — the Xplat client router rejects any
  URL carrying query params on routes that don't declare `validateSearch`
  ("This route declares no search parameters" → blank outlet, no surfaced
  error). Upstream embed URLs (`?embed=1&theme=&mode=`) rely on query
  params everywhere, so every sandbox route now declares a passthrough
  validator (routes.ts). Recorded as a framework ergonomics note: an
  undeclared-query route fails closed and silently.
- `F-3` `Layout`/`LayoutHeader`/`LayoutContent`/`LayoutFooter`/`LayoutPanel`
  and `GridSpan` — **partially resolved**: `Layout`/`LayoutHeader`/
  `LayoutContent` are public `@octane-xplat/ui` components and every screen
  composes them (`PageLayout` deleted). `LayoutFooter`/`LayoutPanel`/
  `GridSpan` remain unported; dialog templates keep the `VStack`
  composition.
- `F-4` `LayerProvider` public provider + toast config — **resolved in
  unit 4** by `LayerProvider`/`LayerContext`/`useLayerContext`/
  `LayerToastConfig` in `packages/ui/src/layer-provider.tsrx`; the provider
  mounts a `ToastViewport` configured by `toast` and nested providers pass
  through. Also landed: `usePopover`, `useTooltip`, `useMediaQuery`,
  menu `presentation`/`label`, menu item `description`/`variant`, and
  `useImperativeDialog(defaults)` — see unit-4 mapping table.
- `F-5` Full `useTable*`/Table parts + column DSL surface — exercised by 21
  Table block templates, 6 page templates, audits, table-overview/lab.
  Owner: units 6–7.
- `F-6` Compositional parts: `SegmentedControlItem`, `SelectorOption`,
  `RadioListItem`/`CheckboxListItem`, `CollapsibleGroup`, `Step`,
  `FieldLabel`, `AvatarGroupOverflow`/`AvatarStatusDot`, CommandPalette
  parts. Owner: units 3–11 per family.
- `F-7` `ToggleButtonGroup` render defect — **resolved**. Root cause: the
  group rendered `<ToggleButtonGroupContext.Provider>`, but Octane's
  `createContext` returns a callable provider, not a React-style object —
  `.Provider` throws `OCTANE_CONTEXT_PROVIDER` in dev and is `undefined` in
  production (blank route, no error). Fixed by rendering the
  `ToggleButtonGroupProvider` alias (same pattern as
  `FieldProvider`/`DialogProvider`) across all three variants; covered by
  `packages/ui/src/ToggleButton.web.test.tsrx`. The fix also restores the
  toggle examples routes and aligns the group's web look with Astryx —
  separated ghost pills on a `--spacing-1` gap instead of the ButtonGroup
  segmented strip, `ghost` variant with the `--color-overlay-pressed`
  pressed fill, and the semibold pressed label with its width-reservation
  twin.

## Honest limitations (unit 1)

- Preview chrome is web-only (`PreviewShell.web.tsrx` — iframe embeds,
  postMessage, localStorage toolbar state); a native host needs a native
  leaf. `LinkProviderCustomLink` records interception as DOM text instead of
  upstream's `alert()` so the swap is observable in checks. The command
  palette catalog intentionally exceeds upstream (all 714 template routes +
  authored pages vs categories only).
- Explicit `MediaTheme` examples are mapped in unit 8 below. Syntax themes,
  color-studio/palette-generator/mobile-spacing and theme-family pages remain
  pending (later units). The palette preview's
  audit drawer + pending-override editor are recorded adaptations (upstream
  dev tooling); tonal snap markers omitted with them. SVG `<rect>` chart in
  useThemeHookUsage re-authored as token-painted divs (renderer has no SVG
  intrinsics). Native `Theme` scope is a real layout box (no display:contents).
- iOS/Android/macOS/Linux/Windows hosts not yet scaffolded; web only.
- `mobile-prototypes` relies on app-owned primitives upstream — port later
  must not claim it proves core components.
- `cli/xle`, `cli/authoring`, `@astryxdesign/lab` (`Stat`, `Drawer`),
  recharts/`@astryxdesign/charts`, `@heroicons/react`, `SpeechRecognition`
  are non-core integrations needing recorded adaptations per pinned
  inventory §6.

## Runtime evidence (unit 1)

Record format: `upstream/candidate revision · route/example · host/renderer ·
initial state · input mechanism · expected/observed result · evidence ·
verdict`. Candidate revision is the commit that last touched the checked
surface; evidence is the named check in `scripts/verify-web.mjs`, run under
Playwright 1.63.0 Chromium against `vite build` + `vite preview` (production
bundle, not dev/HMR). Input is real browser automation (Playwright
click/fill/goto through the Chromium input pipeline) — not DOM dispatch.
`grep FAIL` count: 0.

Baseline integrity: `scripts/generate-coverage.mjs --astryx <checkout>`
re-run 2026-10-26 against a fresh `facebook/astryx` clone with HEAD
`ebd939b665361a078015377c0dfe50cc3c1d70a4`; regeneration produced a
byte-identical `src/coverage/pinned.ts` (771 routes, bijection enforced by
the generator). Verdict: pass.

| Route / example | Host/renderer | Initial state | Input | Expected → observed | Evidence | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `/` home | web / Chromium | fresh context, default theme | `page.goto('/')` | heading "Astryx Sandbox", sidebar nav, populated card grid → all present | `home renders heading`, `home sidebar nav present`, `home card grid populated` | pass |
| `/components-patterns/` | web / Chromium | fresh context | `page.goto` | category heading + card grid → "Components & Patterns" h1, cards > 0 | `category /components-patterns/ renders` | pass |
| `/themes/` | web / Chromium | fresh context | `page.goto` | category heading + card grid → "Themes" h1, cards > 0 | `category /themes/ renders` | pass |
| `/tools/` | web / Chromium | fresh context | `page.goto` | category heading + card grid → "Tools" h1, cards > 0 | `category /tools/ renders` | pass |
| `/templates/` ledger | web / Chromium | fresh context | `page.goto('/templates/')` | "771 routes" summary + >100 pending status rows → present | `ledger summary counts`, `ledger shows pending rows` | pass |
| `/templates/{ButtonFloating, ButtonShowcase, ButtonSizeVariants, ButtonVariants, ButtonWithEndSlot, ButtonWithIcon, TextColors, TextHeadingLevels, TextInline, TextShowcase, TextTruncation, TextTypes, TextWeight, TextWordBreak, TextWrap}/` (15 routes) | web / Chromium | fresh context | `page.goto` per route | `.sb-preview-stage` non-empty, `.sb-pending` absent → all 15 render ported content | `unit-1 route <Name> renders ported content` ×15 | pass |
| `/templates/AppShellShowcase/` (pending) | web / Chromium | fresh context | `page.goto` | honest pending placeholder naming family → "pending" + "AppShell" text | `pending template shows placeholder` | pass |
| `/pages/example/` (pending) | web / Chromium | fresh context | `page.goto` | framed placeholder naming upstream source → "apps/sandbox/src/app" text | `pending page shows upstream source` | pass |
| `/pages/motion-lab/bugs/` (pending subtree) | web / Chromium | fresh context | `page.goto` | resolves as pending → "pending" text | `motion-lab subroute resolves` | pass |
| `/definitely-not-a-route/` | web / Chromium | fresh context | `page.goto` | upstream-style 404 surface → "404" text | `unknown route shows 404` | pass |
| `/` category filter | web / Chromium | home loaded | click "Themes" toggle, click "All" | filter narrows to ungrouped grid; "All" restores grouped sections → 9 cards filtered, sections restored | `category filter narrows grid`, `filtered grid is ungrouped`, `All restores sections` | pass |
| `/` search | web / Chromium | home loaded | `fill` "palette" | card grid filters → 7 cards | `home search filters` | pass |
| sidebar nav → `/themes/` | web / Chromium | home loaded | click sidebar "Themes" | client-side navigation, h1 "Themes" → url `/themes`, h1 correct | `themes category navigates`, `themes heading` | pass |
| mode toggle | web / Chromium | home loaded | click mode menu → "Dark" | `localStorage["astryx-sandbox-mode"]="dark"` → `stored=dark` | `dark mode persists` | pass |
| whole-run error sweep | web / Chromium | all journeys above | — | no pageerror/console errors → 0 | `no page errors` | pass |

Boundaries not claimed: Firefox/WebKit journeys, iOS/Android/macOS/Linux/
Windows hosts, OS-level input (touch/IME/assistive tech), pixel parity —
all later-unit or sign-off scope. `verify-web.mjs` also carries unit-2…5
checks (theme runtime, preview shell, overlays, forms) appended by those
units; this table records the unit-1 slice only. Full suite: 115/115 pass
at the recorded run.

## Unit 5 — forms, selection and date examples (34 families, 150 routes)

Ported block families: Field, FieldLabel, FieldStatus, FormLayout,
InputGroup, FileInput, TextInput, TextArea, NumberInput, CheckboxInput,
CheckboxList, CheckboxListItem, RadioList, RadioListItem, Switch, Slider,
Stepper, Step, ToggleButton, ToggleButtonGroup, SegmentedControl,
SegmentedControlItem, Selector, SelectorOption, MultiSelector,
ComplexSelector, Typeahead, TypeaheadItem, BaseTypeahead, PowerSearch,
Tokenizer, DateInput, DateRangeInput, DateTimeInput, TimeInput, Calendar —
plus the `tap-targets` and `textarea-counter` authored pages.

### Framework additions (packages/ui)

New public exports: `RadioListItem`, `CheckboxListItem`,
`SegmentedControlItem`, `SelectorOption`, `Step`, `FieldLabel`,
`FieldStatus` (component), `useGridFocus`. The item/step parts read
selection/position state from a parent-group context
(`option-list-contexts.ts`) — the Octane child-part pattern, since
children are opaque templates and cannot be inspected React-style.

New/extended contracts on existing components:

- `RadioOption`: `description`, `endContent` (exercised by
  RadioListPricingTier, CheckboxListWithEndContent).
- `RadioGroup`/`CheckboxGroup`/`SegmentedControl`: `children` alongside
  `options`; `CheckboxGroup.hasDividers`; `SegmentedControl.layout="fill"`.
- `Select`/`MultiSelector`: `presentation` (`popover`/`bottom-sheet`/
  `adaptive` — adaptive resolves per pointer via `useMediaQuery`),
  `variant="ghost"`, `renderOption`, `renderValue`, `SelectOption.icon`,
  multi `triggerDisplay="badges"`.
- `Stepper`: `activeStep`/`onStepClick`/`orientation`/`indicatorPosition`/
  `horizontalOptions` + `Step` children; the `steps` prop stays the flat
  alternative.
- `Slider`: reworked to the Astryx field contract — `FieldControlProps`,
  `value: number | [number, number]` (range = two thumbs), `min`/`max`/
  `step`/`marks`/`formatValue`/`valueDisplay`. `minValue`/`maxValue` are
  deprecated aliases; `onValueChange` now emits the widened type (breaking
  — callers updated: demos, video-chrome, input-readiness probe).
- `TextInput.startIcon`; `TextArea.startIcon`/`maxLength` (live counter);
  `InputNumber` `units`/`formatValue`/`hasNumberSteppers`/`hasClear`/
  `onClear`.
- `FieldStatus` the **type** is re-exported as `FieldStatusInfo` in the
  barrels (the name now belongs to the component, matching upstream);
  `packages/files` updated to the alias.

### Adaptations and recorded gaps

- `FileInput` ports use `@octane-xplat/files` `FileInput` (cross-platform
  picker bridge), not a ui stub — `File` values become `FileInputFile`.
- `Typeahead`/`BaseTypeahead`/`Tokenizer` upstream children-composition
  maps to `searchSource` + `renderItem`/default rows (the real upstream
  contract exercised through `createStaticSource`).
- `PowerSearch` upstream examples are filter-bar compositions; ported via
  `createPowerSearchConfig` field definitions rather than the text-input
  appearance they first suggested.
- `ComplexSelector` `children` is a render function receiving
  `{value, onChange, close, isOpen, isBusy}` — upstream's
  `ComplexSelectorSection` composition collapses into the render body;
  `useGridFocus` drives the 3×3 showcase grid keyboard navigation.
- `Text`/`Heading` carry the Astryx `type`/`size`/`color`/`weight`/`maxLines` props natively; the port uses them throughout and the `sb-type-*`/`sb-color-*` shims are removed.
- `Badge variant/label` → children-only Badge (upstream variants not yet
  in Xplat — recorded gap).
- `Banner status/title/description` → `icon` + children.
- `ToggleButton` `value`/`onChange` → `isPressed`/`onPressedChange` +
  `label` (required a11y name); `pressedIcon` covers the icon-swap cases;
  `color` added to `ToggleButtonProps` for the accent/status-color rows.
- `TextInput type="password|email"` → `secure`/`keyboardType`; `hourFormat`
  uses `'12h'|'24h'`; `format` uses `SharedDateFormat` names;
  `DateRangePreset` uses `label` + `getRange`.
- `StepperWidthResponsiveCollapse` accepts `horizontalOptions` but the
  web leaf does not yet implement the width-collapse measurement — the
  prop is accepted and recorded, layout stays off-track horizontal.
- macOS `.macos.tsrx` leaves for the group controls remain options-prop
  only — child parts render standalone there (context absent), a recorded
  platform gap alongside existing macOS coverage notes.
- Native Slider keeps the single-thumb widget path; range/marks/
  formatted readouts render on web only (recorded in `SliderProps` doc).
- `useGridFocus` is pointer/keyboard-only on web; native export is a
  no-op with the same signature.

### Pages

- `tap-targets`: upstream's live DOM measurement (ResizeObserver/rAF +
  StyleX) is adapted to a static audit table with real rendered controls —
  the measurement harness is toolchain code, not a component contract.
- `textarea-counter`: `TextArea.maxLength` live counter + `FieldStatus`
  row, replacing upstream's hand-rolled counter markup.


## Unit 8 — media and responsive examples

This unit owns 19 block routes and `/pages/media-mode/` (20 routes total).
Their status comes from the live registries, not the earlier inventory table.
The exact candidate is the commit containing this section; the landed SHA is
reported at handoff. Oracle revision:
`ebd939b665361a078015377c0dfe50cc3c1d70a4`; candidate base: `4dd7234b7`.

### API mappings and findings

| Upstream examples | Expected contract | Public equivalent or gap | Hosts and evidence |
| --- | --- | --- | --- |
| Three `MediaTheme*` blocks; `media-mode` swatches | Explicit dark/light surface ink with inherited theme identity | Nested public `Theme` with the current registered theme and explicit `mode`; no app-local theme provider | Web/DOM: six themes × two ambient modes, live theme/mode change. This does not implement `MediaTheme auto`, media-specific component overrides, or prove native rendering. |
| `ThumbnailRemovable`, `ThumbnailGallery`, `media-mode` | Regional image luminance and loading/error fallback | Public `useImageMode`; APCA average sampling, cancellation, bitmap cleanup, fallback; shared Thumbnail consumes it for remove contrast | Web: unit and Chromium checks. Native pixel sampling remains unavailable and returns fallback. No native detection claim. |
| `useContainerRevealHookUsage` | Scoped hover/focus reveal; mounted, tabbable actions; touch always visible | Public `useContainerReveal` default getters + `isEnabled`; public stacks compose the upstream Item row; registered pencil-square/trash icons replace Heroicon components | Web browser mouse/keyboard and coarse-pointer checks. Native defaults keep actions visible; native desktop hover/focus reveal is unavailable. Delay/inversion/force-state options are outside this exercised subset. |
| `AspectRatio*` | Ratio reservation and fitted media across resize | Public AspectRatio + Image; numeric Grid columns become track strings and CSS gaps | Chromium found missing shared web fill-layer styles; fixed in shared `tokens.css`. Silo observation `7300c40c-0e76-472f-afa6-61e24a523235`. |
| `ThumbnailGallery`, `ThumbnailDisabled`, `ThumbnailStates` | Independent preview/remove, disabled controls, placeholder/skeleton/upload/loaded states | Public Thumbnail; shared web fix replaces invalid nested button markup, resets errors on source change, and samples remove contrast | Focused regression test + Chromium pointer/keyboard/state checks; Silo `9dc53782-f90d-4f07-86e4-0dd3d5abb902`. Native implementations unchanged. |
| Four `Lightbox*` blocks | Open/close, gallery navigation, zoom/pan and video | Public Lightbox/useLightbox; single upstream media objects become one-item arrays; shared click-to-zoom replaces the upstream double-click instruction | Chromium input and DOM state; video metadata/controls and keyboard play/pause checked; audio output remains unqualified. Post-drag clicks no longer discard the pan, and gallery navigation retains the original focus lease; Silo `35c51c5d-b9d3-4398-9407-19ede7670e9d` and `854a2bb6-963e-458c-8d31-1edf7007d2ba`. No audio-output or native player claim. |
| Adaptive dialog (already owned by unit 4) | Query updates after resize on a coarse pointer | Existing public `useMediaQuery`, exercised through its existing sandbox consumer | Chromium compact sheet → wide dialog. No new unit-8 route claimed for this check. |
| `/pages/media-mode/` | Three selectable algorithms, 16 solid swatches and 8 regional image samples | Upstream app-owned comparison hook re-authored in Octane; APCA overlay uses public useImageMode. Canvas/fetch work stays in a web leaf; source view maps the actual page | Browser-only lab. Remote Picsum URLs retained; deterministic verification substitutes their HTTP response bytes. CORS/network failures retain the upstream `detecting…` fallback. |

Assets are copied unchanged from the pinned docsite with its MIT license.
MediaTheme info uses the registered `sandbox-info` glyph; lab remove controls
use `xplat-close`. The fixed light/dark Theme composition does not close the
separate generated-theme-family page: `/pages/theme-family/` remains owned by
its theme/authored-screen work. `ItemDocumentTabs` and composed page consumers
remain owned by their family/page units.

### Runtime evidence

Each row below uses the pinned oracle and the candidate commit identified
above. Host is Chromium/DOM; initial state is a fresh route navigation; input
is browser navigation; expected/observed result is rendered ported content
with no pending placeholder. Evidence is `scripts/verify-media.mjs`, invoked
by `scripts/verify-web.mjs --media-only`. Final result: **84/84 checks passed**, against the production build in Chromium.
`turbo run typecheck --filter=...@octane-xplat/ui` passed (58 tasks); the focused
UI suite passed 34 tests. Recipe/link checks passed. Diff-scoped lint is clean;
shared-file lint retains an unchanged curly-brace violation in source-registry
and two unchanged verify-web warnings. `check:css` retains 28 pre-existing
unsupported declarations; the new CSS rules are explicitly web-only.

| Route/example | Evidence assertion | Result |
| --- | --- | --- |
| `/templates/AspectRatioCircleImage/` | `unit-8 route AspectRatioCircleImage renders` | pass |
| `/templates/AspectRatioImageGallery/` | `unit-8 route AspectRatioImageGallery renders` | pass |
| `/templates/AspectRatioShowcase/` | `unit-8 route AspectRatioShowcase renders` | pass |
| `/templates/AspectRatioSquareImage/` | `unit-8 route AspectRatioSquareImage renders` | pass |
| `/templates/AspectRatioWidescreen/` | `unit-8 route AspectRatioWidescreen renders` | pass |
| `/templates/AspectRatioWithSkeleton/` | `unit-8 route AspectRatioWithSkeleton renders` | pass |
| `/templates/MediaThemeImageOverlay/` | `unit-8 route MediaThemeImageOverlay renders` | pass |
| `/templates/MediaThemeLightScrim/` | `unit-8 route MediaThemeLightScrim renders` | pass |
| `/templates/MediaThemeShowcase/` | `unit-8 route MediaThemeShowcase renders` | pass |
| `/templates/ThumbnailDisabled/` | `unit-8 route ThumbnailDisabled renders` | pass |
| `/templates/ThumbnailGallery/` | `unit-8 route ThumbnailGallery renders` | pass |
| `/templates/ThumbnailRemovable/` | `unit-8 route ThumbnailRemovable renders` | pass |
| `/templates/ThumbnailShowcase/` | `unit-8 route ThumbnailShowcase renders` | pass |
| `/templates/ThumbnailStates/` | `unit-8 route ThumbnailStates renders` | pass |
| `/templates/LightboxGallery/` | `unit-8 route LightboxGallery renders` | pass |
| `/templates/LightboxShowcase/` | `unit-8 route LightboxShowcase renders` | pass |
| `/templates/LightboxVideo/` | `unit-8 route LightboxVideo renders` | pass |
| `/templates/LightboxZoom/` | `unit-8 route LightboxZoom renders` | pass |
| `/templates/useContainerRevealHookUsage/` | `unit-8 route useContainerRevealHookUsage renders` | pass |
| `/pages/media-mode/` | `unit-8 media-mode page renders` — 24 swatches | pass |

Behavior rows use the same oracle/candidate and host, with state/input made
explicit. Compilation and handler tests are separate from browser input.

| Route/example | Initial state · input mechanism | Expected/observed result · evidence | Result |
| --- | --- | --- | --- |
| AspectRatioWidescreen | Desktop · browser viewport resize to 390×844 | Reserved 16:9 box before/after; `aspect-ratio survives viewport resize` | pass |
| ThumbnailStates/Disabled | Fresh route · navigation | Placeholder, skeleton, upload overlay, loaded image; two disabled remove buttons | pass |
| ThumbnailGallery/Removable | Four items · browser click | Selection, independent removal, both luminance modes, all-removed state | pass |
| LightboxZoom thumbnail | Valid route · HTTP response with invalid image bytes | Actual browser decode failure displays placeholder, without synthetic error dispatch | pass |
| useContainerRevealHookUsage | Hidden desktop actions · mouse hover then Tab | Actions reveal for both input mechanisms; remain mounted/tabbable | pass |
| useContainerRevealHookUsage | Coarse-pointer browser context · navigation | Actions always visible | pass |
| MediaThemeImageOverlay/LightScrim | Six themes × two root modes · embed URL navigation | Correct theme identity and explicit dark/light scope in all 24 cases | pass |
| MediaThemeShowcase | Root theme/mode · browser menu selection and button click | Media subtree updates theme identity and keeps its explicit dark context | pass |
| LightboxShowcase/Video/Zoom/Gallery | Closed · browser click and Escape | Opens/dismisses, returns focus to opener and unlocks page scrolling | pass |
| LightboxGallery | First image · ArrowRight and Next click | Gallery advances to 2/4 then 3/4 | pass |
| LightboxZoom | Unzoomed · browser image click twice | Shared zoom applies, pointer drag pans and stays zoomed, then a separate click resets | pass |
| LightboxVideo | Open video · browser media load | Positive duration, metadata, controls and browser-keyboard play/pause; audio output not qualified | pass |
| media-mode | APCA · algorithm-button clicks; deterministic image HTTP responses | Gamma/WCAG explanations switch and APCA regional loads settle | pass |
| DialogAdaptivePresentation | Coarse pointer at 390px · open/cancel, resize to 1300px, reopen | Sheet becomes dialog via shared useMediaQuery subscription | pass |
| Public image hook | Deferred loads · mocked fetch/bitmap/canvas in jsdom | Loading/failure fallback, source/options reset, cancelled stale result discarded, bitmap closes | pass — unit test; not browser/OS input |
| Shared thumbnail | Mounted interactive item · dispatched click/keydown in jsdom | Remove and preview remain independent | pass — handler test; not browser/OS input |
| All unit-8 routes | Firefox/WebKit, iOS/Android, AppKit/WebView, Linux/Windows | No host journeys run | not-run |

No screenshots, image inspection, visual analysis, pixel-parity claim, actual
assistive-technology delivery, OS touch/keyboard, or native-host claim.
The shared-overlays recipe's AC5 names the media APIs and remains current;
this unit adds media runtime evidence, not a complete modal/host qualification.
Other recipes do not prescribe these new hooks or change workflow.
## API mappings and substitutions (unit 6 — flat-table contracts)

The monolithic `Table` (columns/rows/label/width:number/onRowPress) was
replaced at source by the Astryx contract — `data` + `columns` + plugin
pipeline in `@octane-xplat/ui` (breaking; old API removed, callers updated:
ComponentsDemo, parity fixture, table-props test).

| Upstream API | Xplat equivalent | Disposition |
| --- | --- | --- |
| `Table`/`BaseTable` data mode + `plugins` record | `Table` (`data`, `columns`, `idKey`, `plugins`, `density`, `dividers`, `isStriped`, `hasHover`, `verticalAlign`, `textOverflow`, `emptyState`, `rowIndexStart`/`rowCount` aria) | **ported** — web leaf renders semantic `<table>/<thead>/<tbody>/<tr>/<th>/<td>` running the full transform pipeline; universal/AppKit leaves map the same render plan to flex rows (DOM-only effects degrade to data effects) |
| `TableHeader`/`TableBody`/`TableFooter`/`TableRow`/`TableCell`/`TableHeaderCell` + `TableContext` | same names in `@octane-xplat/ui` | **ported** — children-mode composition reads density/dividers/striping from `TableContext`; `contextMenuActions` render through `ContextMenu` on web |
| `TablePlugin` transforms (`transformColumns`/`transformTable`/`transformHeaderCell`/`transformHeaderRow`/`transformBodyCell`/`transformBodyRow`/`transformScrollWrapper`/`transformTableContext`) | same interface; `xstyle` → `classes: ClassValue[]`, DOM prop bag stays `htmlProps` | **ported** — sequential pipeline + canonical plugin ordering (`columnSettings → sort → tree → selection → pagination`); a throwing plugin is skipped rather than blanking the table |
| `proportional`/`pixel`/`generateColumns`/`resolveColumnWidths`/`DEFAULT_MIN_COLUMN_WIDTH` | same names in `@octane-xplat/ui` (`pixel` shared with the resizable-size DSL — identical `{type:'pixel',value}` shape) | **ported** — proportional shares resolve to % widths + min-width floors; `tableMinWidth` aggregate on the table element |
| `useTableSelection` + `useTableSelectionState` (actionable vs frozen keys, select-all, disabled/non-selectable rows) | same names | **ported** — injected `__xds_selection` checkbox column, `aria-selected` + `vx-table-row--selected` row marking; deselect-all preserves disabled-but-selected (frozen) keys |
| `TableSelectionToolbar` | same name | **ported** — selection-aware toolbar via `Toolbar`; hides until `hasSelection`; `Unselect All` resets the full set |
| `useTableSortable` + `useTableSortableState` (asc/desc/unsorted, multi-sort, comparators, `aria-sort`, sort context-menu actions) | same names | **ported** — header `<button>` sort control (web) / tappable header (native); context-menu actions on header cells; stable sorted-data derivation with `Intl.Collator {numeric:true}` fallback; `allowUnsortedState`/`isMultiSortEnabled` honored |
| `useTablePagination` + `paginateData` | same names | **ported** — Pagination chrome above/below/both via `transformTableContext`; `totalItems`/`totalPages`+`pageSize` → `pageCount`. Upstream `hasMore`/`pageSizeOptions`/`onPageSizeChange`/`variant`/`size`/`label` options are accepted but have no xplat `Pagination` equivalent — **recorded gap** |
| `useTableColumnSettings` + `useTableColumnSettingsState` (visibility, always-visible, show-all, reset, active order) | same names | **ported** — pure filter+reorder `transformColumns`; sandbox exercises it through `MultiSelector` |
| `useTableColumnResize` (drag + keyboard separator, min/max, proportional neighbors, `columnWidths` overrides, `onColumnResizeEnd`) | same name | **ported on web** — `role="separator"` handles with pointer drag + Arrow/Home/End keyboard resize and controlled `columnWidths`; **recorded gap** — native leaves apply width overrides only, no separator (pointer capture + DOM measurement are web-specific); upstream's proportional-neighbor compensation deferred |
| `useTableFiltering` + `useTableFilterState` + `toSearchFilters` (popover + inline/inline-compact variants; string/number/enum/enum_list/date/time/string_list/entity_list controls from operator value type) | same names | **ported** — funnel `IconButton` opens a Popover with a draft FilterControl (Reset/Apply); inline renders the control in the header `below` slot; `toSearchFilters` resolves field/operator from the column's `filter` ref + shared `PowerSearchConfig` for `applyFilters`. Upstream's nested/custom/date-relative/date-range/empty operator types produce no control, matching upstream |
| `Badge variant` (rich-cell + grade cells) | — | `.sb-badge--*` classes — adaptation (unresolved upstream Badge variants) |
| `Text hasTabularNumbers`/`justify`/`display` | — | `.sb-tabular`/`.sb-text-end` classes — adaptation |
| Pagination component `totalItems`/`pageSize`/`variant="count"`/`size` | `Pagination` `page`/`pageCount`/`onPageChange` | **adapted** — `PaginationWithTable` computes `pageCount`; upstream Pagination variants belong to that family's owner |
| `@astryxdesign/lab` `Drawer`/`Stat` + generated `componentScores` ledger | — | **adapted** — `/pages/component-scores/` embeds a representative static roster (upstream generates roster+snapshot at build from component registry + remote wiki); `Stat` → Card+Text; `Drawer` → `Dialog`; `MoreMenu` → `DropdownMenu` |
| `table-page` HoverCard anchored to `<tr>` via `closest('tr')` + `useHoverCard` | — | **adapted** — DOM row-anchoring is a web escape hatch; the ported `DescriptionCell` renders the description text (hover-card detail deferred) |
| `table-page` `useFlushEdges` consumer plugin | consumer-authored `TablePlugin` | **ported** verbatim — same `transformHeaderCell`/`transformBodyCell` htmlProps.style shape |
| `TableFloatingBulkActionsTable` StyleX sticky-toolbar styles | sandbox CSS (`.sb-bulk-*`) | **adapted** — same sticky/elevated toolbar effect |

### Runtime evidence (unit 6 — web/Chromium, `vite build` + `vite preview`)

`node scripts/verify-web.mjs` covers all 20 unit-6 routes with rendered-content
checks plus behavior journeys: sort asc→desc via header button, select-all →
toolbar count → unselect-all, page swap, column-settings hide, keyboard
column resize, popover filter apply, inline enum filter, invoice
search→filtered-view banner→clear→empty state, and component-scores
filtering. See the script's per-check PASS/FAIL output; Chromium/Playwright,
no pixel claims.
