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

## Layout

| Component          | What it is                                 | Key props                                  |
| ------------------ | ------------------------------------------ | ------------------------------------------ |
| `View`             | Base container                             |                                            |
| `Row`              | Horizontal flex container                  |                                            |
| `Column`           | `View` alias for vertical stacks           |                                            |
| `Grid`             | Grid container                             |                                            |
| `Stack`            | Stacked container                          |                                            |
| `Absolute`         | Absolutely-positioned layer                |                                            |
| `Spacer`           | Flexible gap filler                        |                                            |
| `SafeArea`         | Insets-aware container                     |                                            |
| `KeyboardAvoiding` | Shifts content above the keyboard on iOS/Android; keeps a neutral column wrapper elsewhere | |

## Text

| Component                 | What it is                                   | Key props                |
| ------------------------- | -------------------------------------------- | ------------------------ |
| `Text`                    | Text block                                   |                          |
| `RichText`, `RichTextSpan` | Inline styled/linked spans inside one block |                          |
| `Heading`                 | Section heading (shared typography)          |                          |
| `Kbd`                     | Keyboard-key glyph (⌘K styling hook)         |                          |
| `Link`, `NavLink`         | Route navigation as text                     | `href`, `route`          |

## Inputs

| Component                            | What it is                                       | Key props                                                   |
| ------------------------------------ | ------------------------------------------------ | ----------------------------------------------------------- |
| `TextInput`, `TextArea`              | One- and multi-line text entry                   | `value`, `onChange`, `placeholder`                          |
| `SearchInput`                        | Search field with clear button                   | `value`, `onSubmit`, `onClear`                              |
| `Button`                             | Action button                                    | `loading`, `leading`, `trailing`                            |
| `Switch`                             | On/off toggle (self-drawn)                       | `checked`, `onCheckedChange`                                |
| `Checkbox`, `CheckboxGroup`          | Self-drawn checkbox / multi-select list          | `checked`, `onCheckedChange` / `options`, `onValueChange`   |
| `RadioGroup`                         | Self-drawn radio options                         | `options`, `value`, `onValueChange`                         |
| `SegmentedControl`                   | Inline option segments                           | `options`, `value`, `onValueChange`                         |
| `Slider`                             | Value scrubber (self-drawn)                      | `value`, `minValue`, `maxValue`, `onValueChange`            |
| `Select`                             | Option picker (`SelectMenu`/`Combobox`/`InputMenu` aliases) | `options`, `value`, `searchable`, `multiple`  |
| `InputNumber`                        | Numeric entry with bounds                        | `value`, `min`, `max`, `step`, `onValueChange`              |
| `PinInput`                           | Fixed-length code/PIN entry                      | `length`, `onValueChange`, `onComplete`, `secure`           |
| `InputTags`                          | Tag/token entry                                  | `value`, `onValueChange`, `max`                             |
| `InputRating`                        | Tappable 1..max rating row                       | `value`, `max`, `icon`, `onValueChange`                     |
| `Chip`                               | Selectable/removable chip                        | `selected`, `onSelect`, `onRemove`                          |
| `FormField`, `FieldGroup`            | Labeled field wrapper / labeled field group      | `label`, `hint`, `error`, `required`                        |
| `ListItem`                           | Settings-style row                               | `title`, `supportingText`, `leading`, `trailing`, `onPress` |

## Content

| Component        | What it is                                  | Key props                                  |
| ---------------- | ------------------------------------------- | ------------------------------------------ |
| `Card`           | Container with header/footer slots          | `header`, `footer`                         |
| `Alert`          | Inline callout                              | `tone`, `icon`, `title`                    |
| `Banner`         | Notice strip with optional dismiss          | `icon`, `onDismiss`                        |
| `Empty`          | Empty-state block (icon + title + actions)  | `icon`, `title`, `description`             |
| `Badge`          | Inline label chip                           |                                            |
| `Avatar`         | Circular image with text fallback           | `src`, `fallback`, `size`                  |
| `AvatarGroup`    | Overlapping avatar row with `+N` overflow   | `max`, `size`                              |
| `User`           | Avatar + name/description row               | `name`, `description`, `src`, `onSelect`   |
| `Icon`           | Registered icon glyph                       | `name`, `size`, `color`                    |
| `Image`          | Image                                       | `src`, `alt`                               |
| `Skeleton`       | Loading placeholder block                   | `width`, `height`                          |
| `Separator`      | Hairline rule                               | `orientation`                              |

