# Whole-package API vision

Every audited concept has a target below. Use this as the complete destination map; use [recommended changes](recommended-changes.md) for the priority queue and the source links below for current contract evidence. The entrypoint split is approved; additional boundary choices here are recommendations made under the authorization to develop this audit. These are design recommendations, not supported API instructions. Names follow Astryx → React Aria → React Native → generic frontend; domain contracts below do not authorize generic renames over comparable reference APIs.

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

| Concept                                                                          | Target public contract                                                                                                |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [Accessibility props](../../../packages/ui/src/props.ts#L301)                    | Export shared accessibility types; model names, roles, and role-specific states explicitly.                           |
| [Conditional root exports](../../../packages/ui/src/index.macos.ts#L249)         | Use one intentional shared value/type surface, with platform-only additions on explicit subpaths.                     |
| [Package entrypoints and discoverability](../../../packages/ui/package.json#L40) | Root owns general UI; routing, data, Markdown, and chat each own one canonical feature subpath.                       |
| [Names and public types](../../../packages/ui/src/props.ts#L6121)                | Apply the reference hierarchy to semantically comparable names and match all associated public types.                 |
| [Platform support contracts](../../../packages/ui/src/components/overlays/FocusScope.tsrx#L7)        | Publish exact shared guarantees and explicit capabilities or supported subsets; reject unsupported required behavior. |
| [Shared props and type safety](../../../packages/ui/src/props.ts#L318)           | Share precise host, style, ref, and test-identifier contracts; bound target escape hatches and their precedence.      |
| [State and event conventions](../../../packages/ui/src/props.ts#L490)            | Give each state dimension controlled/initial/change roles and one activation path with observable outcomes.           |

## Layout

| Concept                                                                          | Target public contract                                                                                                     |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Absolute](../../../packages/ui/src/props.ts#L234)                               | Keep an explicit absolute-position container; define edges, coordinate units, and stacking behavior together.              |
| [Center, Section, and AspectRatio](../../../packages/ui/src/props.ts#L6731)      | Keep Center, Section, and AspectRatio as focused presets with explicit geometry/content precedence.                        |
| [Grid](../../../packages/ui/src/props.ts#L106)                                   | Expose a bounded portable track grammar, consistent child placement, and explicit numbering.                               |
| [KeyboardAvoiding and useKeyboardInset](../../../packages/ui/src/props.ts#L1358) | Expose keyboard avoidance behavior and offset; specify interaction with already-consumed system insets.                    |
| [useMeasure](../../../packages/ui/src/props.ts#L1895)                            | Publish a typed attachment, coordinate space, and measurement readiness.                                                   |
| [useResizable and ResizeHandle](../../../packages/ui/src/props.ts#L5335)         | Expose a small typed resize controller and one size model; remove public drag bookkeeping.                                 |
| [Screen and SafeArea](../../../packages/ui/src/props.ts#L1332)                   | Specify selected safe-area edges and whether nested containers consume each inset once.                                    |
| [ScrollableArea and useScrollableArea](../../../packages/ui/src/props.ts#L1016)  | Keep logical axes; share typed scrolling, offsets, viewport units, and completion behavior.                                |
| [Spacer](../../../packages/ui/src/props.ts#L278)                                 | Keep flexible empty space; containers own fixed gaps using the common spacing model.                                       |
| [Stack, HStack, VStack, and StackItem](../../../packages/ui/src/props.ts#L120)   | Keep Stack/HStack/VStack presets; use one reference-backed alignment model and explicit spacing-token versus layout units. |
| [View](../../../packages/ui/src/props.ts#L318)                                   | Keep View neutral; constrain placement values and identify which parent layout consumes each prop.                         |

## Actions

| Concept                                                                       | Target public contract                                                                                                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Button and IconButton](../../../packages/ui/src/props.ts#L2744)              | Keep Button/IconButton; remove competing state/slot/action aliases and expose async failure; require icon-button naming. |
| [ButtonGroup](../../../packages/ui/src/props.ts#L5491)                        | Keep layout and shared defaults distinct from selection; define child override precedence.                               |
| [Collapsible and Accordion](../../../packages/ui/src/props.ts#L2784)          | Keep Collapsible and Accordion; distinguish expansion from surface visibility and type single/multiple expansion.        |
| [ClickableCard and SelectableCard](../../../packages/ui/src/props.ts#L5564)   | Keep reference-backed action/selection card names; share Card appearance and distinct activation versus selection.       |
| [Pressable](../../../packages/ui/src/props.ts#L428)                           | Keep the portable interaction primitive with a small typed activation event and separate gesture events.                 |
| [ToggleButton and ToggleButtonGroup](../../../packages/ui/src/props.ts#L5514) | Keep single/multiple group discrimination; align pressed/selection ownership and remove duplicate mutation callbacks.    |

## Forms

| Concept                                                                                           | Target public contract                                                                                                       |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| [CheckboxInput and Switch](../../../packages/ui/src/props.ts#L1382)                               | Preserve CheckboxInput/Switch; complete checked-state ownership and distinguish mixed appearance from submitted values.      |
| [Calendar and calendar hooks](../../../packages/ui/src/props.ts#L700)                             | Preserve the single/range union; use one validated calendar-date domain for values, constraints, and changes.                |
| [RadioList, CheckboxList, and SegmentedControl](../../../packages/ui/src/props.ts#L2852)          | Preserve RadioList/CheckboxList; share single-choice options, defaults, and orientation with SegmentedControl.               |
| [ComplexSelector](../../../packages/ui/src/props.ts#L3594)                                        | Keep the reference-backed component; expose named render state, consistent content styling, and explicit commit outcomes.    |
| [DateInput, TimeInput, DateTimeInput, and DateRangeInput](../../../packages/ui/src/props.ts#L602) | Use consistent clearing and local-date/time versus instant domains; choose one picker strategy with stated fallback.         |
| [Field, FieldGroup, and useFieldControl](../../../packages/ui/src/props.ts#L490)                  | Let Field own label/description/error associations; separate validation, required state, and appearance.                     |
| [FormLayout, InputGroup, and InputGroupText](../../../packages/ui/src/props.ts#L6848)             | Keep arrangement and grouped chrome separate from form state/submission; define group defaults and child overrides.          |
| [NumberInput](../../../packages/ui/src/props.ts#L3181)                                            | Represent an empty committed number explicitly; distinguish intermediate text, parse failure, bounds, and step behavior.     |
| [PinInput and InputRating](../../../packages/ui/src/props.ts#L3199)                               | Keep PIN strings and reference-backed names; define initialization, paste/character rules, rating steps, zero, and clearing. |
| [PowerSearch and its configuration](../../../packages/ui/src/props.ts#L5936)                      | Infer field/operator/value combinations from configuration; expose a typed ref and named change details.                     |
| [SearchInput](../../../packages/ui/src/props.ts#L568)                                             | Keep a text-input preset with the same state model; specify the submitted query and clearing behavior.                       |
| [Selector and MultiSelector](../../../packages/ui/src/props.ts#L3226)                             | Preserve Selector/MultiSelector; tie mode to exact scalar/array values and clearing types.                                   |
| [Slider](../../../packages/ui/src/props.ts#L1420)                                                 | Share numeric range/step semantics; expose initial state, accessible naming, and drag-versus-commit events.                  |
| [TextInput and TextArea](../../../packages/ui/src/props.ts#L517)                                  | Align TextInput/TextArea state, options, and typed refs; separate password behavior, keyboard hints, and validation.         |
| [Token and Tokenizer](../../../packages/ui/src/props.ts#L3460)                                    | Preserve Token/Tokenizer; align selected-value editing and activation, using named change details.                           |
| [Typeahead, BaseTypeahead, and TypeaheadItem](../../../packages/ui/src/props.ts#L3285)            | Preserve Typeahead; separate query and selection, hide internal coordination, and share request-scoped abortable search.     |

## Content

| Concept                                                                                              | Target public contract                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Avatar, AvatarGroup, and User](../../../packages/ui/src/props.ts#L3076)                             | Keep reference-backed identity display; separate visible fallback and accessible naming, with typed shared sizing/overflow.      |
| [Badge and Chip](../../../packages/ui/src/props.ts#L3039)                                            | Keep Badge passive; make chip activation, selection, and removal distinct with consistent appearance.                            |
| [Card](../../../packages/ui/src/props.ts#L3900)                                                      | Keep Card passive with typed variants and reusable header/footer/content anatomy.                                                |
| [Code, CodeBlock, and Blockquote](../../../packages/ui/src/props.ts#L6190)                           | Keep code display; separate syntax data and decoration, and expose copy success/failure and line-number semantics.               |
| [Divider and Skeleton](../../../packages/ui/src/props.ts#L3051)                                      | Keep display helpers; share bounded size/orientation contracts without owning loading state.                                     |
| [Alert, Banner, and EmptyState](../../../packages/ui/src/props.ts#L3882)                             | Share meaningful tones; make dismissal ownership explicit and keep EmptyState independent of fetching.                           |
| [Kbd](../../../packages/ui/src/props.ts#L3937)                                                       | Keep displayed keycaps distinct from registered shortcuts; type modifiers when displaying combinations.                          |
| [Markdown streaming helpers](../../../packages/ui/src/index.shared.ts#L27)                           | Offer one append/reset streaming parser with documented results; keep orchestration helpers private unless independently useful. |
| [Markdown, MarkdownScreen, and parsing](../../../packages/ui/src/props.ts#L6678)                     | Offer one text-or-document source, a readable versioned document format, and a documented screen composition.                    |
| [MetadataList and MetadataListItem](../../../packages/ui/src/props.ts#L6536)                         | Keep label/value pairs; distinguish visible labels from label-layout options and use consistent visible-item limits.             |
| [Outline and outline discovery](../../../packages/ui/src/props.ts#L6637)                             | Keep portable outline data primary; distinguish document derivation, DOM discovery, and native-view discovery.                   |
| [ProgressBar, Meter, Spinner, ProgressGroup, and StatusDot](../../../packages/ui/src/props.ts#L1406) | Separate actual meter semantics from task progress; type determinate/indeterminate states and accessible ranges.                 |
| [RichText and RichTextSpan](../../../packages/ui/src/props.ts#L401)                                  | Keep formatted display distinct from editing; require one span content source and define portable nesting/activation.            |
| [Syntax tokenization](../../../packages/ui/src/props.ts#L6226)                                       | Use explicit code-tokenization terminology and typed kinds/offsets; hide thresholds and CSS plumbing.                            |
| [Text and Heading](../../../packages/ui/src/props.ts#L372)                                           | Share typography across Text/time labels; keep Heading level semantic rather than tied to visual size.                           |
| [Thumbnail and Citation](../../../packages/ui/src/props.ts#L6587)                                    | Distinguish decorative, linked, and removable content; require useful citation identity and keyboard-accessible removal.         |
| [Timestamp and Timer](../../../packages/ui/src/props.ts#L6440)                                       | Use explicit epoch/duration units and eliminate numeric-magnitude inference.                                                     |

## Collections

| Concept                                                             | Target public contract                                                                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [GridList and useGridList](../../../packages/ui/src/props.ts#L6975) | Keep keyed selection and action distinct; constrain modes and content sources; make keyboard capability truthful.              |
| [Item, List, and ListItem](../../../packages/ui/src/props.ts#L3152) | Choose one reference-backed row anatomy; distinguish standalone content rows from list context without duplicate vocabularies. |
| [Table](../../../packages/ui/src/props.ts#L3811)                    | Preserve row generics and constrain columns/keys; promise only the tabular interactions actually supported.                    |
| [Timeline](../../../packages/ui/src/props.ts#L3839)                 | Keep passive timeline display with stable identity, shared content slots, and explicit time values.                            |
| [TreeList](../../../packages/ui/src/props.ts#L3858)                 | Preserve TreeList; control keyed expansion/selection and distinguish visual nodes from store wrappers.                         |
| [VirtualList](../../../packages/ui/src/props.ts#L1116)              | Share typed item identity/rendering; expose key/index scrolling, alignment, failure, and common test identifiers.              |

## Navigation

| Concept                                                                     | Target public contract                                                                                                                     |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [AppShell and MobileNav](../../../packages/ui/src/props.ts#L4852)           | Separate MobileNav options from rendered content; share open-state ownership and hide internal provider coordination.                      |
| [Breadcrumbs](../../../packages/ui/src/props.ts#L3667)                      | Support typed link destinations and explicit action alternatives; identify the current item.                                               |
| [CommandPalette](../../../packages/ui/src/props.ts#L3757)                   | Distinguish query, command identity, and activation; share abortable search and observable async failure.                                  |
| [Drawer](../../../packages/ui/src/props.ts#L1368)                           | Keep open-state ownership and panel slots explicit; distinguish modal focus/back ownership from persistent layout.                         |
| [NavIcon and heading menus](../../../packages/ui/src/props.ts#L4653)        | Reuse regular icon/menu contracts; expose only consumer-useful customization context.                                                      |
| [Link and NavLink](../../../packages/ui/src/props.ts#L2411)                 | Separate destinations from mutable route state; preserve browser links and specify external/internal URL handling.                         |
| [NavigationMenu](../../../packages/ui/src/props.ts#L3730)                   | Keep navigation destinations distinct from command menus; share link destinations and orientation.                                         |
| [Pagination and Stepper](../../../packages/ui/src/props.ts#L3692)           | Specify page numbering and empty counts; give reorderable steps stable identity.                                                           |
| [Route manifests and defineRoutes](../../../packages/ui/src/props.ts#L2497) | Keep defineRoutes as authoring; infer component/loader parameters, expose readonly derived metadata, and reject duplicates.                |
| [Routing and back navigation](../../../packages/ui/src/props.ts#L2349)      | Offer typed navigation destinations and scoped reactive router state; keep registration, host wiring, and interception lifecycle separate. |
| [SideNav and its parts](../../../packages/ui/src/props.ts#L5040)            | Keep navigation anatomy; use coherent collapsed-state ownership, separate sizing, and a normal typed ref.                                  |
| [Tabs, TabList, Tab, and TabMenu](../../../packages/ui/src/props.ts#L2323)  | Use stable selection keys; distinguish content panels from route navigation and preserve label/panel relationships.                        |
| [Toolbar and OverflowList](../../../packages/ui/src/props.ts#L4674)         | Keep toolbar slots; render overflow from named hidden-item data with explicit measurement ownership.                                       |
| [TopNav and its parts](../../../packages/ui/src/props.ts#L4883)             | Keep component anatomy; share action/link slots and expose only necessary customization hooks.                                             |
| [openWindow](../../../packages/ui/src/props.ts#L2699)                       | Separate app-content windows from external URL opening; use observable instance results and truthful payload support.                      |

## Overlays

| Concept                                                                                     | Target public contract                                                                                                                  |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [BottomSheet and its service](../../../packages/ui/src/props.ts#L1954)                      | Share declarative/service options, accessible naming, typed results, and bounded snap points; close an owned instance.                  |
| [Dialog, AlertDialog, and imperative dialog hooks](../../../packages/ui/src/props.ts#L2071) | Share declarative/imperative options and lifecycle; expose dismissal reasons, title/description associations, and confirmation failure. |
| [HoverCard, useHoverCard, and Tooltip](../../../packages/ui/src/props.ts#L1646)             | Share trigger/delay/open conventions; preserve noninteractive tooltip versus rich hover-card semantics and touch access.                |
| [DropdownMenu, ContextMenu, and MoreMenu](../../../packages/ui/src/props.ts#L2888)          | Use the existing precise item union; remove duplicate open/disabled aliases and redundant part vocabularies.                            |
| [Overlay](../../../packages/ui/src/props.ts#L1475)                                          | Expose a low-level layer with explicit backdrop/modality responsibilities; Dialog remains the complete modal path.                      |
| [Popover and useLayer](../../../packages/ui/src/props.ts#L1500)                             | Share typed anchors and positioning; distinguish anchored/fixed modes and avoid duplicate placement options.                            |
| [Toast, ToastViewport, showToast, and useToast](../../../packages/ui/src/props.ts#L1772)    | Use one content source, explicit duration/persistence, stable identity, dismiss/update handles, and viewport/collision ownership.       |

## Media

| Concept                                                                        | Target public contract                                                                                                |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [CameraView on the macOS root](../../../packages/ui/src/index.macos.ts#L249)   | Remove the unsupported macOS root placeholder; camera support belongs to its feature package and capability contract. |
| [Carousel, Lightbox, and useLightbox](../../../packages/ui/src/props.ts#L2188) | Keep gallery concepts; align item/index selection and open-state contracts with explicit playback/zoom support.       |
| [Image](../../../packages/ui/src/props.ts#L1284)                               | Type URI/responsive sources and units; distinguish decorative images from named content and bound positioning.        |
| [WebView](../../../packages/ui/src/props.ts#L1147)                             | Require URI or HTML exclusively; expose a portable handle and target-specific policy guarantees.                      |

## Chat

| Concept                                                                                  | Target public contract                                                                                                                |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [ChatComposer and composer controls](../../../packages/ui/src/props.ts#L4303)            | Separate draft editing from send/cancel state; specify success clearing, failure retention, and custom-slot context.                  |
| [Speech recognition and chat dictation](../../../packages/ui/src/props.ts#L4564)         | Keep explicit capability reporting; expose async permission/start failures and isolate host audio integration.                        |
| [ChatLayout, ChatMessageList, and scroll hooks](../../../packages/ui/src/props.ts#L4099) | Use the shared scroll controller; expose following-latest state, user interruption, and unread-count/reset behavior.                  |
| [Chat messages and message parts](../../../packages/ui/src/props.ts#L4019)               | Separate sender identity, visual grouping, and delivery state with stable message IDs and reusable metadata slots.                    |
| [Composer tokens, triggers, and paste hooks](../../../packages/ui/src/props.ts#L4213)    | Round-trip one serializable text/token draft with stable IDs; share search and named paste outcomes.                                  |
| [ChatToolCalls](../../../packages/ui/src/props.ts#L4123)                                 | Require stable tool-call IDs and typed execution states; separate backend data from rendered results and use explicit duration units. |

## Styling

| Concept                                                                                 | Target public contract                                                                                                               |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [useAnimation, setTranslate, and gesture events](../../../packages/ui/src/props.ts#L11) | Expose typed animated values/properties, coordinate/velocity/time units, and observable sequence completion/cancellation.            |
| [Icon and icon registration](../../../packages/ui/src/props.ts#L1434)                   | Type registered names and meaningful/decorative accessibility; specify registry scope and late-registration effects.                 |
| [Selection indicators and their registry](../../../packages/ui/src/props.ts#L7025)      | Keep the typed decorative registry; make hook reads reactive or expose an explicitly nonreactive boot-only contract.                 |
| [styled](../../../packages/ui/src/internal/layout/styled.web.tsrx#L5)                                   | Provide typed enumerated variants/defaults or clearly expose the narrower boolean-class contract.                                    |
| [Theme preference and color scheme](../../../packages/ui/src/theme/theme-scheme.ts#L5)  | Distinguish system appearance, preference, and resolved app scheme; publish reactive preference types and separate root integration. |

## Data and state

| Concept                                                                       | Target public contract                                                                                                                   |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [useAsyncList](../../../packages/ui/src/data/async-list.ts#L59)                    | Expose awaitable operations, errors, cancellation/cleanup, pagination readiness, and stale-result/concurrency behavior.                  |
| [useListData and useTreeData](../../../packages/ui/src/data/list-data.ts#L12)      | Keep familiar operations with readonly snapshots, shared key/selection types, and explicit initial-only values.                          |
| [cachedQuery$ and query storage](../../../packages/ui/src/data/query-cache.ts#L55) | Separate cache versus signal identity and request/account ownership; define invalidation, persistence units/version/scope, and failures. |
| [createStore and useStore](../../../packages/ui/src/data/store.ts#L16)             | Keep explicit stores/reactive reads; separate value assignment and updates and define selector equality.                                 |

## Accessibility

| Concept                                                                   | Target public contract                                                                                            |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Focus hooks](../../../packages/ui/src/internal/accessibility/use-focus.tsrx#L1)                 | Provide actual subtree entry/exit semantics and typed modality/events, or expose the supported subset explicitly. |
| [FocusScope](../../../packages/ui/src/props.ts#L6789)                     | Provide containment/autofocus/restoration where accepted; expose unsupported required behavior before use.        |
| [VisuallyHidden and useLandmark](../../../packages/ui/src/props.ts#L6771) | Keep visually hidden content accessible; separate landmark semantics from optional region-cycling behavior.       |

## Utilities

| Concept                                                                           | Target public contract                                                                                                    |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [bottomSheetHost on the macOS root](../../../packages/ui/src/index.macos.ts#L389) | Remove accidental macOS root lookup; host lifecycle belongs to explicit NativeScript integration.                         |
| [copyText and useClipboard](../../../packages/ui/src/internal/platform/use-clipboard.tsrx#L1)         | Keep text-specific operations with observable read/copy results; richer formats need a separate exact contract.           |
| [useKeyboard](../../../packages/ui/src/internal/keyboard/use-keyboard.ts#L1)                        | Expose normalized key/code/modifier/composition events and supported attachments; keep software-keyboard insets separate. |
| [isNative](../../../packages/ui/src/internal/platform/platform.ts#L1)                               | Expose genuine OS identity and behavior capabilities rather than using one native boolean for all choices.                |
| [Ref helpers and mergeProps](../../../packages/ui/src/internal/accessibility/ref-list.ts#L1)             | Expose typed ref merging and exact prop-composition order, cancellation, classes, styles, and ref preservation.           |

## iOS

| Concept                                                                       | Target public contract                                                                                                      |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [iOS controls](../../../packages/ui/src/ios/index.ts#L7)                      | Keep OS widget names; export widget-specific types and honor or narrow every advertised state prop.                         |
| [iOS Icon selector and modifier](../../../packages/ui/src/ios/icon.ios.ts#L1) | Distinguish icon-selection helpers from the root component; type known modifiers and bound unsafe host writes.              |
| [LiquidGlass and LiquidGlassContainer](../../../packages/ui/src/props.ts#L94) | Keep the iOS-only effect explicit with capability/fallback and duration units; consolidate effect configuration.            |
| [UITableView](../../../packages/ui/src/ios/index.ts#L10)                      | Keep UITableView with matching props/handle types and shared item identity, rendering, scrolling, viewability, and refresh. |
| [UIModal and openModal](../../../packages/ui/src/ios/index.ts#L13)            | Keep native presentation distinct; share accessible naming, typed instance results, focus, and close lifecycle.             |
| [UITabBar and SideDrawer](../../../packages/ui/src/ios/index.ts#L11)          | Keep UITabBar/SideDrawer with widget-specific types, stable keys, coherent open state, and explicit stack hosting.          |

## Android

| Concept                                                                                   | Target public contract                                                                                                     |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Android controls](../../../packages/ui/src/android/index.ts#L7)                          | Keep OS widget names; export widget-specific types and honor or narrow every advertised state prop.                        |
| [Android Icon selector and modifier](../../../packages/ui/src/android/icon.android.ts#L1) | Distinguish drawable selection from the root component; share typed modifiers while bounding unsafe writes.                |
| [RecyclerView](../../../packages/ui/src/android/index.ts#L10)                             | Keep RecyclerView with matching props/handle types and shared collection contracts; expose recycling-specific differences. |
| [MaterialDialog and openModal](../../../packages/ui/src/android/index.ts#L13)             | Keep MaterialDialog with matching types and shared confirmation/cancel/result semantics on owned instances.                |
| [BottomNavigationView and DrawerLayout](../../../packages/ui/src/android/index.ts#L11)    | Keep BottomNavigationView/DrawerLayout with matching types, stable selection, and explicit OS gestures.                    |

## NativeScript integration

| Concept                                                                            | Target public contract                                                                                                    |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| [NativeScript host integration](../../../packages/ui/src/nativescript/index.ts#L1) | Give NativeScript host integration an explicit home, typed handles, and lifecycle; exclude it from normal app navigation. |

## Web integration

| Concept                                                                  | Target public contract                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [Web compatibility entrypoint](../../../packages/ui/src/web/index.ts#L1) | Root owns portable HoverCard/Tooltip; reserve web for actual DOM contracts and deprecate redundant import aliases. |

## Stylesheets

| Concept                                                               | Target public contract                                                                                              |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [Theme stylesheet entrypoints](../../../packages/ui/package.json#L90) | Export exactly the supported tokens/chrome CSS paths in development and publish maps; state inclusion requirements. |

## Completeness and limits

This map covers all 126 audited concepts. The source export inventory was rechecked on 2026-10-14: 341 root values and 661 named root types across conditions, plus 12 values/26 types at `/ios`, 10/23 at `/android`, 5/0 at `/native`, and 2/2 at `/web`. Every inventoried value had a concept owner before the detailed indexes were removed. Internal or redundant exports may disappear; coverage means they have an intentional destination or removal, not a promise to preserve every symbol.

The source audit supplies design evidence, not proof of runtime parity or agent performance. The principles and priority list carry the design reasoning; improvements should be evaluated with the representative tasks in [principles](principles.md#applying-these-principles). Implementation and a measured comparison are separate work.

[Prioritized changes](recommended-changes.md) · [Principles](principles.md) · [Audit index](README.md)
