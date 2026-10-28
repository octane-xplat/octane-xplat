# Upstream provenance

Ported from [`frontendsupply/lightbox`](https://github.com/frontendsupply/lightbox)
0.3.0, MIT (LICENSE.lightbox), pinned commit
`330e4387df9cc15b6386734cf3a4f837e005c519`. Local reference clone:
`research/lightbox/packages/lightbox/src/`.

## What's ported

| Contract | Upstream reference | Port |
| --- | --- | --- |
| Geometry | `math.ts` — `fit`, `intersect`, `lerpVisual`, `rubber`, `band`, `panRange`, `zoomAt`, `toStyle` | `src/math.ts`; `toStyle` returns numeric `{x, y, scale, inset, radius, opacity}` instead of a CSS `clipPath` string |
| Gesture rules | `lightbox.tsx` `Image` effect ~L978–1290 — slop/direction lock, pull scale+presence, dismiss release, pinch rubber-band and below-fit close, double-tap zoom | `src/gesture-machine.ts` as pure intents → commands |
| Root phase machine | `lightbox.tsx` root — `openAt`, `close`, `goTo` jump/held bookkeeping, `onScrollIndex`, `onOpened` guards | `src/state.ts` reducer + effects |
| Tap timing | `lightbox.tsx` `onTap` — 300 ms / 30 px window, 260 ms delay, mouse/backdrop passthrough | `src/tap-detector.ts` |
| Motion specs | `lightbox.tsx` L154–161 — OPEN 380/34, CLOSE 520/46, SETTLE 420/42, FADE 0.24 s, REDUCED 0.16 s, inertia `{power 0.5, timeConstant 280, bounceStiffness 360, bounceDamping 36}` | `src/constants.ts` |
| Thumbnail strip | `lightbox.tsx` L1380–1520 — thumbnail registration, fractional indicator position/size, centered strip, indexed activation | `src/thumbnail-layout.ts` plus web/native `thumbnails` leaves; sparse mounted indices interpolate between their actual media indices |

## Intentional adaptations and their reasons

The reference is the pinned source above, not the latest upstream release.
The audit below inspected implementation source at `c03370f9b` on 2026-10-28.
It does not establish visual parity or additional runtime qualification.

| Adaptation | Reason and tradeoff | Where the reason was recorded before this audit |
| --- | --- | --- |
| Astryx-shaped `media`, `isOpen`, `index`, `hasWheelZoom`, `hasBackdropDismiss`, and `triggerScroll`; upstream's context hook becomes `useLightboxState` | Preserve the existing Astryx API while adding upstream's parts. `useLightbox` remains the imperative convenience hook; this is intentionally not upstream's API verbatim. | Repository [decision 126](../../.agents/design/decisions.md), with the detailed name mapping in the external port plan |
| A callable convenience `Lightbox`, default controls/counter/caption, and video media entries | Preserve existing UI Lightbox capabilities. Upstream supplies image parts rather than this convenience viewer. Web uses a video element; native currently displays alt text. Native video playback is not implemented. | External plan D2; convenience anatomy is identified in source comments |
| Separate private leaf using Octane hooks, native/web leaves, and the existing motion package | React, Motion React hooks, and DOM hosts cannot implement a native Octane component directly. The gesture plugin and motion engine also put this outside dependency-free UI. The UI export cutover is still pending. | [Decision 126](../../.agents/design/decisions.md), [README](README.md) |
| Pure gesture commands and root reducer, with host effects | Share gesture rules and phase bookkeeping across renderers and test them independently of host input. This structure is not evidence that every host executes the commands equivalently. | External plan's module map and source comments in `gesture-machine.ts` / `state.ts` |
| Numeric `toStyle` output and per-OS clip writers | Motion/native host channels need numbers; web formats CSS inset clipping, iOS writes a layer mask, Android writes an outline. Native layout can arrive late, so clipping and morph startup wait for valid bounds. | Original table above; detailed mechanisms and runtime evidence in [native notes](../../.agents/docs/notes/lightbox-native.md) |
| No Blossom; web mouse drag projects release position and springs to a slide | Existing Carousel lacks pointer drag, fractional progress, and the viewer's freeze/zoom coordination. A small track adapter avoids another dependency. Touch and trackpad retain browser scroll-snap. Mouse physics therefore differ from Blossom; matching constants does not prove matching feel. | [Decision 127](../../.agents/design/decisions.md); external plan D3/D4. The physics tradeoff is made explicit by this audit. |
| Self-drawn native track and gesturehandler PAN/PINCH/TAP graph | NativeScript lacks CSS scroll-snap. The existing pager does not expose the gesture arbitration and fractional progress required here. Native handlers own tap recognition rather than the web detector's timer. | [Decision 127](../../.agents/design/decisions.md); native units, cleanup, and input evidence in [native notes](../../.agents/docs/notes/lightbox-native.md) |
| One public `Overlay isModal` host; inline backdrop; no `Lightbox.Portal` part | Reuse framework portal ownership, focus isolation, and native dismissal rather than Base UI's React dialog lifecycle. Popup owns the portal, so a separate Portal part is omitted. This does not by itself replace every Base UI semantic feature; see the gaps below. | [Decision 128](../../.agents/design/decisions.md) explains the host; Portal omission was not explicitly recorded before this audit. |
| No `useRender` / `render` element replacement or Base UI prop merging | Those are React/Base UI mechanisms. Parts use framework hosts, children, classes, styles, and selected callbacks instead. Consumers cannot assume arbitrary DOM props, refs, event cancellation, or element replacement transfer unchanged. | Original divergence list and external plan; the reduced composition contract lacked an explanation here. |
| Shared thumbnail layout with sparse media indices and replacement-safe cleanup | Interpolate between actual registered media indices rather than assuming indices are contiguous from zero. Ignore stale cleanup when a replacement host has registered. Share geometry while each renderer owns measurement and scrolling. | Original provenance table named sparse support, but did not explain why; replacement handling was only recorded in code/tests. |
| Latest viewport callback held in a stable ref | Octane index updates otherwise reattached the scroll effect and forced a whole-slide snap during fractional movement. | [Native notes, phase 5](../../.agents/docs/notes/lightbox-native.md#phase-5-preview-and-verification) |
| Prepared iOS Page required for full-window layout | NativeScript otherwise measures the overlay against the safe-area content rectangle. This is an app-host requirement, not an implemented leaf-side overflow flag. | Original requirement here and [native notes](../../.agents/docs/notes/lightbox-native.md#ios-layout-and-clipping) |

The external plan is `~/dev/plans/octane-xplat/lightbox-port.md`. It is useful
history, but is not available to repository consumers. The table above makes
the reasons discoverable in this repository. Existing source tests cover many
shared rules; the [evidence record](../../.agents/docs/notes/lightbox-native.md)
separates those checks from actual platform input.

## Unfinished behavior and audit findings

These are not approved parity exceptions. No source-backed reason was found
for treating the newly identified omissions as desired behavior. Recording a
gap does not qualify the implementation for public cutover.

| Finding | Source evidence and consequence | Documentation before this audit |
| --- | --- | --- |
| Native default viewport produces empty slides | `root.tsrx` `Viewport` supplies `<Slide index={i} />` with no Image child, while `Slide` renders only its supplied children. Upstream and the web leaf supply Image children. The README's childless Viewport example therefore does not work equivalently on native. | Not recorded |
| Native custom/video slides do not complete opening | Native `Popup` lacks the web/upstream fallback presence animation when no Image controller exists. A native alt-text video slide or custom non-image slide has no equivalent path to `onOpened`; it can remain in `opening` with presence zero. This is a source-derived finding, not a new device observation. | Video fallback was in the plan; missing opening lifecycle was not recorded |
| Native distant jumps are instantaneous | `track.mobile.tsrx` `fade` sets row opacity to zero, freezes at the target, then immediately restores opacity; it contains no fade animation. Native `Slide` also omits `ctx.held` from its render window, unlike upstream/web. The 0.24-second dissolve and retained outgoing content are not implemented. | Not recorded |
| `hasZoom` is not consistently honored | Both Roots derive `maxZoom` without reading `hasZoom`. Native convenience Lightbox maps `hasZoom=false` to `maxZoom=1`; web convenience forwards the ignored `hasZoom` instead. Thus the web convenience option and both direct Roots do not disable zoom as declared. | Not recorded |
| Native page-behind scrolling and trigger selection are incomplete | `scroll-sync.ts` writes the ancestor's current offset back unchanged. Native `pickTrigger` chooses the opening host or first attached host, without visibility ranking; its `visibleFraction` helper is unused and does not clip ancestors or the viewport. Unlike upstream, native also hides the entire trigger rather than only its image. | Scrolling/visibility placeholders recorded in native notes; trigger ranking and whole-trigger hiding were not explicit |
| Native source geometry assumes centered cover cropping | `Image.tsrx` calls `thumbVisualFrom` with the trigger rectangle and a numeric trigger radius. It does not inspect the thumbnail image's contain/cover mode, focal position, ancestor clipping, or image-specific radius as upstream/web do. Partially clipped or contain-fit thumbnails can morph from the wrong rectangle. | Centered positioning mentioned in a math source comment as a limitation; the full difference and rationale were not recorded |
| Missing native natural dimensions and responsive sources | `Image.tsrx` uses width/height or square aspect, and its image host forwards src/alt but not `srcSet`/`sizes`. Web learns natural dimensions and supports responsive source attributes. | Square-aspect fallback recorded in native notes; native responsive-source omission was not explicit. The media type calls these web attributes. |
| Title/Description lost dialog associations | Upstream exports Base UI [Dialog.Title/Dialog.Description](https://base-ui.com/react/components/dialog), which label and describe the dialog. Web parts are plain h2/p with fixed default IDs; the Overlay dialog uses an aria-label and has no corresponding `aria-labelledby`/`aria-describedby` wiring. Native parts are plain labels. Base UI's naming/description relationship has not been reproduced. | Not recorded; the host decision described only general modal behavior |
| Native focus-return option has no implementation | `finalFocusRef` is stored in native context but never used to restore focus. Web implements the explicit target/current-trigger return. | Prop documentation labels this as web semantics; no native parity decision or feasibility evidence was recorded |
| Native spring-back presence uses a different transition | Native Image's `restorePresence` animates with `ctx.options.close`, while upstream/web use SETTLE. A user-supplied close transition can therefore change native backdrop recovery after a cancelled pull. | Not recorded; no deliberate reason found |
| macOS entry is entirely unsupported | `index.macos.ts` throws for every part/hook. The existing UI Lightbox remains available; moving its AppKit viewer into the leaf and qualifying the planned subset have not happened. | README and native notes clearly record pending macOS support |

The audit also found stale prose: the native video fallback is described as
“reports it unsupported” in `props.ts`, although implementation displays alt
text; the scroll-sync source comment implies synchronization that it does
not perform. Those claims should be corrected alongside the corresponding
behavior, rather than used as evidence of parity.

## Repair progress

- Zoom-disable normalization now belongs to both Root leaves, including direct
  compound use, convenience components, and imperative hooks. Disabled zoom
  ignores pinch instead of briefly rubber-banding above one. Focused checks:
  six web/native entry-point cases and the shared gesture suite; these do not
  qualify OS input. The native test clock also covers motion's nested imports.

- Native default Viewport now supplies Image children. Popup checks for an
  Image controller after child registration and animates presence for custom
  or video alt-text slides; close/unmount cancels the fallback. Seven focused
  web/native checks cover delayed image layout, custom/video opening and early
  close. A newly exposed web opening-frame callback is also cancelled on
  teardown, preventing a late read of an unmounted image wrapper. Native OS
  input qualification remains pending.

- Native distant navigation now retains the outgoing slide and begins its
  dissolve after target content commits. FADE animates both slide opacity and
  fractional progress; interruption, resize and teardown restore owned styles
  and finish the pending operation. Object-driver checks cover interpolation,
  completion, freeze cancellation and unmount. Native cancelled-pull presence
  now uses SETTLE regardless of the custom close transition, covered through
  gesture dispatch. Device animation qualification is still pending.

- Web Title/Description now register per-viewer IDs with Overlay's actual
  dialog host; explicit IDs, independent viewers and removal/fallback are
  covered by DOM tests. Native Title reads the rendered Label text and uses it
  as the modal name. Native Description remains accessible content, without a
  dialog-description association; neither NativeScript's action hint nor DOM
  ID props are presented as an equivalent. Native object-driver naming checks
  pass; screen-reader qualification and description association remain open.

- Native Image now observes the existing host's imageSource/loading events,
  uses valid decoded dimensions when media dimensions are absent, rejects
  stale source notifications, and releases listeners on replacement/unmount.
  A failed decode yields an alt-text fallback rather than an invented natural
  size; explicit dimensions still allow early fitting. Native responsive
  srcSet/sizes remain outside the documented web-only attribute contract.
  Observer and delayed-layout checks pass; device loading/layout is pending.

- Native morph sources now inspect the image child, its fit/positioned
  bounds, clipping ancestors and radii in DIPs. Visibility ownership hides
  only that image and restores its original value on switching/close/unmount.
  Numeric checks cover contain/cover, positioned inner content, cropped and
  offscreen sources, radii and visibility restoration. A distorted fill or
  raw none-stretched source falls back to fading rather than pretending its
  crop is a uniform-scale morph. Device crop/morph qualification remains open.

- Native trigger selection now ranks clipped visible registrations while
  preserving the measurable opening source. Page sync calculates a bounded
  offset for the nearest ancestor exposing a ScrollView-style axis API,
  honors smooth/instant/disabled options and delays open-phase sync as
  upstream does. Index-only lists do not masquerade as offset scrollers.
  Numeric tests cover both axes, bounds, duplicates and detached hosts.
  Real native scrolling and post-scroll morph targets still need qualification.

## Qualification boundary

This was a source and documentation audit of the pinned reference, not an
exhaustive proof of every event ordering, accessibility outcome, crop, or
animation frame. No browser/device tests, screenshots, or image analysis ran
for this audit. Earlier numeric browser checks and native probe/OS-input
results remain bounded by the versions and cases in the native notes.

Before public cutover, resolve the behavior gaps above, reconcile the README
and declarations with actual behavior, and add focused regression coverage.
Qualify native thumbnail geometry and the latest native host styling on iOS
and Android. Then complete the AppKit work and the consumer/docs/recipe
migration. The private preview must not be described as a completed parity
port in the meantime.
