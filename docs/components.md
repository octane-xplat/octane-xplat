# Component index

> Components exported by `@octane-xplat/ui`, grouped by job.

This is a lookup page; you don't need to learn the whole list. A component
is a reusable screen piece, and **props** are the options you give it.
Start with [building a small screen](primitives.md#a-practical-example) if
you haven't used components yet.

Guides with examples live elsewhere: [primitives](primitives.md) for
layout/composition, [navigation](navigation.md) for routes and stacks,
[navigation shells and workspace controls](navigation-ui.md) for responsive
navigation, tab strips, overflow, and resizing,
[styling](styling.md) for className/style, [platform services](platform-services.md)
for device APIs. Platform-authentic widgets (no parity promised) live behind
`@octane-xplat/ui/ios`, `/android`, and `/web` — see
[primitives](primitives.md#the-components-you-reach-for-first).
`KeyboardAvoiding` is available from every root entry. It adjusts around the
software keyboard on iOS and Android; web, Linux, macOS, and Windows keep a
neutral column wrapper.

Most components accept `className`/`style`/`id` plus the platform escape props
(`ios`, `android`, `web`) applied after shared props. `VisuallyHidden`
intentionally omits styling props so hidden content cannot be accidentally
made visible through component styling.

Some names follow the Astryx component library. Options and platform support
can change as Xplat develops; check the guide for a component you rely on.
The content-display family and its platform limits are covered in
[Content display](content-display.md).

Some browser and native details have no exact match: `Stack as` selects an
HTML tag only on web, and native scrollable stacks wrap their flex content in
a `ScrollView`. `Center isInline` is web-only. `FormLayout`'s horizontal
label mode uses a shared label column and a 480px collapse on web; native
renders each field as its own label/control row. Native `AspectRatio` derives
height from the measured width in one layout pass. Native `VisuallyHidden`
uses a 1dip transparent container, so screen-reader exposure is best-effort.
Content `List` is rendered in full; it has no native list role and draws
markers/dividers in its leaf. `List.edgeCompensation="inline"` adjusts row
insets from container tokens on web only.

## Layout

| Component          | What it is                                                                                 | Key props                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `View`             | Base container                                                                             |                                                                           |
| `Stack`            | Flow flex container; vertical by default                                                   | `direction`, `hAlign`, `vAlign`, `gap`, `padding`, `wrap`, `isScrollable` |
| `HStack`           | Horizontal `Stack`                                                                         | `hAlign`, `vAlign`, `gap`                                                 |
| `VStack`           | Vertical `Stack`                                                                           | `hAlign`, `vAlign`, `gap`                                                 |
| `StackItem`        | Child sizing/alignment override in `Stack`                                                 | `size`, `crossAlignSelf`, `isScrollable`                                  |
| `Grid`             | Grid container                                                                             |                                                                           |
| `Absolute`         | Absolutely-positioned layer                                                                |                                                                           |
| `Center`           | Centers children on one or both axes                                                       | `axis`, `isInline`                                                        |
| `Section`          | Banded content with padding and dividers                                                   | `variant`, `dividers`, `padding`                                          |
| `AspectRatio`      | Constrains child box to a width/height ratio                                               | `ratio`, `shape`, `fit`                                                   |
| `VisuallyHidden`   | Keeps content available to assistive technology                                            | `as` (web tag)                                                            |
| `Spacer`           | Flexible gap filler                                                                        |                                                                           |
| `SafeArea`         | Insets-aware container                                                                     |                                                                           |
| `KeyboardAvoiding` | Shifts content above the keyboard on iOS/Android; keeps a neutral column wrapper elsewhere |                                                                           |

## Text

| Component                  | What it is                                  | Key props       |
| -------------------------- | ------------------------------------------- | --------------- |
| `Text`                     | Text block                                  |                 |
| `RichText`, `RichTextSpan` | Inline styled/linked spans inside one block |                 |
| `Heading`                  | Section heading (shared typography)         |                 |
| `Kbd`                      | Keyboard-key glyph (⌘K styling hook)        |                 |
| `Link`, `NavLink`          | Route navigation as text                    | `href`, `route` |
| [`Markdown`](content-display.md#markdown-documents) | Markdown doc — baked AST or runtime text, streaming-ready | `data`, `text`, `isStreaming`, `fadeIn` |

## Inputs

Field controls share `label`, `description`, `isDisabled`, `isReadOnly`,
`isRequired`, `isOptional`, `size`, `status`, and `isLoading`. Labels are
optional on controls so they can be composed inside `Field`; `Field` renders
the visible label and description before its child and the status message
after it, and connects those texts to the child control. Use `inputID` when a
specific control ID is needed for the label's `htmlFor`; otherwise the child
uses the field's accessible label relationship. `isRequired` and
`isOptional` are mutually exclusive. `isLoading` reports busy work without
disabling edits by itself. `status` uses `{ type: 'warning' | 'error' |
'success', message?: string }`. `hasClear` is available where clearing is part
of the control, including `TextInput`, `SearchInput`, and `Selector`.

`FormLayout` arranges fields; it is not an HTML `<form>` and does not submit.
`InputGroup` gives joined prefixes/suffixes and the input one visible label.
Its `size` and disabled state flow to member controls. On web, the group uses
`role="group"` and its label; NativeScript renders a grouped row without a
matching accessibility group role.

| Component                                               | What it is                                                       | Key props                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `TextInput`, `TextArea`                                 | One- and multi-line text entry                                   | `value`, `onChange`, `label`, `description`                                  |
| `SearchInput`                                           | Search field with clear button                                   | `value`, `onSubmit`, `hasClear`, `onClear`                                   |
| `FormLayout`                                            | Arranges labeled fields                                          | `direction`, `defaultOptionality`                                            |
| `InputGroup`, `InputGroupText`                          | Joins a labeled control with prefix/suffix text                  | `label`, `size`                                                              |
| `PowerSearch`                                           | Structured field/operator/value filters                          | `config`, `filters`, `onChange`, `components`                                |
| `Button`                                                | Labeled action                                                   | `label`, `variant`, `size`, `isDisabled`, `isLoading`, `clickAction`, `href` |
| `IconButton`                                            | Icon-only named action                                           | `icon`, `label`, `variant`, `size`                                           |
| `ButtonGroup`                                           | Connected action row                                             | `label`, `orientation`, `size`, `isDisabled`                                 |
| `ToggleButton`, `ToggleButtonGroup`                     | Pressed action and toggle group                                  | `isPressed`, `value`, `onChange`, `type`                                     |
| `ClickableCard`, `SelectableCard`                       | Action/navigation card or controlled selection                   | `label`, `href`, `isSelected`, `onChange`                                    |
| `MoreMenu`                                              | Icon-only overflow menu                                          | `items`, `label`, `placement`, `alignment`                                   |
| `DateInput`, `TimeInput`                                | ISO date or wall-clock time fields with adaptive picker surfaces | `value`, `onChange`, `min`, `max`, `presentation`                            |
| `DateTimeInput`                                         | Combined ISO local date-time field                               | `value`, `onChange`, `min`, `max`, `presentation`                            |
| `Calendar`                                              | Single-date or inclusive range calendar                          | `mode`, `value`, `numberOfMonths`, `dateConstraints`                         |
| `DateRangeInput`                                        | Labeled range trigger with calendar and presets                  | `value`, `onChange`, `presets`, `minRangeSpan`, `maxRangeSpan`               |
| `FileInput`                                             | `@octane-xplat/files` picker with input and dropzone modes       | `value`, `onChange`, `accept`, `isMultiple`, `maxSize`                       |
| `Switch`                                                | On/off toggle (self-drawn)                                       | `checked`, `onCheckedChange`, `isDisabled`                                   |
| `CheckboxInput`                                         | Self-drawn checkbox                                              | `checked`, `onCheckedChange`, `isDisabled`                                   |
| `CheckboxIndicator`, `CheckIndicator`, `RadioIndicator` | Decorative selection marks                                       | `state`, `size`, `isDisabled`                                                |
| `CheckboxList`                                          | Self-drawn multi-select list                                     | `options`, `onValueChange`, `isDisabled`                                     |
| `RadioList`                                             | Self-drawn radio options                                         | `options`, `value`, `onValueChange`, `isDisabled`                            |
| `SegmentedControl`                                      | Inline option segments                                           | `options`, `value`, `onValueChange`, `isDisabled`                            |
| `Slider`                                                | Value scrubber (self-drawn)                                      | `value`, `minValue`, `maxValue`, `onValueChange`                             |
| `Selector`                                              | Single-option picker                                             | `options`, `value`, `searchable`, `isDisabled`                               |
| `MultiSelector`                                         | Multiple-option picker                                           | `options`, `value`, `searchable`, `isDisabled`                               |
| `Typeahead`                                             | Searchable single selection field                                | `searchSource`, `value`, `onChange`, `hasEntriesOnFocus`                     |
| `Tokenizer`                                             | Searchable multi-selection token field                           | `searchSource`, `value`, `onChange`, `hasCreate`                             |
| `Token`                                                 | Removable or interactive entity chip                             | `label`, `color`, `onRemove`, `onClick`, `href`                              |
| `ComplexSelector`                                       | Field trigger with a custom anchored picker surface              | `value`, `children`, `changeAction`, `variant`                               |
| `NumberInput`                                           | Numeric entry with bounds                                        | `value`, `min`, `max`, `step`, `onValueChange`                               |
| `PinInput`                                              | Fixed-length code/PIN entry                                      | `length`, `onValueChange`, `onComplete`, `secure`                            |

| `InputRating` | Tappable 1..max rating row | `value`, `max`, `icon`, `onValueChange` |
| `Chip` | Selectable/removable chip | `selected`, `onSelect`, `onRemove` |
| `Field`, `FieldGroup` | Labeled field wrapper / labeled field group | `label`, `description`, `inputID`, `isRequired`, `isOptional`, `status` |
| `Item` | Settings-style row | `title`, `supportingText`, `leading`, `trailing`, `onPress` |

Date controls use portable ISO strings: `YYYY-MM-DD`, `HH:MM[:SS]`, and
`YYYY-MM-DDTHH:MM[:SS]`. Date-time strings have no timezone suffix; they
represent local wall-clock values. `presentation="native"` uses the browser
input on web and the shared calendar/time sheet on iOS and Android. Choose
`bottom-sheet`, `popover`, or adaptive presentations when the surface should
stay consistent across targets. `DateRangeInput` uses `{start, end}` ISO dates
or `null`. See the [date and file entry guide](date-picker.md) for full
contracts and the native picker package boundary.

`FileInput` is exported by `@octane-xplat/files`, which depends on
`@octane-xplat/ui` for its field presentation. It uses portable
`{name, uri, size?, mimeType?}` references because browser `File` objects do
not exist on native targets. On web the optional `file` property retains the
browser object for upload APIs. The package opens the platform picker by
default, including multi-file selection on iOS and Android; no app-level
picker registration is needed. Web uses the browser chooser and supports drag
and drop in `mode="dropzone"`. See the [date and file entry guide](date-picker.md)
for platform details and AppKit file-access limits.

## Content

| Component        | What it is                                         | Key props                                              |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------ |
| `Card`           | Container with header/footer slots                 | `header`, `footer`                                     |
| `ClickableCard`  | Named action or link surface                       | `label`, `onPress`, `href`, `isDisabled`               |
| `SelectableCard` | Controlled checked card                            | `label`, `isSelected`, `onChange`                      |
| `Alert`          | Inline callout                                     | `tone`, `icon`, `title`                                |
| `Banner`         | Notice strip with optional dismiss                 | `icon`, `onDismiss`                                    |
| `EmptyState`     | Empty-state block (icon + title + actions)         | `icon`, `title`, `description`                         |
| `Badge`          | Inline label chip                                  |                                                        |
| `Avatar`         | Circular image with text fallback                  | `src`, `fallback`, `size`                              |
| `AvatarGroup`    | Overlapping avatar row with `+N` overflow          | `max`, `size`                                          |
| `User`           | Avatar + name/description row                      | `name`, `description`, `src`, `onSelect`               |
| `Icon`           | Registered icon glyph                              | `name`, `size`, `color`                                |
| `Image`          | Image                                              | `src`, `alt`                                           |
| `Thumbnail`      | Square image preview with optional remove action   | `src`, `alt`, `isLoading`, `onPress`, `onRemove`       |
| `Blockquote`     | Quoted content with optional attribution           | `cite`                                                 |
| `Code`           | Inline monospace text                              | `color`, `size`                                        |
| `CodeBlock`      | Syntax-colored code with copy and collapse actions | `code`, `language`, `hasLineNumbers`, `highlightLines` |
| `Citation`       | Source label or numbered source link               | `source`, `number`, `variant`                          |
| `Skeleton`       | Loading placeholder block                          | `width`, `height`                                      |
| `Divider`        | Hairline rule                                      | `orientation`                                          |

Indicators draw the selection mark; the owning control keeps focus,
interaction, and accessibility semantics. `registerIndicator` and
`registerIndicators` replace named marks for subsequent lookups on each
target.

## Disclosure & navigation

| Component                                  | What it is                                               | Key props                                                 |
| ------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------- |
| `Collapsible`                              | Show/hide a region                                       | `trigger`, `open`, `onOpenChange`                         |
| `Accordion`                                | List of expanding items                                  | `items`, `multiple`, `open`, `onOpenChange`               |
| `Tabs`                                     | Route-stack switcher with tab panes                      | `tabs`, `selectedIndex`, `onSelectedIndexChanged`         |
| `TabList`, `Tab`, `TabMenu`                | Navigation strip or controlled tab strip + overflow menu | `value`, `onChange`, `role`, `href`, `isDisabled`         |
| `AppShell`                                 | Top, side, and mobile navigation frame                   | `topNav`, `sideNav`, `banner`, `mobileNav`                |
| `TopNav`, `TopNavHeading`, `TopNavItem`    | Top navigation bar and items                             | `heading`, `startContent`, `endContent`, `href`           |
| `SideNav`, `SideNavSection`, `SideNavItem` | Collapsible side rail with grouped items                 | `collapsible`, `resizable`, `isSelected`                  |
| `MobileNav`, `MobileNavToggle`             | Mobile navigation drawer and toggle                      | `isOpen`, `onOpenChange`, `side`, `width`                 |
| `NavIcon`                                  | Circular icon container for navigation                   | `icon`                                                    |
| `NavHeadingMenu`, `NavHeadingMenuItem`     | Keyboard-operable heading menu                           | `label`, `description`, `href`, `isDisabled`              |
| `Toolbar`                                  | Labeled action row with start/center/end slots           | `label`, `orientation`, `dividers`                        |
| `OverflowList`                             | Responsive list that collapses excess items              | `overflowRenderer`, `maxVisibleItems`, `onOverflowChange` |
| `useResizable`, `ResizeHandle`             | Bounded, optionally persistent panel resizing            | `defaultSize`, `minSize`, `maxSize`, `autoSaveId`         |
| `Breadcrumbs`                              | Ancestor path trail                                      | `items`, `separator`                                      |
| `Pagination`                               | Prev/next + windowed page buttons                        | `page`, `pageCount`, `onPageChange`                       |
| `Stepper`                                  | Multi-step progress/flow control                         | `steps`, `current`, `onStepChange`                        |
| `NavigationMenu`                           | Simple item-array navigation strip                       | `items`, `horizontal`, `href`                             |
| [`CommandPalette`](command-palette.md)     | Searchable commands; mobile search sheet                 | `open`, `items` / `searchSource`, `searchMode`, `onValueChange` |
| `DropdownMenu`                             | Anchored action menu                                     | `trigger`, `items`, `placement`                           |
| `ContextMenu`                              | Secondary-press action menu                              | `items`, `open`, `onOpenChange`                           |

`Tabs` hosts named route stacks from `TabSpec`; `TabList` is the smaller
navigation or page-tab strip for caller-owned content. Use `TabList` without
`role="tablist"` for navigation links; add that role when it controls
caller-owned panels. `AppShell` changes the side navigation to a mobile drawer
below its configured breakpoint. The
[navigation shell guide](navigation-ui.md) covers composition, portable
boundaries, overflow, and resizing.

## Data display

| Component                          | What it is                                   | Key props                                                               |
| ---------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `List`                             | Non-virtual content list                     | `listStyle`, `density`, `hasDividers`, `start`                          |
| `ListItem`                         | Labeled row inside `List`                    | `label`, `description`, `startContent`, `endContent`, `onPress`, `href` |
| `Table`                            | Columnar rows                                | `columns`, `rows`, `renderCell`, `onRowPress`                           |
| `TreeList`                         | Expandable node hierarchy                    | `nodes`, `defaultExpanded`, `onToggle`, `onSelect`                      |
| `Timeline`                         | Vertical event list (dot + connector)        | `items`                                                                 |
| `ProgressGroup`                    | Stacked labeled `Meter` rows                 | `items`                                                                 |
| `Meter`                            | Gauge/dash ring                              | `value`, `max`, `strokeWidth`                                           |
| `ProgressBar`                      | Linear determinate or indeterminate progress | `value`, `max`, `label`, `marks`                                        |
| `MetadataList`, `MetadataListItem` | Aligned label/value details                  | `columns`, `labelPosition`, `label`, `children`                         |
| `StatusDot`                        | Accessible colored status signal             | `variant`, `label`, `isPulsing`, `tooltip`                              |
| `Timestamp`                        | Localized relative or absolute instant       | `value`, `format`, `isLive`, `hasTooltip`                               |
| `Timer`                            | Live elapsed duration                        | `startTime`, `format`, `type`, `size`                                   |
| `Outline`                          | Navigable heading outline                    | `items`, `activeId`, `hasScrollOnClick`                                 |
| `Spinner`                          | Self-drawn loading indicator                 |                                                                         |

## Scrolling

| Component                        | What it is                                      | Key props                             |
| -------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `ScrollableArea`                 | Scrollable region with optional pull-to-refresh | `axis`, `refreshing`, `onRefresh`     |
| [`VirtualList`](virtual-list.md) | Windowed long list                              | `items`, `keyExtractor`, `renderItem` |

## Chat

The Chat family provides a docked composer and composable message rows. Start
with [`ChatLayout`](../recipes/chat-conversation.md) for a complete conversation
or combine `ChatMessageList`, `ChatMessage`, and `ChatMessageBubble` inside an
existing scroll surface.

| Component                                                                                                                               | What it is                                                            | Key props                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| `ChatLayout`, `ChatLayoutScrollButton`                                                                                                  | Scrollable conversation, docked composer, and return-to-bottom action | `composer`, `emptyState`, `scrollRef`, `density`              |
| `ChatMessageList`                                                                                                                       | Density-aware message column with empty state and load-older callback | `density`, `gap`, `align`, `scrollToTopAction`, `isStreaming` |
| `ChatMessage`, `ChatMessageBubble`                                                                                                      | Sender alignment/context and filled or ghost bubble                   | `sender`, `name`, `avatar`, `variant`, `group`, `metadata`    |
| `ChatMessageMetadata`, `ChatSystemMessage`                                                                                              | Timestamp/status row and centered conversation notices                | `timestamp`, `status`, `variant`, `icon`                      |
| `ChatToolCalls`, `ChatTokenizedText`                                                                                                    | Expandable tool-call summary and token-aware message text             | `calls`, `isExpanded`, `tokens`                               |
| `ChatComposer`, `ChatComposerInput`, `ChatComposerDrawer`                                                                               | Composer shell, rich input, and collapsible context/attachment region | `onSubmit`, `value`, `triggers`, `onFiles`, `count`           |
| `ChatSendButton`, `ChatDictationButton`                                                                                                 | Send/stop action and speech input control                             | `isStopShown`, `isDisabled`, `onSend`, `onStop`               |
| `useChatStreamScroll`, `useChatNewMessages`, `useChatPasteAsToken`, `useChatComposerTokens`, `useSpeechRecognition`, `useChatDictation` | Hooks for streaming, new messages, tokens, and dictation              | See each hook's TSDoc                                         |

`ChatComposerInput.ref` delivers a portable imperative handle because React
refs do not cross this renderer boundary. Key and paste callbacks expose
portable event records; their `native` member carries a browser event only on
web. `ChatComposerFile` exposes name, MIME type, size, and the original browser
`File` in `native`; file delivery is web-only. Web token chips are inline in
the contenteditable field. Native input uses a text field with a token row,
and mid-text token placement is approximate. Native has no browser paste or
file-drop event, and native speech recognition reports unsupported. Top-load
detection uses an `IntersectionObserver` sentinel on web and a scroll-position
check on native. New-message tracking uses `ResizeObserver` on web and
`layoutChanged` on native. The Linux entry uses the web leaves; the AppKit
entry exports the Chat family through its shared implementation and uses the
native text-input behavior.
Windows resolves the shared `index.ts` through its app TypeScript mapping;
its Chat runtime has not been exercised separately.

## Overlays

| Component                 | What it is                                        | Key props                                                         |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `Overlay`                 | Content above the screen                          |                                                                   |
| `Popover`                 | Anchored floating content                         | `anchor`, `open`, `placement`, `alignment`, `offset`, `onDismiss` |
| `useLayer`                | Anchored/fixed overlay primitive (hook)           | `mode`, `ref`, `show`, `hide`, `isOpen`, `render`                 |
| `Tooltip`                 | Pointer hover hint                                | `trigger`, `content`, `openDelay`                                 |
| `HoverCard`               | Hover or touch-triggered card around its children | `content`, `placement`, `delay`, `touchTrigger`                   |
| `Dialog`                  | Modal surface with optional header                | `isOpen`, `onOpenChange`, `purpose`, `position`                   |
| `AlertDialog`             | Required-action confirmation dialog               | `title`, `description`, `actionLabel`, `onAction`                 |
| `BottomSheet`             | Declarative in-window bottom sheet                | `isOpen`, `snapPoints`, `onOpenChange`                            |
| `Carousel`                | Horizontally scrolling child slides               | `children`, `gap`, `hasButtons`, `hasSnap`, `ref`                  |
| `Lightbox`                | Fullscreen image or video gallery                 | `media`, `isOpen`, `index`, `onIndexChange`                       |
| `Toast` / `ToastViewport` | Transient notification card and stack             | `showToast`, `useToast`, `position`, `maxVisible`                 |
| `Drawer`                  | Edge drawer                                       | `main`, `drawer`, `open`, `onDismiss`                             |

Use `Dialog` for optional or informational modal content and `AlertDialog` when
the user must choose an action. `BottomSheet` is the shared in-window surface;
the platform-native `@octane-xplat/sheet` package remains a separate API.
`showToast(options)` presents a transient toast, while `useToast()` targets the
nearest `ToastViewport` or the fallback viewport. Modal content can render on a
separate native root, so pass its data as props instead of depending on
presenter context. `openWindow` opens a host window where supported; modal
routing shares the navigation layer — see [navigation](navigation.md).

On macOS, `Dialog`, `AlertDialog`, `BottomSheet`, and `Lightbox` render inline
because the AppKit host has no shared in-window layer service. `ToastViewport`
provides context but does not mount a macOS toast stack; the standalone
`Toast` card is available. `Lightbox` shows alt text for video because the
player is provided by the separate `@octane-xplat/video` package. macOS
`Carousel` is a basic horizontal scroller without navigation buttons, looping,
edge fades, or a `CarouselHandle`; `ScrollableArea` ignores pull-to-refresh and
uses block scrolling for `axis="both"`.

## Leaf packages

Features that need a NativeScript plugin ship as their own
packages so `@octane-xplat/ui` keeps zero required plugin deps:

| Package                 | Exports                                                              | What it is                                |
| ----------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| `@octane-xplat/pager`   | `Pager`                                                              | Full-page swipe container                 |
| `@octane-xplat/camera`  | `CameraView`                                                         | Live camera preview                       |
| `@octane-xplat/video`   | `Video`                                                              | Embedded video player                     |
| `@octane-xplat/gif`     | `AnimatedImage`                                                      | Animated images (GIF/webp)                |
| `@octane-xplat/canvas`  | `Canvas`, `getGPU`                                                   | Canvas/GPU surface (2D, WebGL/WebGPU)     |
| `@octane-xplat/audio`   | `createAudioPlayer`                                                  | Long-form audio playback                  |
| `@octane-xplat/haptics` | `createHaptics`                                                      | Capability-aware haptics                  |
| `@octane-xplat/sounds`  | `createSoundBank`                                                    | Short UI sound effects                    |
| `@octane-xplat/effects` | `ShaderEffect` (`/ios`, `/android` only)                             | View-effect shaders (Metal stitch / AGSL) |
| `@octane-xplat/auth`    | `appleAuth`, `googleAuth`, `AppleSignInButton`, `GoogleSignInButton` | Provider sign-in (Apple / Google SDKs)    |

See [search, select, and token entry](search-selection.md) for `SearchSource`, `Typeahead`, `Tokenizer`, `Token`, and `ComplexSelector` workflows and platform limits.
