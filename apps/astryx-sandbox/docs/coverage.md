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
| authored pages (`/pages/*`) | 51 | `(sandbox\|fullscreen\|raw)/pages/**/page.tsx` | 29 ported, 2 blocked, 20 pending |
| block templates | 659 | `cli/assets/templates/blocks/components/<Family>/<Name>.tsx` | 639 ported (including the 75 unit-10 rows below), 20 pending |
| page templates | 55 | `cli/assets/templates/pages/<slug>/page.tsx` | 6 ported, 49 pending |

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
| `Layout`, `LayoutHeader`, `LayoutContent` | `Layout`/`LayoutHeader`/`LayoutContent` in `@octane-xplat/ui` (new public API) | **ported** — every screen composes the real regions (`hasDivider`, `padding={6}`); `PageLayout.tsrx` deleted. `LayoutFooter`/`LayoutPanel`/`GridSpan` ported in unit 11 |
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
- `Badge` gained `variant`/`label`/`size`/`dot` in unit 11 — the unit-5
  children-only adaptation now renders real Badge variants.
- `Banner` gained `status`/`title`/`description`/`endContent`/`isDismissable`/
  `variant`/`elevation`/`container`/`collapsible` in unit 11.
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


## Authored-screen evidence: unit 13, first delivery

This delivery adds **16 authored routes**. It does not complete unit 13.
The two sanctioned private-toolchain blockers remain in the live ledger;
other authored routes remain pending until delivered. Concurrent units may
add pages, so the registries remain authoritative for totals.

Upstream for every row: `ebd939b665361a078015377c0dfe50cc3c1d70a4`.
Candidate source: `8484dfab7`. Host: **web / Chromium**, production Vite
bundle. Input: Playwright browser pointer, keyboard and text entry; results
are checked through DOM/text state. Evidence: maintained
[`verify-authored.mjs`](../scripts/verify-authored.mjs), **34/34 checks pass**.
Route loads in this table include a no-placeholder assertion. The source
commit was checked with package typecheck, production build and scoped lint.

| Route | Initial state | Input | Expected / observed | Result |
| --- | --- | --- | --- | --- |
| `/pages/example/` | Empty name/email; both checkboxes off | Type name/email; enable notifications | Name retained; notifications checked; updates unchecked | pass |
| `/pages/navigation/` | Start slot selected | Click Center then Right | Live navigation moves between matching named slots | pass |
| `/pages/showcase-header/` | Pinned static hero | Route load | Astryx hero and Available now render | pass |
| `/pages/showcase-components/` | Light mode/animations on; compact off | Click Compact | Compact on; animations remain on | pass |
| `/pages/doc-home/` | Eight catalog cards | Type unmatched search; clear | No cards; clearing restores gallery | pass |
| `/pages/doc-discover/` | All categories | Choose Tools; type unmatched query; type theme | Empty state then Theme Editor; DataTable excluded | pass |
| `/pages/doc-docs/` | Button document and code shown | Toggle code twice | Document remains mounted and use guidance renders | pass |
| `/pages/documentation/` | Overview selected | Activate Button navigation button; return to Overview | Anatomy table and use guidance; overview restored | pass |
| `/pages/topnav-menu/` | Menus closed | Hover Products; Escape | Menu opens and dismisses | pass |
| `/pages/mega-menu/` | Menus closed | Hover Products; Escape | Mega-menu opens and dismisses | pass |
| `/pages/color-studio/` | Pinned default ramps | Add/remove color; choose Cool; Export | Ramp count updates; shared clipboard confirms copied | pass |
| `/pages/palette-generator/` | Generator and OKLCH selected | Choose Compare | Both algorithm results and comparison appear | pass |
| `/pages/polymorphic-link/` | Provider and override examples | Click Products in each navigation | Both intercept navigation; provider and override log distinct handlers | pass |
| `/pages/codeblock-perf/` | Both strategies; 1000 lines | Choose Spans Only | One CodeBlock remains; spans panel renders | pass |
| `/pages/dictation-lab/` | Mic idle; Drip attack | Choose Kalimba | Selection changes without requesting microphone access | pass |
| `/pages/example-cards/` | Pinned collage defaults | Edit email then notes | Email remains edited after independent note change | pass |

These checks cover the named states, not every possible control combination.
The CodeBlock benchmark retains its browser timing/scroll instruments; no
performance threshold or cross-engine speed claim is made. Dictation keeps
the public chat supported/unsupported state, composer and app-owned sound
mixer. Speech, microphone delivery and audio output were **not run**. Clipboard
feedback was exercised in an isolated Chromium context with clipboard
permission; system clipboard and assistive-technology delivery are not claimed.
Firefox, WebKit, native hosts and visual parity are **not run** for this unit.
No screenshots were captured or inspected.

### Authored mappings and adaptations

- Scaffold, menus, collage and docs use public Octane components. The
  breadcrumbs example uses the public `items` form while still exercising
  `LinkProvider` and the per-item/component link override. Ref props replace
  React `forwardRef`. Static StyleX rules become CSS; dynamic values stay in
  style objects. Browser-specific lab code lives in `.web` files.
- The docs-demo header uses the canonical router for active selection and
  public link injection. Source views load the Octane files actually running,
  including `.web.tsrx` filenames.
- Color calculations, palette-generation algorithms and the reference corpus
  are upstream app-owned code, retained under the original MIT attribution.
  Stored theme ramps reuse the already ported palette data. Exports call
  public `useClipboard`, including transient copied state and timer cleanup.
- Collage bar/sparkline marks and dictation sound envelopes remain app-owned
  demonstrations. They do not qualify a chart or audio framework component.
  Icons use public registered icons where names are mapped; the docs/menu
  illustrations retain their app-owned browser SVG markup. Badge labels use
  the public Badge content form; semantic variant styling is a remaining
  presentation difference and no pixel-parity claim is made.

### Recorded toolchain blockers and remaining dependencies

