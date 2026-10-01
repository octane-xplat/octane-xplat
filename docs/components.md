# Component index

> Components exported by `@octane-xplat/ui`, grouped by job.

Guides for the mechanics live elsewhere: [primitives](primitives.md) for
layout/composition, [navigation](navigation.md) for routes and stacks,
[styling](styling.md) for className/style, [platform services](platform-services.md)
for device APIs. Platform-authentic widgets (no parity promised) live behind
`@octane-xplat/ui/ios`, `/android`, and `/web` — see
[primitives](primitives.md#the-components-you-reach-for-first).
`KeyboardAvoiding` is available from every root entry. It adjusts around the
software keyboard on iOS and Android; web, Linux, macOS, and Windows keep a
neutral column wrapper.

Every component accepts `className`/`style`/`id` plus the platform escape props
(`ios`, `android`, `web`) applied after shared props.

Component names follow the Astryx catalog where the concepts overlap. Prop
contracts continue to be documented here as cross-platform parity work lands.
The content-display family and its platform limits are covered in
[Content display](content-display.md).

## Layout

| Component          | What it is                                                                                 | Key props |
| ------------------ | ------------------------------------------------------------------------------------------ | --------- |
| `View`             | Base container                                                                             |           |
| `HStack`              | Horizontal flex container                                                                  |           |
| `VStack`           | `View` alias for vertical stacks                                                           |           |
| `Grid`             | Grid container                                                                             |           |
| `Stack`            | Stacked container                                                                          |           |
| `Absolute`         | Absolutely-positioned layer                                                                |           |
| `Spacer`           | Flexible gap filler                                                                        |           |
| `SafeArea`         | Insets-aware container                                                                     |           |
| `KeyboardAvoiding` | Shifts content above the keyboard on iOS/Android; keeps a neutral column wrapper elsewhere |           |

## Text

| Component                  | What it is                                  | Key props       |
| -------------------------- | ------------------------------------------- | --------------- |
| `Text`                     | Text block                                  |                 |
| `RichText`, `RichTextSpan` | Inline styled/linked spans inside one block |                 |
| `Heading`                  | Section heading (shared typography)         |                 |
| `Kbd`                      | Keyboard-key glyph (⌘K styling hook)        |                 |
| `Link`, `NavLink`          | Route navigation as text                    | `href`, `route` |

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

| Component                            | What it is                                       | Key props                                                   |
| ------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------- |
| `TextInput`, `TextArea`              | One- and multi-line text entry                   | `value`, `onChange`, `label`, `description`                 |
| `SearchInput`                        | Search field with clear button                   | `value`, `onSubmit`, `hasClear`, `onClear`                  |
| `Button`                             | Action button                                    | `loading`, `leading`, `trailing`                            |
| `Switch`                             | On/off toggle (self-drawn)                       | `checked`, `onCheckedChange`, `isDisabled`                  |
| `CheckboxInput`                     | Self-drawn checkbox                              | `checked`, `onCheckedChange`, `isDisabled`                  |
| `CheckboxList`                      | Self-drawn multi-select list                     | `options`, `onValueChange`, `isDisabled`                    |
| `RadioList`                         | Self-drawn radio options                         | `options`, `value`, `onValueChange`, `isDisabled`           |
| `SegmentedControl`                  | Inline option segments                           | `options`, `value`, `onValueChange`, `isDisabled`           |
| `Slider`                             | Value scrubber (self-drawn)                      | `value`, `minValue`, `maxValue`, `onValueChange`            |
| `Selector`                | Single-option picker                       | `options`, `value`, `searchable`, `isDisabled`              |
| `MultiSelector`       | Multiple-option picker                     | `options`, `value`, `searchable`, `isDisabled`              |
| `Typeahead`                          | Searchable single selection field                  | `searchSource`, `value`, `onChange`, `hasEntriesOnFocus`    |
| `Tokenizer`                          | Searchable multi-selection token field             | `searchSource`, `value`, `onChange`, `hasCreate`            |
| `Token`                              | Removable or interactive entity chip               | `label`, `color`, `onRemove`, `onClick`, `href`             |
| `ComplexSelector`                    | Field trigger with a custom anchored picker surface| `value`, `children`, `changeAction`, `variant`               |
| `NumberInput`        | Numeric entry with bounds                        | `value`, `min`, `max`, `step`, `onValueChange`              |
| `PinInput`                           | Fixed-length code/PIN entry                      | `length`, `onValueChange`, `onComplete`, `secure`           |

| `InputRating`                        | Tappable 1..max rating row                       | `value`, `max`, `icon`, `onValueChange`                     |
| `Chip`                               | Selectable/removable chip                        | `selected`, `onSelect`, `onRemove`                          |
| `Field`, `FieldGroup`  | Labeled field wrapper / labeled field group      | `label`, `description`, `inputID`, `isRequired`, `isOptional`, `status` |
| `Item`                  | Settings-style row                               | `title`, `supportingText`, `leading`, `trailing`, `onPress` |

## Content

| Component        | What it is                                  | Key props                                  |
| ---------------- | ------------------------------------------- | ------------------------------------------ |
| `Card`           | Container with header/footer slots          | `header`, `footer`                         |
| `Alert`          | Inline callout                              | `tone`, `icon`, `title`                    |
| `Banner`         | Notice strip with optional dismiss          | `icon`, `onDismiss`                        |
| `EmptyState` | Empty-state block (icon + title + actions) | `icon`, `title`, `description`       |
| `Badge`          | Inline label chip                           |                                            |
| `Avatar`         | Circular image with text fallback           | `src`, `fallback`, `size`                  |
| `AvatarGroup`    | Overlapping avatar row with `+N` overflow   | `max`, `size`                              |
| `User`           | Avatar + name/description row               | `name`, `description`, `src`, `onSelect`   |
| `Icon`           | Registered icon glyph                       | `name`, `size`, `color`                    |
| `Image`          | Image                                       | `src`, `alt`                               |
| `Thumbnail`      | Square image preview with optional remove action | `src`, `alt`, `isLoading`, `onPress`, `onRemove` |
| `Blockquote`     | Quoted content with optional attribution    | `cite`                                     |
| `Code`           | Inline monospace text                       | `color`, `size`                            |
| `CodeBlock`      | Syntax-colored code with copy and collapse actions | `code`, `language`, `hasLineNumbers`, `highlightLines` |
| `Citation`       | Source label or numbered source link        | `source`, `number`, `variant`              |
| `Skeleton`       | Loading placeholder block                   | `width`, `height`                          |
| `Divider` | Hairline rule                         | `orientation`                              |

## Disclosure & navigation

| Component        | What it is                        | Key props                                   |
| ---------------- | --------------------------------- | ------------------------------------------- |
| `Collapsible`    | Show/hide a region                | `trigger`, `open`, `onOpenChange`           |
| `Accordion`      | List of expanding items           | `items`, `multiple`, `open`, `onOpenChange` |
| `Tabs`           | Tab bar + panes                   |                                             |
| `Breadcrumbs`     | Ancestor path trail               | `items`, `separator`                        |
| `Pagination`     | Prev/next + windowed page buttons | `page`, `pageCount`, `onPageChange`         |
| `Stepper`        | Multi-step progress/flow control  | `steps`, `current`, `onStepChange`          |
| `NavigationMenu` | Top-level nav menu                | `items`, `horizontal`                       |
| `CommandPalette` | Searchable action palette         | `open`, `items`, `placeholder`              |
| `DropdownMenu`   | Anchored action menu              | `trigger`, `items`, `placement`             |
| `ContextMenu`    | Secondary-press action menu       | `items`, `open`, `onOpenChange`             |

## Data display

| Component       | What it is                              | Key props                                       |
| --------------- | --------------------------------------- | ----------------------------------------------- |
| `Table`         | Columnar rows                           | `columns`, `rows`, `renderCell`, `onRowPress`   |
| `TreeList` | Expandable node hierarchy            | `nodes`, `defaultExpanded`, `onToggle`, `onSelect` |
| `Timeline`      | Vertical event list (dot + connector)   | `items`                                         |
| `ProgressGroup` | Stacked labeled `Meter` rows            | `items`                                         |
| `Meter`         | Gauge/dash ring                         | `value`, `max`, `strokeWidth`                   |
| `ProgressBar`   | Linear determinate or indeterminate progress | `value`, `max`, `label`, `marks`             |
| `MetadataList`, `MetadataListItem` | Aligned label/value details | `columns`, `labelPosition`, `label`, `children` |
| `StatusDot`     | Accessible colored status signal          | `variant`, `label`, `isPulsing`, `tooltip`       |
| `Timestamp`     | Localized relative or absolute instant     | `value`, `format`, `isLive`, `hasTooltip`        |
| `Timer`         | Live elapsed duration                     | `startTime`, `format`, `type`, `size`            |
| `Outline`       | Navigable heading outline                 | `items`, `activeId`, `hasScrollOnClick`          |
| `Spinner` | Self-drawn loading indicator     |                                                 |

## Scrolling

| Component                        | What it is         | Key props                             |
| -------------------------------- | ------------------ | ------------------------------------- |
| `ScrollView`                     | Scrollable region  | `refreshing`, `onRefresh`             |
| `ScrollBox`                      | Scroll container   |                                       |
| [`VirtualList`](virtual-list.md) | Windowed long list | `items`, `keyExtractor`, `renderItem` |

## Chat

The Chat family provides a docked composer and composable message rows. Start
with [`ChatLayout`](../recipes/chat-conversation.md) for a complete conversation
or combine `ChatMessageList`, `ChatMessage`, and `ChatMessageBubble` inside an
existing scroll surface.

| Component | What it is | Key props |
| --- | --- | --- |
| `ChatLayout`, `ChatLayoutScrollButton` | Scrollable conversation, docked composer, and return-to-bottom action | `composer`, `emptyState`, `scrollRef`, `density` |
| `ChatMessageList` | Density-aware message column with empty state and load-older callback | `density`, `gap`, `align`, `scrollToTopAction`, `isStreaming` |
| `ChatMessage`, `ChatMessageBubble` | Sender alignment/context and filled or ghost bubble | `sender`, `name`, `avatar`, `variant`, `group`, `metadata` |
| `ChatMessageMetadata`, `ChatSystemMessage` | Timestamp/status row and centered conversation notices | `timestamp`, `status`, `variant`, `icon` |
| `ChatToolCalls`, `ChatTokenizedText` | Expandable tool-call summary and token-aware message text | `calls`, `isExpanded`, `tokens` |
| `ChatComposer`, `ChatComposerInput`, `ChatComposerDrawer` | Composer shell, rich input, and collapsible context/attachment region | `onSubmit`, `value`, `triggers`, `onFiles`, `count` |
| `ChatSendButton`, `ChatDictationButton` | Send/stop action and speech input control | `isStopShown`, `isDisabled`, `onSend`, `onStop` |
| `useChatStreamScroll`, `useChatNewMessages`, `useChatPasteAsToken`, `useChatComposerTokens`, `useSpeechRecognition`, `useChatDictation` | Hooks for streaming, new messages, tokens, and dictation | See each hook's TSDoc |

`ChatComposerInput.bind` delivers a portable imperative handle because React
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

| Component   | What it is                                | Key props                                  |
| ----------- | ----------------------------------------- | ------------------------------------------ |
| `Overlay`   | Content above the screen                  |                                            |
| `Popover`   | Anchored floating content                 | `anchor`, `open`, `placement`, `alignment`, `onDismiss` |
| `Tooltip`   | Pointer hover hint                        | `trigger`, `content`, `openDelay`          |
| `Hoverable` | Hover-reveal card around its children     | `card`, `openDelay`                        |
| `Sheet`     | Bottom sheet                              | `open`, `detents`, `shadeCover`, `onDismiss` |
| `Drawer`    | Edge drawer                               | `main`, `drawer`, `open`, `onDismiss`      |

`showToast` presents a transient toast; `openWindow` opens a host window where
supported. Modal/sheet routing shares the navigation layer — see
[navigation](navigation.md).

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
