# Whole-package API vision

Every audited concept has a target below. Use this as the complete destination map; use [recommended changes](recommended-changes.md) for the priority queue and the linked concept pages for reasoning and current source evidence. The entrypoint split is approved; additional boundary choices here are recommendations made under the authorization to develop this audit. These are design recommendations, not supported API instructions. Names follow Astryx → React Aria → React Native → generic frontend; domain contracts below do not authorize generic renames over comparable reference APIs.

## Canonical import ownership

| Planned import                                           | Owns                                                                                                                                           | Boundary                                                                                                                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@octane-xplat/ui`                                       | General layout, actions, fields, collections, navigation presentation, overlays, media display, accessibility, styling, and small UI utilities | No routing engine or application data lifecycle required to use an ordinary component.                                                                        |
| `@octane-xplat/ui/routing`                               | Route authoring, destinations, navigation, back handling, router state                                                                         | Presentation such as Tabs, Link, and AppShell stays at the root; route-aware adapters live here.                                                              |
| `@octane-xplat/ui/data`                                  | Stores, collection models, async lists, cached queries                                                                                         | Visual lists stay at the root; ordinary inputs do not import data helpers implicitly.                                                                         |
| `@octane-xplat/ui/markdown`                              | Document model, parsing, rendering, streaming, document-derived outlines, code syntax utilities                                                | Code/CodeBlock and Outline display stay at the root. Keep syntax here initially; a separate syntax entrypoint needs evidence of an independent consumer task. |
| `@octane-xplat/ui/chat`                                  | Messages, composer drafts/tokens, tool-call display, latest-message scrolling, dictation UI                                                    | General scrolling and fields stay at the root. Speech-engine dependencies/lifecycle belong in a leaf package.                                                 |
| `@octane-xplat/ui/ios`, `/android`                       | Platform-authentic widgets and their exact types                                                                                               | Shared contracts where behavior matches; explicit OS differences and capability requirements.                                                                 |
| `@octane-xplat/ui/web`                                   | DOM-specific attachment/discovery and browser-only integration                                                                                 | Portable components have their canonical import at the root.                                                                                                  |
| Explicit NativeScript integration path                   | NativeScript hosts and lifecycle                                                                                                               | Recommend `/nativescript` over the broad `/native` name, subject to reference naming; ordinary app UI never needs host lookups.                               |
| `@octane-xplat/ui/theme/tokens.css`, `/theme/chrome.css` | Published CSS assets                                                                                                                           | Exact paths match development and release.                                                                                                                    |

Reason: these boundaries follow consumer tasks while retaining ordinary UI in one place. Independent imports should not require agents to coordinate extra providers or guess where common controls belong. Pure UI stays in this package; external engines, plugins, and system lifecycles justify separate packages. macOS/Linux shared rendering remains a condition of the same shared API, with intentional OS contracts explicitly exposed only when they exist.

## Shared contract vocabulary

Across the map, preserve precise item/selection/destination types; use coherent state roles and named events; expose portable refs/handles; distinguish identity, units, snapshots, resources, and capabilities. Defaults should make the common task short. Escapes remain explicit. Required providers, accessible relationships, completion, and failure must be visible in the contract. This specifies shared meaning, not one universal props bag or render-context type.

## Public contracts

| Concept                                                              | Target public contract                                                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [Accessibility props](root/contracts/accessibility.md)               | Export shared accessibility types; model names, roles, and role-specific states explicitly.                           |
| [Conditional root exports](root/contracts/conditional-surface.md)    | Use one intentional shared value/type surface, with platform-only additions on explicit subpaths.                     |
| [Package entrypoints and discoverability](root/contracts/imports.md) | Root owns general UI; routing, data, Markdown, and chat each own one canonical feature subpath.                       |
| [Names and public types](root/contracts/names.md)                    | Apply the reference hierarchy to semantically comparable names and match all associated public types.                 |
| [Platform support contracts](root/contracts/platform-support.md)     | Publish exact shared guarantees and explicit capabilities or supported subsets; reject unsupported required behavior. |
| [Shared props and type safety](root/contracts/props.md)              | Share precise host, style, ref, and test-identifier contracts; bound target escape hatches and their precedence.      |
| [State and event conventions](root/contracts/state-events.md)        | Give each state dimension controlled/initial/change roles and one activation path with observable outcomes.           |

## Layout

| Concept                                                                 | Target public contract                                                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Absolute](root/layout/absolute.md)                                     | Keep an explicit absolute-position container; define edges, coordinate units, and stacking behavior together.              |
| [Center, Section, and AspectRatio](root/layout/conveniences.md)         | Keep Center, Section, and AspectRatio as focused presets with explicit geometry/content precedence.                        |
| [Grid](root/layout/grid.md)                                             | Expose a bounded portable track grammar, consistent child placement, and explicit numbering.                               |
| [KeyboardAvoiding and useKeyboardInset](root/layout/keyboard-insets.md) | Expose keyboard avoidance behavior and offset; specify interaction with already-consumed system insets.                    |
| [useMeasure](root/layout/measure.md)                                    | Publish a typed attachment, coordinate space, and measurement readiness.                                                   |
| [useResizable and ResizeHandle](root/layout/resizing.md)                | Expose a small typed resize controller and one size model; remove public drag bookkeeping.                                 |
| [Screen and SafeArea](root/layout/screen-insets.md)                     | Specify selected safe-area edges and whether nested containers consume each inset once.                                    |
| [ScrollableArea and useScrollableArea](root/layout/scrollable-area.md)  | Keep logical axes; share typed scrolling, offsets, viewport units, and completion behavior.                                |
| [Spacer](root/layout/spacer.md)                                         | Keep flexible empty space; containers own fixed gaps using the common spacing model.                                       |
| [Stack, HStack, VStack, and StackItem](root/layout/stack.md)            | Keep Stack/HStack/VStack presets; use one reference-backed alignment model and explicit spacing-token versus layout units. |
| [View](root/layout/view.md)                                             | Keep View neutral; constrain placement values and identify which parent layout consumes each prop.                         |

## Actions

| Concept                                                               | Target public contract                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Button and IconButton](root/actions/button.md)                       | Keep Button/IconButton; remove competing state/slot/action aliases and expose async failure; require icon-button naming. |
| [ButtonGroup](root/actions/button-group.md)                           | Keep layout and shared defaults distinct from selection; define child override precedence.                               |
| [Collapsible and Accordion](root/actions/disclosure.md)               | Keep Collapsible and Accordion; distinguish expansion from surface visibility and type single/multiple expansion.        |
| [ClickableCard and SelectableCard](root/actions/interactive-cards.md) | Keep reference-backed action/selection card names; share Card appearance and distinct activation versus selection.       |
| [Pressable](root/actions/pressable.md)                                | Keep the portable interaction primitive with a small typed activation event and separate gesture events.                 |
| [ToggleButton and ToggleButtonGroup](root/actions/toggle-button.md)   | Keep single/multiple group discrimination; align pressed/selection ownership and remove duplicate mutation callbacks.    |

## Forms

| Concept                                                                              | Target public contract                                                                                                       |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| [CheckboxInput and Switch](root/forms/boolean-inputs.md)                             | Preserve CheckboxInput/Switch; complete checked-state ownership and distinguish mixed appearance from submitted values.      |
| [Calendar and calendar hooks](root/forms/calendar.md)                                | Preserve the single/range union; use one validated calendar-date domain for values, constraints, and changes.                |
| [RadioList, CheckboxList, and SegmentedControl](root/forms/choice-lists.md)          | Preserve RadioList/CheckboxList; share single-choice options, defaults, and orientation with SegmentedControl.               |
| [ComplexSelector](root/forms/complex-selector.md)                                    | Keep the reference-backed component; expose named render state, consistent content styling, and explicit commit outcomes.    |
| [DateInput, TimeInput, DateTimeInput, and DateRangeInput](root/forms/date-inputs.md) | Use consistent clearing and local-date/time versus instant domains; choose one picker strategy with stated fallback.         |
| [Field, FieldGroup, and useFieldControl](root/forms/field.md)                        | Let Field own label/description/error associations; separate validation, required state, and appearance.                     |
| [FormLayout, InputGroup, and InputGroupText](root/forms/form-layout.md)              | Keep arrangement and grouped chrome separate from form state/submission; define group defaults and child overrides.          |
| [NumberInput](root/forms/number-input.md)                                            | Represent an empty committed number explicitly; distinguish intermediate text, parse failure, bounds, and step behavior.     |
| [PinInput and InputRating](root/forms/pin-rating.md)                                 | Keep PIN strings and reference-backed names; define initialization, paste/character rules, rating steps, zero, and clearing. |
| [PowerSearch and its configuration](root/forms/power-search.md)                      | Infer field/operator/value combinations from configuration; expose a typed ref and named change details.                     |
| [SearchInput](root/forms/search-input.md)                                            | Keep a text-input preset with the same state model; specify the submitted query and clearing behavior.                       |
| [Selector and MultiSelector](root/forms/select.md)                                   | Preserve Selector/MultiSelector; tie mode to exact scalar/array values and clearing types.                                   |
| [Slider](root/forms/slider.md)                                                       | Share numeric range/step semantics; expose initial state, accessible naming, and drag-versus-commit events.                  |
| [TextInput and TextArea](root/forms/text-input.md)                                   | Align TextInput/TextArea state, options, and typed refs; separate password behavior, keyboard hints, and validation.         |
| [Token and Tokenizer](root/forms/tokenizer.md)                                       | Preserve Token/Tokenizer; align selected-value editing and activation, using named change details.                           |
| [Typeahead, BaseTypeahead, and TypeaheadItem](root/forms/typeahead.md)               | Preserve Typeahead; separate query and selection, hide internal coordination, and share request-scoped abortable search.     |

## Content

| Concept                                                                               | Target public contract                                                                                                           |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Avatar, AvatarGroup, and User](root/content/avatar.md)                               | Keep reference-backed identity display; separate visible fallback and accessible naming, with typed shared sizing/overflow.      |
| [Badge and Chip](root/content/badge-chip.md)                                          | Keep Badge passive; make chip activation, selection, and removal distinct with consistent appearance.                            |
| [Card](root/content/card.md)                                                          | Keep Card passive with typed variants and reusable header/footer/content anatomy.                                                |
| [Code, CodeBlock, and Blockquote](root/content/code.md)                               | Keep code display; separate syntax data and decoration, and expose copy success/failure and line-number semantics.               |
| [Divider and Skeleton](root/content/divider-skeleton.md)                              | Keep display helpers; share bounded size/orientation contracts without owning loading state.                                     |
| [Alert, Banner, and EmptyState](root/content/feedback.md)                             | Share meaningful tones; make dismissal ownership explicit and keep EmptyState independent of fetching.                           |
| [Kbd](root/content/kbd.md)                                                            | Keep displayed keycaps distinct from registered shortcuts; type modifiers when displaying combinations.                          |
| [Markdown streaming helpers](root/content/markdown-streaming.md)                      | Offer one append/reset streaming parser with documented results; keep orchestration helpers private unless independently useful. |
| [Markdown, MarkdownScreen, and parsing](root/content/markdown.md)                     | Offer one text-or-document source, a readable versioned document format, and a documented screen composition.                    |
| [MetadataList and MetadataListItem](root/content/metadata.md)                         | Keep label/value pairs; distinguish visible labels from label-layout options and use consistent visible-item limits.             |
| [Outline and outline discovery](root/content/outline.md)                              | Keep portable outline data primary; distinguish document derivation, DOM discovery, and native-view discovery.                   |
| [ProgressBar, Meter, Spinner, ProgressGroup, and StatusDot](root/content/progress.md) | Separate actual meter semantics from task progress; type determinate/indeterminate states and accessible ranges.                 |
| [RichText and RichTextSpan](root/content/rich-text.md)                                | Keep formatted display distinct from editing; require one span content source and define portable nesting/activation.            |
| [Syntax tokenization](root/content/syntax.md)                                         | Use explicit code-tokenization terminology and typed kinds/offsets; hide thresholds and CSS plumbing.                            |
| [Text and Heading](root/content/text.md)                                              | Share typography across Text/time labels; keep Heading level semantic rather than tied to visual size.                           |
| [Thumbnail and Citation](root/content/thumbnail-citation.md)                          | Distinguish decorative, linked, and removable content; require useful citation identity and keyboard-accessible removal.         |
| [Timestamp and Timer](root/content/time.md)                                           | Use explicit epoch/duration units and eliminate numeric-magnitude inference.                                                     |

## Collections

| Concept                                                   | Target public contract                                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [GridList and useGridList](root/collections/grid-list.md) | Keep keyed selection and action distinct; constrain modes and content sources; make keyboard capability truthful.              |
| [Item, List, and ListItem](root/collections/item-list.md) | Choose one reference-backed row anatomy; distinguish standalone content rows from list context without duplicate vocabularies. |
| [Table](root/collections/table.md)                        | Preserve row generics and constrain columns/keys; promise only the tabular interactions actually supported.                    |
| [Timeline](root/collections/timeline.md)                  | Keep passive timeline display with stable identity, shared content slots, and explicit time values.                            |
| [TreeList](root/collections/tree.md)                      | Preserve TreeList; control keyed expansion/selection and distinguish visual nodes from store wrappers.                         |
| [VirtualList](root/collections/virtual-list.md)           | Share typed item identity/rendering; expose key/index scrolling, alignment, failure, and common test identifiers.              |

## Navigation

| Concept                                                                  | Target public contract                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [AppShell and MobileNav](root/navigation/app-shell.md)                   | Separate MobileNav options from rendered content; share open-state ownership and hide internal provider coordination.                      |
| [Breadcrumbs](root/navigation/breadcrumbs.md)                            | Support typed link destinations and explicit action alternatives; identify the current item.                                               |
| [CommandPalette](root/navigation/command-palette.md)                     | Distinguish query, command identity, and activation; share abortable search and observable async failure.                                  |
| [Drawer](root/navigation/drawer.md)                                      | Keep open-state ownership and panel slots explicit; distinguish modal focus/back ownership from persistent layout.                         |
| [NavIcon and heading menus](root/navigation/heading-menus.md)            | Reuse regular icon/menu contracts; expose only consumer-useful customization context.                                                      |
| [Link and NavLink](root/navigation/links.md)                             | Separate destinations from mutable route state; preserve browser links and specify external/internal URL handling.                         |
| [NavigationMenu](root/navigation/navigation-menu.md)                     | Keep navigation destinations distinct from command menus; share link destinations and orientation.                                         |
| [Pagination and Stepper](root/navigation/pagination-stepper.md)          | Specify page numbering and empty counts; give reorderable steps stable identity.                                                           |
| [Route manifests and defineRoutes](root/navigation/route-definitions.md) | Keep defineRoutes as authoring; infer component/loader parameters, expose readonly derived metadata, and reject duplicates.                |
| [Routing and back navigation](root/navigation/routes.md)                 | Offer typed navigation destinations and scoped reactive router state; keep registration, host wiring, and interception lifecycle separate. |
| [SideNav and its parts](root/navigation/side-nav.md)                     | Keep navigation anatomy; use coherent collapsed-state ownership, separate sizing, and a normal typed ref.                                  |
| [Tabs, TabList, Tab, and TabMenu](root/navigation/tabs.md)               | Use stable selection keys; distinguish content panels from route navigation and preserve label/panel relationships.                        |
| [Toolbar and OverflowList](root/navigation/toolbar-overflow.md)          | Keep toolbar slots; render overflow from named hidden-item data with explicit measurement ownership.                                       |
| [TopNav and its parts](root/navigation/top-nav.md)                       | Keep component anatomy; share action/link slots and expose only necessary customization hooks.                                             |
| [openWindow](root/navigation/windows.md)                                 | Separate app-content windows from external URL opening; use observable instance results and truthful payload support.                      |

## Overlays

| Concept                                                                     | Target public contract                                                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [BottomSheet and its service](root/overlays/bottom-sheet.md)                | Share declarative/service options, accessible naming, typed results, and bounded snap points; close an owned instance.                  |
| [Dialog, AlertDialog, and imperative dialog hooks](root/overlays/dialog.md) | Share declarative/imperative options and lifecycle; expose dismissal reasons, title/description associations, and confirmation failure. |
| [HoverCard, useHoverCard, and Tooltip](root/overlays/hover-tooltip.md)      | Share trigger/delay/open conventions; preserve noninteractive tooltip versus rich hover-card semantics and touch access.                |
| [DropdownMenu, ContextMenu, and MoreMenu](root/overlays/menus.md)           | Use the existing precise item union; remove duplicate open/disabled aliases and redundant part vocabularies.                            |
| [Overlay](root/overlays/overlay.md)                                         | Expose a low-level layer with explicit backdrop/modality responsibilities; Dialog remains the complete modal path.                      |
| [Popover and useLayer](root/overlays/popover-layer.md)                      | Share typed anchors and positioning; distinguish anchored/fixed modes and avoid duplicate placement options.                            |
| [Toast, ToastViewport, showToast, and useToast](root/overlays/toast.md)     | Use one content source, explicit duration/persistence, stable identity, dismiss/update handles, and viewport/collision ownership.       |

## Media

| Concept                                                                | Target public contract                                                                                                |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [CameraView on the macOS root](root/media/camera-view.md)              | Remove the unsupported macOS root placeholder; camera support belongs to its feature package and capability contract. |
| [Carousel, Lightbox, and useLightbox](root/media/carousel-lightbox.md) | Keep gallery concepts; align item/index selection and open-state contracts with explicit playback/zoom support.       |
| [Image](root/media/image.md)                                           | Type URI/responsive sources and units; distinguish decorative images from named content and bound positioning.        |
| [WebView](root/media/webview.md)                                       | Require URI or HTML exclusively; expose a portable handle and target-specific policy guarantees.                      |

## Chat

| Concept                                                                     | Target public contract                                                                                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [ChatComposer and composer controls](root/chat/composer.md)                 | Separate draft editing from send/cancel state; specify success clearing, failure retention, and custom-slot context.                  |
| [Speech recognition and chat dictation](root/chat/dictation.md)             | Keep explicit capability reporting; expose async permission/start failures and isolate host audio integration.                        |
| [ChatLayout, ChatMessageList, and scroll hooks](root/chat/layout-scroll.md) | Use the shared scroll controller; expose following-latest state, user interruption, and unread-count/reset behavior.                  |
| [Chat messages and message parts](root/chat/messages.md)                    | Separate sender identity, visual grouping, and delivery state with stable message IDs and reusable metadata slots.                    |
| [Composer tokens, triggers, and paste hooks](root/chat/tokens.md)           | Round-trip one serializable text/token draft with stable IDs; share search and named paste outcomes.                                  |
| [ChatToolCalls](root/chat/tool-calls.md)                                    | Require stable tool-call IDs and typed execution states; separate backend data from rendered results and use explicit duration units. |

## Styling

| Concept                                                                              | Target public contract                                                                                                               |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| [useAnimation, setTranslate, and gesture events](root/styling/animation-gestures.md) | Expose typed animated values/properties, coordinate/velocity/time units, and observable sequence completion/cancellation.            |
| [Icon and icon registration](root/styling/icons.md)                                  | Type registered names and meaningful/decorative accessibility; specify registry scope and late-registration effects.                 |
| [Selection indicators and their registry](root/styling/indicators.md)                | Keep the typed decorative registry; make hook reads reactive or expose an explicitly nonreactive boot-only contract.                 |
| [styled](root/styling/styled.md)                                                     | Provide typed enumerated variants/defaults or clearly expose the narrower boolean-class contract.                                    |
| [Theme preference and color scheme](root/styling/theme.md)                           | Distinguish system appearance, preference, and resolved app scheme; publish reactive preference types and separate root integration. |

## Data and state

| Concept                                                      | Target public contract                                                                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [useAsyncList](root/state/async-list.md)                     | Expose awaitable operations, errors, cancellation/cleanup, pagination readiness, and stale-result/concurrency behavior.                  |
| [useListData and useTreeData](root/state/collection-data.md) | Keep familiar operations with readonly snapshots, shared key/selection types, and explicit initial-only values.                          |
| [cachedQuery$ and query storage](root/state/query-cache.md)  | Separate cache versus signal identity and request/account ownership; define invalidation, persistence units/version/scope, and failures. |
| [createStore and useStore](root/state/store.md)              | Keep explicit stores/reactive reads; separate value assignment and updates and define selector equality.                                 |

## Accessibility

| Concept                                                                           | Target public contract                                                                                            |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Focus hooks](root/accessibility/focus-hooks.md)                                  | Provide actual subtree entry/exit semantics and typed modality/events, or expose the supported subset explicitly. |
| [FocusScope](root/accessibility/focus-scope.md)                                   | Provide containment/autofocus/restoration where accepted; expose unsupported required behavior before use.        |
| [VisuallyHidden and useLandmark](root/accessibility/visually-hidden-landmarks.md) | Keep visually hidden content accessible; separate landmark semantics from optional region-cycling behavior.       |

## Utilities

| Concept                                                                  | Target public contract                                                                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| [bottomSheetHost on the macOS root](root/utilities/bottom-sheet-host.md) | Remove accidental macOS root lookup; host lifecycle belongs to explicit NativeScript integration.                         |
| [copyText and useClipboard](root/utilities/clipboard.md)                 | Keep text-specific operations with observable read/copy results; richer formats need a separate exact contract.           |
| [useKeyboard](root/utilities/keyboard.md)                                | Expose normalized key/code/modifier/composition events and supported attachments; keep software-keyboard insets separate. |
| [isNative](root/utilities/platform.md)                                   | Expose genuine OS identity and behavior capabilities rather than using one native boolean for all choices.                |
| [Ref helpers and mergeProps](root/utilities/refs-props.md)               | Expose typed ref merging and exact prop-composition order, cancellation, classes, styles, and ref preservation.           |

## iOS

| Concept                                                     | Target public contract                                                                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [iOS controls](ios/controls.md)                             | Keep OS widget names; export widget-specific types and honor or narrow every advertised state prop.                         |
| [iOS Icon selector and modifier](ios/icon-modifiers.md)     | Distinguish icon-selection helpers from the root component; type known modifiers and bound unsafe host writes.              |
| [LiquidGlass and LiquidGlassContainer](ios/liquid-glass.md) | Keep the iOS-only effect explicit with capability/fallback and duration units; consolidate effect configuration.            |
| [UITableView](ios/list.md)                                  | Keep UITableView with matching props/handle types and shared item identity, rendering, scrolling, viewability, and refresh. |
| [UIModal and openModal](ios/modal.md)                       | Keep native presentation distinct; share accessible naming, typed instance results, focus, and close lifecycle.             |
| [UITabBar and SideDrawer](ios/navigation.md)                | Keep UITabBar/SideDrawer with widget-specific types, stable keys, coherent open state, and explicit stack hosting.          |

## Android

| Concept                                                         | Target public contract                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Android controls](android/controls.md)                         | Keep OS widget names; export widget-specific types and honor or narrow every advertised state prop.                        |
| [Android Icon selector and modifier](android/icon-modifiers.md) | Distinguish drawable selection from the root component; share typed modifiers while bounding unsafe writes.                |
| [RecyclerView](android/list.md)                                 | Keep RecyclerView with matching props/handle types and shared collection contracts; expose recycling-specific differences. |
| [MaterialDialog and openModal](android/modal.md)                | Keep MaterialDialog with matching types and shared confirmation/cancel/result semantics on owned instances.                |
| [BottomNavigationView and DrawerLayout](android/navigation.md)  | Keep BottomNavigationView/DrawerLayout with matching types, stable selection, and explicit OS gestures.                    |

## NativeScript integration

| Concept                                          | Target public contract                                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| [NativeScript host integration](native/hosts.md) | Give NativeScript host integration an explicit home, typed handles, and lifecycle; exclude it from normal app navigation. |

## Web integration

| Concept                                              | Target public contract                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [Web compatibility entrypoint](web/compatibility.md) | Root owns portable HoverCard/Tooltip; reserve web for actual DOM contracts and deprecate redundant import aliases. |

## Stylesheets

| Concept                                              | Target public contract                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [Theme stylesheet entrypoints](theme/stylesheets.md) | Export exactly the supported tokens/chrome CSS paths in development and publish maps; state inclusion requirements. |

## Completeness and limits

This map covers all 126 concept pages. The [export index](exports.md) maps every root/platform value export to one of those pages, and the [type index](types.md) maps all named public types. Internal or redundant exports may disappear; coverage means they have an intentional destination or removal, not a promise to preserve every symbol.

The source audit supplies design evidence, not proof of runtime parity or agent performance. Each linked concept carries its reasoning; improvements should be evaluated with the representative tasks in [principles](principles.md#applying-these-principles). Implementation and a measured comparison are separate work.

[Prioritized changes](recommended-changes.md) · [Principles](principles.md) · [Audit index](README.md)