| Finding / routes | Expected contract | Source evidence / current boundary | Ledger / runtime |
| --- | --- | --- | --- |
| U13-1: `/pages/layout-dsl/` | Validate compact/outline expressions, expand Octane source, report token counts and copy output | Pinned `layout-dsl/page.tsx` imports `@astryxdesign/cli/xle`, generated `xle-registry.json` and a generated tokenizer bundle. Generated artifacts are absent at the pin; supervisor explicitly authorized recording this blocker and did not authorize a replacement compiler. | blocked; Chromium confirms visible reason |
| U13-2: `/pages/doc-preview/` | Load foundational authoring docs and render their topic/token examples | Pinned page loads generated `foundationDocs.json` and private `DocPreview` authoring rendering. Generated JSON is absent at the pin; supervisor explicitly authorized this blocker. | blocked; Chromium confirms visible reason |
| U13-3: `/pages/theme-family/` | Inherited component overrides, typography, responsive adaptations, media overrides and nested family identity | Pinned `src/themes/theme-family/ocean.ts` uses `components`, `typography`, `adaptations` and `onDark`; current `DefineThemeInput` only accepts name, extends, tokens and localTokens. Token flattening alone does not satisfy the page. Local feedback `2fe792d6-5693-4081-882b-eb82c734a5f8`. | blocked; source evidence only |
| U13-4: `/pages/markdown-perf/` | Compare baseline versus public soft-break plugin at selectable claim densities | Pinned `benchmarkProfiles.ts` imports `markdownSoftBreaksPlugin` and `MarkdownPluginEntry`; the current public Markdown entrypoint exposes parsing/streaming/outline/syntax but no equivalent plugin registry. | blocked; source evidence only; shared prerequisite for unit 10 |
| U13-5: Motion Lab before/after rigs | Preserve proposed TabList behavior and its input/overflow contracts | Pinned `motion-lab/LabDemos.tsx` imports its proposed TabList fork; that fork imports private `packages/core/src/hooks/isRtlElement.ts` and `DropdownMenu/menuItemRoles.ts`. A public mapping or explicit private-integration disposition remains required. | pending; no Motion Lab route qualified by this delivery |
| Shared dependencies: `/pages/table-overview/`, `/pages/table-lab/` | Table page contracts owned by unit 7 | Rows are preserved for that owner. This unit adds no app-local table engine. | pending in this worktree |
| Shared layout consumers: `/pages/mobile-type/`, `/pages/motion-examples/` | Exercised `LayoutPanel` / `LayoutFooter` regions | F-3: LayoutPanel is absent from public UI exports and blocks mobile-type; motion-examples also needs LayoutFooter. No local substitute is authorized. | blocked; source evidence only |
| Remaining raw screen: `/pages/mobile-prototypes/` | Preserve the app-owned primitive demonstrations and raw navigation behavior | Unfinished work is preserved outside the app source tree. It is not registered or runtime-qualified and does not qualify core counterparts. | unimplemented / not-run |

All **15 Motion Lab routes** are blocked by F-3 in this delivery: the index,
`bugs`, `exit-gap`, `export`, `js-mirror`, `library`, `plan`, `preview-plan`,
`previews`, `published`, `reduced-motion`, `rubric`, `springs`, `tokens`, and
`violations`. U13-5 applies to the consumed fork, not a claim that every one
of these pages independently requires it. The shared `MotionLabShell.tsx` consumes `LayoutPanel`, absent from public UI exports; this blocks all 15 routes, including static/data screens. No private re-export or app-local replacement is authorized. The committed pinned `__generated__/motionAudit.ts` identifies its
audit as **core 0.5.2**; preserve that provenance rather than presenting its
numbers as measurements of core 0.6.4 or Octane.

At the initial worktree baseline, `component-scores` and `media-mode` were
also pending. Units 6 and 8 have since added them on main; integration must
retain those registrations and their owners' evidence.

No app-building recipe or public framework workflow changes in this slice;
recipe coverage is unaffected. The Octane skill was reviewed for the public
APIs consumed here; no public API was changed.


### Unit 13 integration and second delivery

The integrated slice adds **18 authored routes** in total: the 16 above plus
`mobile-spacing` and `shell-lab`. Candidate `652d576f2` includes the first
slice rebased onto current main (`c38dcd7cf`) and adapts the documentation
consumer to the public data-driven Table API. Main's `media-mode` and
`component-scores` registrations and evidence are preserved.

Upstream: `ebd939b665361a078015377c0dfe50cc3c1d70a4`. Host: web / Chromium,
production bundle. Initial state and browser input are recorded below;
DOM/text assertions are the observed evidence. The maintained
`verify:authored` suite passes **38/38 checks**, including the previous 16
routes and the two sanctioned blocker notices. Package typecheck,
production build, scoped lint and whitespace checks pass. These results
qualify only the named interactions; whole-app and other-host sign-off
remain unit 14 work.

| Route | Initial state | Input mechanism | Expected / observed | Evidence / result |
| --- | --- | --- | --- | --- |
| `/pages/mobile-spacing/` | Desktop preview, quantity 1, component view | Browser pointer: Mobile, Increase quantity, Delivery & Returns, View → Token values | Mobile proposal control appears; quantity becomes 2; disclosure opens; semantic spacing contract renders | `verify-authored.mjs` / pass |
| `/pages/shell-lab/` | Default raw shell, banner off, configuration shown | Browser keyboard: focus Banner and Space; reload; pointer: Hide Config then Config | Announcement renders; query persists banner setting across reload; configuration hides and returns | `verify-authored.mjs` / pass |

Mobile spacing composes public Accordion items for grouped disclosures and
uses public registered SVG icons. Shell Lab composes public AppShell,
SideNav, TopNav and Banner; its browser URL configuration stays in the web
leaf. Number inputs in spacing and both color tools compose public Field
for their accessible label context. The direct NumberInput label-forwarding
gap is recorded as local feedback
`1dcc4f10-ee5a-41a0-a96c-34773efae66f`; no framework fix is claimed.

At this candidate, 27 of 51 authored pages are registered, including nine
owned by earlier units. The remaining 24 comprise the two live private
artifact blockers, 19 further shared-contract blocked routes below, two
table pages reserved for unit 7, and one unimplemented raw prototype page.
The live ledger still calls the latter 22 pending; this report records their
specific disposition without claiming runtime success.

