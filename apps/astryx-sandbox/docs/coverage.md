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
| authored pages (`/pages/*`) | 51 | `(sandbox\|fullscreen\|raw)/pages/**/page.tsx` | all pending (honest placeholders, group framing preserved) |
| block templates | 659 | `cli/assets/templates/blocks/components/<Family>/<Name>.tsx` | 15 ported (Button ×6, Text ×9), 644 pending |
| page templates | 55 | `cli/assets/templates/pages/<slug>/page.tsx` | all pending |

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
| `LinkProvider component={SandboxLink}` + `useLinkComponent` | none — `as` prop slots on nav items; app-level `SandboxLink` calls `router.navigateUrl` | finding (unit 3): app `shell/SandboxLink.web.tsrx` replicates the injection point; components keep the `as` seam |
| `Layout`, `LayoutHeader`, `LayoutContent` | none | composed as `shell/PageLayout.tsrx` (recorded gap) |
| `Grid columns={{minWidth}}` responsive | none — track grammar is static | `.sb-card-grid` CSS `repeat(auto-fill, minmax(320px,1fr))` — adaptation |
| `Text type/color/weight/wordBreak/textWrap/maxLines/display` props | absent — typography via `className`/tokens; `numberOfLines` covers truncation | token classes in `sandbox.css`; `placeholder` color maps to `--color-text-disabled` (approximation) |
| `Badge variant="info|warning|neutral" label` | `Badge` unstyled container | `.sb-badge--*` classes — adaptation |
| `Icon icon={<Icon icon={HeroIcon}/>}` (heroicons) | `icon` prop takes registered `IconName` | `sandbox-*` glyph registrations, same MIT path data |
| `ToggleButtonGroup`/`ToggleButton` (single select) | same shape (value/onChange/children) | **deferred** — rendering the group inside the ported Home screen blanks the route at runtime (no error surfaced); category filter removed from the home page for unit 1 and recorded here for follow-up |
| `TextInput isLabelHidden startIcon` | `SearchInput` (normalized search chrome) | equivalent contract |
| `SideNav*` `as={Link}` | `SideNavItem as` prop + `href` | direct shape parity |
| `DropdownMenu button={…isIconOnly}` | `DropdownMenu trigger`/`accessibilityLabel` + `radio-group` items | equivalent contract |
| `localStorage` theme/mode + `?embed/theme/mode` | `persist.web.ts` leaf (same keys: `astryx-sandbox-theme/mode`) | implemented for mode; theme param honored when a theme exists |
| `matchMedia`-gated `hideOnSmall/hideOnLarge` home classes | — | dropped cosmetic responsive duplication on the home filter row (visible always); recorded, not load-bearing |

## Framework findings carried forward (unit-1 evidence)

- `F-1` Multi-DefinedTheme runtime — **resolved in unit 2** by the public
  `Theme`/`defineTheme`/`useTheme`/`generateThemeCss` API in
  `packages/ui/src/theme/`: web emits `light-dark()` scope rules keyed on
  `.xds-theme-<name>` + `color-scheme`; native emits class-split rules via
  `Application.addCss` (UNVERIFIED on actual hosts). Root scope mirrors to
  `<html data-xds-theme>` + `themeSchemeClasses()` so overlay hosts restamp.
- `F-2` `LinkProvider`/`useLinkComponent` link injection — exercised by
  `RouteView`, `polymorphic-link`, `LinkProviderCustomLink` template.
  App-level `SandboxLink` is the interim seam. Owner: unit 3.
- `F-3` `Layout`/`LayoutHeader`/`LayoutContent`/`LayoutFooter`/`LayoutPanel`
  and `GridSpan` — exercised by nearly every page/template. Composed at app
  level for now (`PageLayout`). Owner: units 3/11.
- `F-4` `LayerProvider` public provider + toast config — exercised by
  `providers.tsx` root. Owner: unit 4.
- `F-5` Full `useTable*`/Table parts + column DSL surface — exercised by 21
  Table block templates, 6 page templates, audits, table-overview/lab.
  Owner: units 6–7.
- `F-6` Compositional parts: `SegmentedControlItem`, `SelectorOption`,
  `RadioListItem`/`CheckboxListItem`, `CollapsibleGroup`, `Step`,
  `FieldLabel`, `AvatarGroupOverflow`/`AvatarStatusDot`, CommandPalette
  parts. Owner: units 3–11 per family.
- `F-7` `ToggleButtonGroup` render defect — mounting `ToggleButtonGroup`
  with `ToggleButton` children inside a `.tsrx` screen produces an empty
  render (blank route, no console/page error). Repro: restore the commented
  filter row in `src/screens/HomeScreen.tsrx`. Home category filter omitted
  until diagnosed; upstream's single-select category tab behavior is
  preserved as pending scope, not silently substituted.

## Honest limitations (unit 1)

- Preview chrome (`PreviewShell`: TreeList nav, ⌘K palette, source view,
  copy) is not implemented; template routes use an interim frame. Unit 3.
- `MediaTheme`, syntax themes, color-studio/palette-generator/mobile-spacing,
  theme-family pages remain pending (later units). The palette preview's
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