## Disclosure & navigation

| Component         | What it is                                     | Key props                                  |
| ----------------- | ---------------------------------------------- | ------------------------------------------ |
| `Collapsible`     | Show/hide a region                             | `trigger`, `open`, `onOpenChange`          |
| `Accordion`       | List of expanding items                        | `items`, `multiple`, `open`, `onOpenChange` |
| `Tabs`            | Tab bar + panes                                |                                            |
| `Breadcrumb`      | Ancestor path trail                            | `items`, `separator`                       |
| `Pagination`      | Prev/next + windowed page buttons              | `page`, `pageCount`, `onPageChange`        |
| `Stepper`         | Multi-step progress/flow control               | `steps`, `current`, `onStepChange`         |
| `NavigationMenu`  | Top-level nav menu                             | `items`, `horizontal`                      |
| `CommandPalette`  | Searchable action palette                      | `open`, `items`, `placeholder`             |
| `DropdownMenu`    | Anchored action menu                           | `trigger`, `items`, `placement`            |
| `ContextMenu`     | Secondary-press action menu                    | `items`, `open`, `onOpenChange`            |

## Data display

| Component       | What it is                              | Key props                                       |
| --------------- | --------------------------------------- | ----------------------------------------------- |
| `Table`         | Columnar rows                           | `columns`, `rows`, `renderCell`, `onRowPress`   |
| `Tree`          | Expandable node hierarchy               | `nodes`, `defaultExpanded`, `onToggle`, `onSelect` |
| `Timeline`      | Vertical event list (dot + connector)   | `items`                                         |
| `ProgressGroup` | Stacked labeled `Meter` rows            | `items`                                         |
| `Meter`         | Gauge/dash ring                         | `value`, `max`, `strokeWidth`                   |
| `ActivityIndicator` | Spinner (self-drawn)                |                                                 |

## Scrolling

| Component     | What it is                     | Key props                        |
| ------------- | ------------------------------ | -------------------------------- |
| `ScrollView`  | Scrollable region              | `refreshing`, `onRefresh`        |
| `ScrollBox`   | Scroll container               |                                  |
| `VirtualList` | Windowed long list             | `items`, `keyExtractor`, `renderItem` |

## Overlays

| Component   | What it is                                | Key props                                  |
| ----------- | ----------------------------------------- | ------------------------------------------ |
| `Overlay`   | Content above the screen                  |                                            |
| `Popover`   | Anchored floating content                 | `anchor`, `open`, `placement`, `onDismiss` |
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

| Package                 | Exports                       | What it is                                        |
| ----------------------- | ----------------------------- | ------------------------------------------------- |
| `@octane-xplat/pager`   | `Pager`                       | Full-page swipe container                         |
| `@octane-xplat/camera`  | `CameraView`                  | Live camera preview                               |
| `@octane-xplat/video`   | `Video`                       | Embedded video player                             |
| `@octane-xplat/gif`     | `AnimatedImage`               | Animated images (GIF/webp)                        |
| `@octane-xplat/canvas`  | `Canvas`, `getGPU`            | Canvas/GPU surface (2D, WebGL/WebGPU)             |
| `@octane-xplat/audio`   | `createAudioPlayer`           | Long-form audio playback                          |
| `@octane-xplat/haptics` | `createHaptics`               | Capability-aware haptics                          |
| `@octane-xplat/sounds`  | `createSoundBank`             | Short UI sound effects                            |
| `@octane-xplat/effects` | `ShaderEffect` (`/ios`, `/android` only) | View-effect shaders (Metal stitch / AGSL) |
| `@octane-xplat/auth`    | `appleAuth`, `googleAuth`, `AppleSignInButton`, `GoogleSignInButton` | Provider sign-in (Apple / Google SDKs)    |