- **Blocked:** all 15 Motion Lab routes and `mobile-type`: F-3 LayoutPanel
  is absent from public UI exports. The shared MotionLabShell consumes it,
  so even static Motion Lab screens are blocked. `motion-examples` also
  needs LayoutFooter. No stub, private re-export or local substitute was added.
- **Blocked:** `theme-family` needs the generative overrides/media contract;
  `markdown-perf` needs public plugin hooks.
- **Sanctioned blocked:** `layout-dsl` and `doc-preview` retain U13-1/U13-2
  evidence and visible notices; no replacement compiler was added.
- **Reserved:** `table-overview` and `table-lab` remain owned by unit 7.
- **Unimplemented:** `mobile-prototypes` remains listed and not passing.

Firefox, WebKit, native hosts, OS speech/audio/clipboard delivery and visual
parity remain unverified. No screenshots or image inspection were used.
## API mappings and substitutions (unit 11 — remaining component families)

Covers the 79 unclaimed families after units 1–10: layout/composition,
feedback/display, lists/timing, navigation, avatars, and standalone hooks —
~284 example routes registered in `src/examples/`.

### Framework additions (packages/ui)

New public exports: `LayoutFooter`, `LayoutPanel` (+ `LayoutAreaProvider`/
`LayoutAreaContext` slot areas), `GridSpan`, `AvatarStatusDot`,
`AvatarGroupOverflow`, `CollapsibleGroup` (+ `CollapsibleGroupProvider`),
`BreadcrumbItem` (part), `Banner` statuses, `Separator` (exported as
`Divider`), `Empty` (exported as `EmptyState`), `ActivityIndicator`
(exported as `Spinner`), `Skeleton`, `Kbd`, `Badge` variants, `GridSpan`
placement props on `Grid` children.

New/extended contracts on existing components:

- `AvatarProps`: `name`/`src`/`status` (node or `AvatarStatusDotVariant`),
  named+numeric `size`, `radius`, `alt`.
- `AvatarGroupProps`: `max` overflow collapse with `+N` marker or an
  explicit `AvatarGroupOverflow` part child.
- `BannerProps`: `status`, `title`, `description`, `icon`,
  `endContent`, `isDismissable`, `variant`, `elevation`, `container`,
  `collapsible` (+ `BannerStatus`).
- `Breadcrumbs`: `BreadcrumbItem` part children compose alongside the
  existing `items` data API; composed crumbs take separators from a
  `--vx-bc-sep` CSS variable stamped by the nav.
- `GridProps.columns` widened: `GridTrackList | number |
  GridResponsiveColumns` (upstream `columns={3}` and
  `{{minWidth, max, repeat}}` auto-fill/fit forms).
- `ActivityIndicator`/`Spinner`: named `size`, `shade`, `label`,
  `accessibilityLabel`.
- `Badge`: `variant`/`label`/`size`/`dot`.
- `Separator`/`Divider`: `label`, `orientation`, `tone`.
- `Empty`/`EmptyState`: `icon`, `title`, `description`, `actions`.
- `Skeleton`: `radius`/`shape`/`lines`/`width`/`height`.
- `Kbd`: `keys` chord notation → cap-per-segment rendering.
- `Layout`: area-slot context so `LayoutHeader`/`LayoutFooter`/
  `LayoutPanel` self-place; `LayoutPanel` accepts `resizable` from
  `useResizable`.
- `Icon`: named `size`/`color` props (xsm–xl scale, semantic palette).

### Adaptations and recorded gaps

- `CommandPalette` compound parts (`CommandPaletteInput`/`List`/`Item`/
  `Group`/`Empty`/`Footer`) map to the public data-driven API:
  `searchSource`/`items`, `placeholder` (input part), `footer`,
  `emptySearchText`/`emptyBootstrapText`, item `group`/`shortcut`
  fields (upstream `auxiliaryData` flattens), `renderItem` for rich
  rows, `value`/`onValueChange` for picker mode. Upstream `isOpen`/
  `isInline` → `open`.
- `useKeyboardHint` has no public equivalent — the ephemeral
  "arrows to navigate" Toolbar hint is absent; the example documents it
  instead of faking the behavior.
- `TreeListNode` lacks upstream's `startContent`/`endContent`/`icon`/
  `isSelected`/`isExpanded` per-node fields — ports use `key`/`label`/
  `children`/`href`, `defaultExpandedKeys`, `defaultSelectedKeys`, and
  `onAction`; badge counts fold into label text.
- `ToolbarBulkActions` re-authored without unit-6 `useTableSelectionState`/
  `Table` (other unit's contract) — same selection surface over a plain
  row list.
- `Grid gap` was deliberately removed from the public API upstream
  — examples use `style={{gap}}`; recorded, not re-introduced.
- `Avatar` `src`/`img` upstream photo assets are absent from the pinned
  checkout — ports use `name` initials/`icon` fallbacks.
- `toChildArray`/`Children.toArray` cannot introspect TSRX children
  blocks — components that introspect `props.children` (Breadcrumb,
  MetadataList, AvatarGroup) now pass block children through directly and
  only slice/map when children arrive as an array. **Framework finding:**
  child-composition collapse (e.g. `MetadataList maxNumOfItems`,
  `AvatarGroup max`) degrades to always-expanded for static JSX children.
- `HoverCard`/`useHoverCard`, `Toolbar`, `SideNav*`/`TopNav*`/`MobileNav`/
  `AppShell`/`Tab`/`TabList`/`TabMenu`/`NavIcon`/`NavHeadingMenu` parts
  ported 1:1 through existing public contracts.
- `MobileNavToggle` examples drive `AppShellMobileContext` directly
  (the context value shape upstream's demos document).
- `ScrollableArea` sticky-header/passthrough demos use CSS `position:
  sticky` inside the scroll viewport (upstream's sticky-containment
  demo relies on web semantics — web leaf preserved).
## Unit 7 — hierarchical and rich tables

The Table family now has all 21 block routes registered. The seven added
public hooks are `useTableStickyColumns`, `useTableGroupedRows`,
`useTableRowIndex`, `useTableRowStatus`, `useTableRowExpansion`,
`useTableTreeData` and `useTableTreeState`. They compose with the unit-6
pipeline rather than an app-local table implementation.

```tsx
function ExampleTable() {
  const state = useTableTreeState({ data, idKey: 'id' })
  const tree = useTableTreeData({ ...state.treeConfig, hasExpandAllControl: true })
  return <Table data={state.visibleData} columns={columns} idKey="id" plugins={{ tree }} />
}
```

| Route | Implemented behavior | Adaptation / remaining coverage |
| --- | --- | --- |
| `StickyColumnsHookUsage` | Contiguous start/end pinning, scroll-aware shadows | Web only. NativeScript/AppKit hooks pass through; their Table leaves have no horizontal scroll wrapper. Multiple pinned proportional columns use minimum-width offsets. |
| `TableGroupedRowsTable` | Ordered groups, labelled headers, collapse/expand, suppressed synthetic-row cell renderers | Web chevron and row-click checks; native tap wiring is source-only. |
| `TableRowExpansionTable` | Controlled expanded IDs, per-row eligibility, detail panels after rows | Native panels are flex rows; no native runtime qualification. |
| `TableRowIndexTable`, `TableRowStatusTable` | View-relative ordinals; semantic/custom labelled status markers | Upstream glyph names map to Xplat icons. Native tooltip/assistive delivery unverified. |
| `TableTreeTable` | Nested flattening, expansion state, per-level indent, expand/collapse all, sibling sorting, ancestor-cycle guard | Web rows carry `aria-level`/`aria-expanded`; native ARIA and OS keyboard behavior are not qualified. |
| `/templates/table-grouped/` | Pinned issue data, grouping options, search, collapse, detail pane, create-dialog open/close | Data-driven public Table replaces upstream children-mode manual rows. Create fields remain inert as upstream. Full styling/layout parity is unverified. |
| `/templates/table-tree/` | Pinned repository data and commit rollups, pruning search, sibling sorting, column resize, tree keyboard movement, folder-specific README | Repository header is compact; full repository chrome/about sidebar styling is adapted. No visual parity claim. |
| `/templates/table-inbox/` | Pinned conversations, category/unread counts, selection, conversation history, reply prefill, draft close/reopen/discard, Cc/Bcc | Public Tokenizer supports directory and created recipients, Thumbnail/Lightbox supports attachments, and media-query/resizable composition switches between list and conversation surfaces. Inert Send/archive/move/delete controls remain inert as upstream. Native delivery is unverified. |
| `/templates/table-filter/` | Pinned moving-date service jobs, column filters, PowerSearch tokens, free-text search, sorting, selection, grouping, sticky edges, density/column visibility, saved-view create/load/delete, detail pane | A Power search control escalates removable filter chips to the public PowerSearch editor. Quote-range filtering, cancellable batch loading, preset/edit saved views and complete filter/view snapshots are implemented. Column ordering uses labelled earlier/later buttons instead of upstream drag ordering. |
| `/pages/table-overview/` | Pinned review data, five statistics, search, collapsible sections, selection and author avatars | Author/reviewer avatars and labelled status badges use public components; upstream decorative styling is adapted. |
| `/pages/table-lab/` | Deterministic 50/500/2k/10k data, nine plugin toggles, selection/expansion counts, scroll frame sampling | React Profiler commit timing has no public Octane 0.14.0 equivalent; the screen states that it is unavailable. Scroll measurements are browser frame samples, not renderer commit timings. |

The two existing flat page templates (`table`, `table-page`) remain registered,
so all six table-template destinations render Octane content. Registration is
not proof of matching behavior on every host. Native sticky columns and lab
commit timing remain explicit capability gaps; all non-web hosts remain not-run
for this unit.

Focused browser command (after the sandbox build and preview):

```sh
node apps/astryx-sandbox/scripts/verify-web.mjs --rich-tables-only --browser=chromium --base=http://127.0.0.1:4277
```

Use `--browser=firefox` or `--browser=webkit` for the other engines. Assertions
use browser input plus textual DOM/geometry evidence; no images are captured.
The existing `interactive-data-grid` recipe concerns the separate virtualized
`@octane-xplat/table` DataGrid and is unaffected by these bounded UI Table hooks.

### Verification boundary

Candidate source: `b320f08c0bc00704a0646193d9e58668e17468c5`, after reconciling
newer main work. Each of Chromium, Firefox and WebKit passed the combined
67-check suite against the production build. Initial-DOM reads use
Playwright's retrying assertions; navigation network-idle alone did not prove
that Firefox had mounted the table.

These checks cover all 29 table destinations, group collapse, detail expansion,
tree levels and controls, status labels, sticky geometry, repository
search/keyboard movement, draft retention/discard, narrow inbox navigation,
saved-view authoring, and lab composition/frame sampling. Input is Playwright
browser pointer, keyboard and text entry, with DOM/text and geometry assertions.
They do not establish pixel parity or non-web behavior.

After the integration rebase, sandbox source typechecking, UI declaration
generation, the 21 focused Table tests, the production build, recipe structure,
UI barrel checks and validation of 74 release notes passed. Checks stayed
package-scoped, with one Turbo task at a time and a 2.5 GiB Node heap cap.

An earlier wider UI run before the rebase reported 1,072 passing tests and one
Slider assertion failure; a focused Slider retry reproduced it. That wider
suite was not rerun after the rebase. No Slider source or test was changed by
unit 7.

## Unit 9 — locale and accessibility examples

### Closed route and API rows

| Pinned route (`/templates/<name>/`) | Public Xplat consumer | Status |
| --- | --- | --- |
| `InternationalizationProvider01ShippedLocale` | `InternationalizationProvider`, `frFR`, controlled `Selector`, options-driven `SegmentedControl` | ported |
| `InternationalizationProvider02Overrides` | sparse `overrides`, controlled clear; supplemental `useAnnounce` controls | ported |
| `InternationalizationProvider03RtlDirection` | explicit `dir`, `useLocale`, `useDirection`, `Pagination`; independent nested scope | ported |

The registry closes exactly three pinned rows; all 771 oracle rows remain.
Pagination maps `totalItems=200/pageSize=10` to `pageCount=20`. SegmentedControl
uses the existing options API. The RTL example uses a browser leaf to set the
host `dir` separately from context, as the upstream example requires. The
nested French/LTR scope and announcement controls are supplemental checks.
Source view resolves the running files by their exact template basenames.

| Upstream API/contract | Equivalent | Scope |
| --- | --- | --- |
| subtree locale, sparse overrides and locale updates | `InternationalizationProvider`, `useLocale`, static-only `useTranslator` | exact/parent overrides, exact/parent messages, built-in English fallback; nested scopes replace parent catalogs |
| shipped French catalog | `frFR` | static Selector/Pagination strings only; no full Astryx catalog or ICU formatting claim |
| `dir` + RTL pagination | `useDirection`, `getLocaleDirection`, provider `dir` and host `dir` | mirrored chevrons; previous/next retain logical page meaning |
| `useAnnounce` | same public hook | web polite/assertive persistent regions, repeated/empty messages, 2-second clear; native platform service lacks politeness and clear semantics |
| `useGridFocus` | existing public hook in `ComplexSelectorShowcase` | browser arrows, Home/End, Enter selection checked; iOS/Android default export remains a no-op; AppKit barrel lacks this hook |

### Framework findings and adaptations

- **U9-locale:** missing subtree locale API and fixed Selector strings required
  shared framework work, now consumed by all three routes. Silo observation
  `5104b2f6-20ff-40d3-953c-0a0ee68c18f3` preserves the original expectation.
  Shared context/static strings are implemented across web/mobile/AppKit
  entrypoints; only web runtime is qualified here.
- **U9-static-catalog:** no new dependency was added to UI. This public subset
  accepts static string/rich `defaultMessage` entries only. Full catalog
  translation, interpolation/plurals and other components' strings remain
  outside the three exercised examples. Selector clear-label translation is
  a generic static phrase rather than upstream's label interpolation.
- **U9-keyboard:** previous/next Pagination spans lacked keyboard handlers;
  shared web controls now accept Enter/Space and guard page boundaries.
- **U9-AT:** DOM live-region state and keyboard focus are observable browser
  evidence, not actual speech. Assistive technology delivery, mobile OS input,
  native RTL layout, AppKit, Linux GTK/WebKitGTK and Windows remain not-run.
  Native `useAnnounce` explicitly documents unsupported politeness/clear.
- **U9-tooling:** repository lint rejects TSRX style-map declarations despite
  the available TSRX skill describing them. The examples use imported CSS
  instead; Silo `0aae909d-966b-42a7-b069-37f5ef34a64b` records the mismatch.
- Grid focus is exercised on its existing unit-5 route; no claim is made that
  this closes an additional route or qualifies its iOS/Android no-op implementation.
  The AppKit barrel does not currently export this hook; that remains an
  explicit platform gap, not a verified equivalent (Silo
  `50a68589-1e6d-49da-b5ce-429a7dc53b07`).

### Verification evidence

Upstream: `ebd939b665361a078015377c0dfe50cc3c1d70a4` (Astryx 0.6.4).
Candidate: unit-9 commit containing this section, based on `4308093a8`.
The maintained check is `scripts/verify-web.mjs --locale-only --browser=<engine>`;
assertions use real Playwright clicks/keyboard input and DOM text/state only.
No screenshots or pixel-parity checks are used.

| Route/example | Host/renderer | Initial state → input → expected result | Evidence / status |
| --- | --- | --- | --- |
| shipped locale | web DOM | EN/no selection → FR → French placeholder; select EMEA → EN → value retained; clear → English placeholder | `verify-locale.mjs`; pass in Chromium, Firefox and WebKit |
| overrides | web DOM | empty → choose APAC → clear → `Choose...`; unspecified clear label stays English | `verify-locale.mjs`; pass in Chromium, Firefox and WebKit |
| overrides, supplemental announcements | web DOM | empty regions → polite/assertive clicks → independent messages; clear/repeat/timeout → correct region text | `verify-locale.mjs`; pass in all three engines (DOM only); AT not-run |
| RTL direction | web DOM | page 3/LTR → RTL → context + host direction agree, chevrons reverse; Enter next/Space previous → pages 4/3; nested scope stays French/LTR | `verify-locale.mjs`; pass in Chromium, Firefox and WebKit |
| ComplexSelectorShowcase | web DOM | no department → open → arrows/Home/End move actual focus; Enter → Engineering selected and popup closes | `verify-locale.mjs`; pass in Chromium, Firefox and WebKit |
| provider/lookup/Pagination/announcements | jsdom | scope updates, lookup precedence, unknown keys, explicit direction, disabled boundary, pending-announcement clear | `internationalization.web.test.tsrx`; 4 tests passed; synthetic handler/DOM evidence only |

Recipes extended: `localization` AC7 (subtree UI locale) and
`accessibility-announcements` AC4 (UI hook and host limits). Coverage and
verification are recorded separately in Silo for the landed revision.
`pnpm check:recipes` checks structure and local links only.

Final production-preview results: **12/12 checks passed in each of Chromium,
Firefox and WebKit**, with no browser runtime errors. This includes the running
source view for every unit route. UI package tests: **133 files, 1,077 tests
passed**, including four new locale/accessibility regression tests. Scoped
sandbox typecheck, UI declaration generation and production build passed.
UI has no standalone `typecheck` script; its declaration emit checks the public
source, and the sandbox checks source imports. Focused lint has no errors;
existing SelectView class-name and verify-web warnings remain. UI barrel,
release-note and recipe-structure checks passed.

The **19 other direct UI dependents passed scoped typechecks**, serially
(`--concurrency=1`): 57 Turbo tasks succeeded. These include web, mobile,
AppKit, Linux and Windows harness compilation; they do not qualify host input
or assistive technology.

## Unit 10 — rich content and chat examples

### Closed route and API rows

All names below resolve at `/templates/<name>/`. Exactly **75 pinned rows**
are registered as ported. The 771-row oracle is unchanged (680 ported, 89 pending, 2 blocked in this
checkout); this unit adds no
authored page or composed page-template claims.

| Family | Pinned example names | Rows |
| --- | --- | --- |
| ChatComposer | `ChatComposerAttachments`, `ChatComposerFlat`, `ChatComposerFooterActions`, `ChatComposerFullFeatured`, `ChatComposerShowcase`, `ChatComposerSimple`, `ChatComposerStreaming`, `ChatComposerValidation` | 8 |
| ChatComposerDrawer | `ChatComposerDrawerAttachments`, `ChatComposerDrawerCollapsible`, `ChatComposerDrawerFeedback`, `ChatComposerDrawerShowcase`, `ChatComposerDrawerWithProgress` | 5 |
| ChatComposerInput | `ChatComposerInputControlledInput`, `ChatComposerInputDisabled`, `ChatComposerInputMentionTrigger`, `ChatComposerInputMultipleTriggers`, `ChatComposerInputShowcase`, `ChatComposerInputSlashCommands` | 6 |
| ChatDictationButton | `ChatDictationButtonBasic`, `ChatDictationButtonShowcase` | 2 |
| ChatDictation | `ChatDictationDictationInComposer`, `ChatDictationDictationStates`, `ChatDictationSizes` | 3 |
| ChatLayout | `ChatLayoutPanelChat`, `ChatLayoutShowcase` | 2 |
| ChatLayoutScrollButton | `ChatLayoutScrollButtonLabels`, `ChatLayoutScrollButtonStates` | 2 |
| ChatMessage | `ChatMessageAvatarName`, `ChatMessageGhost`, `ChatMessageMultiBubble`, `ChatMessageShowcase` | 4 |
| ChatMessageBubble | `ChatMessageBubbleCustomContent`, `ChatMessageBubbleDensity`, `ChatMessageBubbleGrouping`, `ChatMessageBubbleMetadata`, `ChatMessageBubbleShowcase`, `ChatMessageBubbleVariants` | 6 |
| ChatMessageList | `ChatMessageListDensity`, `ChatMessageListFullFeatured`, `ChatMessageListShowcase` | 3 |
| ChatMessageMetadata | `ChatMessageMetadataFooter`, `ChatMessageMetadataShowcase`, `ChatMessageMetadataStatus`, `ChatMessageMetadataTimestamp` | 4 |
| ChatSendButton | `ChatSendButtonCustomIcon`, `ChatSendButtonInComposer`, `ChatSendButtonShowcase`, `ChatSendButtonStates` | 4 |
| ChatSystemMessage | `ChatSystemMessageShowcase`, `ChatSystemMessageStatusUpdates`, `ChatSystemMessageVariants`, `ChatSystemMessageWithIcon` | 4 |
| ChatTokenizedText | `ChatTokenizedTextBasic`, `ChatTokenizedTextColors`, `ChatTokenizedTextShowcase` | 3 |
| ChatToolCalls | `ChatToolCallsInteractiveToolCalls`, `ChatToolCallsShowcase`, `ChatToolCallsStatuses`, `ChatToolCallsToolCallsWithNodes` | 4 |
| CodeBlock | `CodeBlockBashCommand`, `CodeBlockHighlightedLines`, `CodeBlockJSONConfig`, `CodeBlockScrollableBlock`, `CodeBlockShowcase`, `CodeBlockTerminal` | 6 |
| Markdown | `MarkdownCitedContent`, `MarkdownCompactAIResponse`, `MarkdownDataTable`, `MarkdownRichContent`, `MarkdownShowcase` | 5 |
| SyntaxTheme | `SyntaxThemeDarkPreset`, `SyntaxThemeLightPreset`, `SyntaxThemeShowcase` | 3 |
| Hooks | `useStreamingTextHookUsage` | 1 |

| Upstream contract | Public Xplat consumer | Disposition |
| --- | --- | --- |
| Markdown children, tables, tasks, strike, compact headings and citations | `Markdown text={...}` at `@octane-xplat/ui/markdown`; shared Table, CodeBlock and Citation composition | ported; `density`, `headingLevelStart`, `sources` added; baked/runtime table/task/strike ASTs agree |
| CodeBlock language/title/line numbers/copy/highlight/scroll cap | existing root `CodeBlock` | direct props; clipboard service remains separately qualified |
| SyntaxTheme wrappers and four presets | public per-block `syntaxTheme` override | explicit override replaces a provider; pinned Dracula/GitHub Light/GitHub Dark/One Dark Pro token data retained |
| completed/streaming text | new public `useStreamingText` at `/markdown` | cumulative snapshots; natural/fast/instant, reset, completion, grapheme boundaries and timer disposal; native reduced-motion preference remains unavailable |
| Chat messages, bubble grouping/density/custom content, metadata/status, system rows, token display and layouts | same named exports at `@octane-xplat/ui/chat` | direct composition; `Timestamp` values use explicit UTC `Z` for deterministic Xplat input |
| composer/input slots, send/stop, validation, drawers, triggers and menus | `ChatComposer`, `ChatComposerInput`, drawer, send button and static search sources | `onSubmit/onStop` → `onSend/onCancel`; `handleRef` → `ref`; Button uses `clickAction`; Menu actions have stable keys |
| tool call details, pending/running/complete/error | `ChatToolCalls` | error duration omitted because the public union allows duration only for completion |
| dictation state fixtures and live capability | `ChatDictationButton`, `useChatDictation` | idle/listening/speaking fixtures retained; live routes explain unsupported recognition; no OS speech claim |

### Framework findings and adaptations

- **U10-rich-markdown:** existing public Markdown lacked the table, task, strike,
  citation and compact-heading capabilities consumed by these pinned routes.
  These now live in UI with matching CLI baking support, not sandbox substitutes.
  Silo observation `e4b5f293-fe1f-47a2-ae48-0fdf093c4748` preserves the expectation.
- **U10-adjacent-links:** the existing parser swallowed closed bracket markers
  before a later link. The shared parser now pairs brackets before looking for
  the destination; mixed citation/link regression passes. Silo
  `3c68e287-eb87-4a69-93c9-a62b73a68bce` records the mismatch.
- **U10-list-label:** browser input exposed a shared ListItem action gap: visible
  label clicks bypassed the invisible hit button. The shared web leaf now
  forwards non-control row content to onPress without double-firing button or
  nested-control actions. Silo `77c8ef23-860d-4a34-9141-73c24d7bdd07` records the
  original expectation. Native ListItem behavior is unchanged and not qualified.
- **U10-scroll-visibility:** the web scroll button had class names for hidden
  state but no hiding rule. It now returns null for isVisible=false, matching
  the native leaf and removing keyboard/hit targets. The two pinned state/label
  routes consume this fix. Silo `a1ee103e-d9f1-453b-9aaf-c8b7e661a94b` records it.
- **U10-dictation-hit:** the listening web mic removed its only icon and its
  unsized Pressable collapsed, so the stop action could not be clicked. Both
  platform leaves now compose the existing sized icon-only Button, matching
  upstream; its ghost skin replaces the bespoke primary fill. The browser
  capability mock verifies a usable stop target without using OS speech. Silo
  `f27346c6-58b5-44d3-8577-fdcb2491f97d` records the original expectation.
- **U10-syntax:** named palettes are app-owned pinned data passed through the
  existing public CodeBlock override; syntax colors stay independent of the root
  theme. Other code blocks retain the unit-2 theme integration.
- **U10-citations:** known source markers compose the existing labelled Citation.
  Source numbers follow object-key order; the pinned map is in first-citation
  order. Unknown ids remain literal. Citation links retain their URLs and icons.
  Full upstream plugins, image rendering and nested block grammar are not claimed.
- **U10-input:** static upstream buttons (attachment removal, footer actions,
  retry/copy/feedback icons) retain their demonstration callbacks; no upload,
  model service or backend is invented. The full-featured list adds a supplemental
  emptyState; the hook sample adds start/stop/reset controls and cleanup.
- **U10-icons/assets:** Heroicons 2.2.0 glyphs enter the shared icon registry.
  Existing generic info glyphs substitute several system-notice icons. The four
  remaining pinned attachment images are copied unchanged with attribution.
- **U10-hosts:** OS clipboard writes, real microphone permission/service/audio,
  native text editing, IME, accessibility delivery, iOS, Android and experimental
  desktop hosts remain not-run. Supported speech callbacks in browser checks are
  explicitly mocked. No visual inspection or pixel-parity claim is made.
- The authored `/pages/markdown-perf/` plugin-registry finding (U13-4) remains
  outside these 75 block examples and is not closed by this change.

### Verification evidence

Upstream: `ebd939b665361a078015377c0dfe50cc3c1d70a4` (0.6.4).
Candidate: the unit-10 commit containing this section, based on `c7d029e25`.
Maintained browser entry: `scripts/verify-web.mjs --content-chat-only --browser=<engine>`.
Checks use DOM text/state and browser input, with separately labelled synthetic
speech callbacks. Each row below shares the upstream/candidate revisions above.

| Route/example | Host/renderer | Initial state → input mechanism → expected/observed result | Evidence / status |
| --- | --- | --- | --- |
| All 75 route rows listed above | web DOM: Chromium, Firefox, WebKit | initial route → browser navigation → actual family component, no pending placeholder; matching running source file exists | `verify-content-chat.mjs` route loop; pass in all three engines |
| Five Markdown routes | same three engines | raw source → render → semantic shifted headings, strike, checked/unchecked tasks, four-column/four-row table, six source citations and code fences | maintained browser assertions; pass |
| Six CodeBlock routes + three syntax routes | same three engines | code fixture → copy click / initial render → captured source and Copied feedback; three highlighted lines, 50 numbered lines, 280px cap and preset-scoped keyword tokens | pass; clipboard API mocked, OS clipboard not-run |
| Controlled, disabled and validation composers | same three engines | empty/default/disabled → browser type + Enter → value reflection, submitted clear, disabled control, error and warning strips | pass |
| Mention, multiple-trigger and slash-command inputs | same three engines | empty → browser fill + arrows/Enter → matching suggestion inserted as a token with serialized value | pass |
| Streaming composer | same three engines | ready → browser Send/Stop clicks → streaming state then cancellation and ready state | pass |
| Drawer collapse and feedback | same three engines | expanded/unselected → browser pointer + Enter → collapsed/expanded aria state; visible choice label selects exactly one row | pass; exercises shared ListItem fix |
| Footer actions | same three engines | closed → browser open/select → menu closes; upstream action callbacks remain demonstrative no-ops | pass |
| Tool calls and full-featured message list | same three engines | details closed / pending-running-complete-error fixtures / empty list → pointer + Enter → detail expands/collapses, all four statuses and error description, public emptyState | pass |
| Send states, token colors and scroll-button states | same three engines | disabled/ready/stop and hidden/visible fixtures → render → disabled state, three token chips, only two visible scroll controls | pass; hidden control is unmounted |
| Dictation fixtures and two live routes | same three engines | idle/listening/speaking / forced unsupported / mocked supported → browser start/stop + synthetic final transcript callback → correct controls, unavailable explanation, transcript insertion and restored idle state | pass; microphone, OS recognition service, sounds and real speech not-run |
| Streaming-text hook | same three engines | completed response → browser Reset/Start → empty state and completed response restored | pass; partial reveal, replacement/reset, emoji boundaries, reduced motion and cleanup have separate jsdom timer tests |
| Source view | same three engines | streaming composer preview → browser Code selection → actual Octane `/chat` source | pass |
| Shared Markdown, stream helper and controls | jsdom + Node | synthetic DOM, fake timers and parser inputs → table/citation/task/strike output, safe adjacent links, partial graphemes/reveal, cleanup, label activation, control visibility and capability changes; baked/runtime AST equality | 76 focused UI tests across eight files; four CLI parity tests passed |

Production preview: **95/95 checks passed in each of Chromium, Firefox and
WebKit**, with no browser runtime errors. This qualifies the unit routes and
listed journeys, not the whole-app host sign-off. No visual evidence was used.

Scoped verification used explicit package filters and serial execution. UI
declaration generation (1,179 files), the sandbox and CLI typechecks, and 19 of
21 selected package/app typecheck targets passed. The first run completed 54
tasks before Windows exhausted its 2.5 GiB Node heap. A five-app retry reused
generated prerequisites: Linux and web passed from cache; mobile exhausted a
3 GiB heap. The retry was stopped before repeating Windows; the separately scoped macOS
check then passed at 2.5 GiB. The mobile/Windows configs include
`../../packages/**/*`; Windows and mobile app-wide checks remain unqualified. No unrestricted Turbo run was used.

Recipe, UI-barrel and release-note checks passed; CSS validation reported zero
unsupported properties (139 intentional native drops). Focused lint reported
no errors, with existing/style warnings retained. Four attachment assets are
byte-identical to the pinned source. Native runtime, real speech and OS
clipboard evidence remain outside this qualification.

## Unit 12 — composed page templates

### Closed route rows

All 55 pinned composed page templates resolve at `/templates/<name>/`. The
six table-driven pages reuse the Table examples delivered by units 6/7;
the remaining 49 are authored TSRX ports. With this unit the composed-page
slice of the 771-row oracle is fully registered (the oracle totals are
updated separately by coverage generation).

| Slice | Routes | Port style |
| --- | --- | --- |
| Blanks, heroes, galleries, logins, app shells | 14 | earlier group-A commit `19d61ca3c` |
| Detail/product/contact/file-explorer/messaging/ide/forms/settings/docs | 10 | earlier group-B commit `9ee5433bc` |
| Table page templates (`table` + variants) | 6 | units 6/7 table pages |
| Dashboards (7), form/checkout/payment wizards (7), console/kanban/library/editor/detail (5), chat/docs/settings/theme/canvas (6) | 25 | this commit |

### Upstream contract → public consumer

| Upstream contract | Public Xplat consumer | Disposition |
| --- | --- | --- |
| Recharts area/bar/donut/funnel charts across all dashboards | app-local SVG chart helper (`src/examples/pages/charts.tsrx`) | substitution recorded; axes, legends, series colors and donut center labels preserved |
| `Stepper` + `Step` wizards with step click, error status, optional steps | public `Stepper`/`Step` (`accessibilityLabel`, `activeStep`, `onStepClick`, `status`, `isOptional`) | ported; validation revealed on Next instead of disabled buttons, matching upstream's validate-on-advance |
| `FileInput` + `MultiSelector` focus/ref targeting (form-wizard-vertical) | public `FileInput`, `MultiSelector` | gap recorded: `MultiSelector` drops DOM props and `FileInput` hides the input, so step validation cannot focus them |
| `PowerSearch` filters/grouping (incident-console) | public `PowerSearch` config | ported 1:1 |
| Chat surfaces (messaging-shell, ai-chat, ai-chat-landing, theme-showcase) | `ChatComposer`/`ChatLayout`/`ChatMessage*` at `@octane-xplat/ui/chat`; `createStaticSource`, `ChatComposerTrigger` tokens | ported; `@`/`/` triggers, mode tokens, attachments, drawer, dictation button |
| Pointer-drag kanban + canvas selection | DOM pointer handlers on card elements | ported; insertion targets computed the same way |
| Settings surfaces (sidebar + dialog shells) | `SideNav`/`SideNavSection`/`SideNavItem`, `Dialog`, `Selector`, `Switch`, `TabList` | condensed panel inventories; search, two-view mobile pattern and tab strip preserved |
| Canvas editor (layers, inspector, resizable rails) | `useResizable`, `LayoutPanel`, `TreeList`-adjacent `List`, numeric axis inputs | condensed port; HSV picker → native color input + hex field; drag transform → axis inputs |

### Framework findings and adaptations

- **U12-chart-substitution:** no public chart engine; the seven dashboards share
  an app-local SVG helper implementing upstream's area/bar/donut/funnel
  visuals. This is a deliberate substitution, not a framework capability claim.
- **U12-control-handler-names:** `Switch`, `DateInput`, `TimeInput` and
  `ToggleButtonGroup` use `onChange`; `Selector`/`MultiSelector`/`SegmentedControl`
 /`RadioList`/`CheckboxList` use `onValueChange` with `string | null` /
  `string[] | null` parameters (null-coalescing handlers added where required).
- **U12-stepper-label:** `Stepper` takes `accessibilityLabel` (not `label`);
  `Step` takes `label`, `status`, `isOptional` — no `icon` slot.
- **U12-textcolor-gap:** `Text color` lacks the `error`/`success`/`warning`
  semantic tones the upstream relies on; ports use `style` color variables.
  Same for `Icon` — no `style` prop, `color` takes the value directly.
- **U12-timestamp-grammar:** `Timestamp value` needs epoch ms
  (`Date.parse(...)` + `valueUnit="unix-milliseconds"`) or full ISO datetimes
  with zone — bare `YYYY-MM-DD` and naive datetimes are rejected.
- **U12-menu-separator:** menu dividers are `{type:'separator'}` rows, and
  `MoreMenu`'s item union accepts no separator at all (dropped there).
- **U12-tsrx-early-jsx:** in `@{` bodies, JSX inside `if`/`switch` must be
  `return`ed — bare JSX statements elsewhere are flagged as unused output.
- **U12-layout-slots:** `Layout` accepts `start`/`end`/`header`/`footer`/
  `content` panels — no `direction` prop; `LayoutHeader` must be imported.

### Verification evidence

Production preview and behavior checks live in
`scripts/verify-pages.mjs` (route-content asserts for all 55 pages plus the
existing pointer/keyboard journeys) and the shared `scripts/verify-web.mjs`
pattern for the whole-app host bar. Results are recorded in the unit-12 commit
report; checks use DOM text/state and real browser input only — no visual
assertions.
