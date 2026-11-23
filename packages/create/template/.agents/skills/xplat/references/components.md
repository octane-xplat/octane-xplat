# Components — the vocabulary

Use shared components for screens that work across targets. Put these examples
in `.tsrx` files; style their classes in the app's CSS.

```tsrx
import { VStack, HStack, Text, Pressable } from '@octane-xplat/ui'

export function Welcome() {
  return <VStack className="welcome">
    <Text>Plan your next trip</Text>
    <HStack><Pressable onPress={() => console.log('Start planning')}>
      <Text>Start planning</Text>
    </Pressable></HStack>
  </VStack>
}
```

## Shared component inventory

| Need                  | Component(s)                                                                  |
| --------------------- | ----------------------------------------------------------------------------- |
| Layout                | `View`, `VStack`, `HStack`, `Grid`, `Stack`, `Absolute`, `Spacer`, `SafeArea` |
| Text                  | `Text`, `Heading`, `RichText`, `RichTextSpan`                                 |
| Tap                   | `Pressable`, `Button`, `Link`, `NavLink`                                      |
| Input                 | `TextInput`, `TextArea`, `Switch`, `Slider`                                   |
| Scrolling             | `ScrollableArea`, `VirtualList`                                               |
| Media                 | `Image` (see note), `Icon`                                                    |
| Feedback              | `Spinner`, `Meter`, `showToast`                                               |
| Overlays              | `BottomSheet`, `Overlay`, `Popover`, `Drawer`, `HoverCard`, `Tooltip`         |
| Shells                | `Screen`, `Tabs`                                                              |
| Theme and measurement | `useColorScheme`, `useSafeAreaInsets`, `useMeasure$`                           |

Native pages start full-screen: app content extends under the status bar
and home indicator, and `SafeArea` is the only source of safe-area padding —
wrap screen content that must stay clear of the system bars. A custom
NativeScript page needs `prepareFullScreenPage(page)` from
`@octane-xplat/ui/nativescript` before its content renders.

Use `Image` from `@octane-xplat/ui` in a fresh starter. For an iOS or Android
app that needs cached raster image loading, add `@octane-xplat/image` with
`bun add @octane-xplat/image` and import `Image` from that package. It uses
Glide on Android and SDWebImage on iOS. Keep the core component for SVG sources.
See the [image guide](https://octane-xplat.goddardai.org/package-image) for
engine-specific options.

```tsrx
import { Image } from '@octane-xplat/ui'

export function TripPhoto() {
  return <Image
    src="https://picsum.photos/seed/trail/800/450"
    alt="Trailhead"
    contentFit="cover"
    className="trip-photo"
  />
}
```

```css
.trip-photo {
  width: 100%;
  height: 180px;
}
```

Constrain the height of a `ScrollableArea` so it has a viewport. For a long
list, use `VirtualList` with a bounded viewport so the app only mounts rows it
needs.

```tsrx
import { ScrollableArea, VirtualList, Text } from '@octane-xplat/ui'

const destinations = [{ id: 'oslo', name: 'Oslo' }, { id: 'rome', name: 'Rome' }]

export function Destinations() {
  return <>
    <ScrollableArea className="destination-list"><Text>Choose your next destination</Text></ScrollableArea>
    <VirtualList className="destination-list" items={destinations} keyExtractor={(item) => item.id}
      renderItem={(item) => <Text>{item.name}</Text>} />
  </>
}
```

```css
.destination-list {
  height: 240px;
}
```

Text fields keep the platform's keyboard, caret, selection, and input methods.
Use `onChange` to store the new value. `KeyboardAvoiding` helps keep the field
visible when the keyboard opens.

```tsrx
import { useState } from 'octane'
import { KeyboardAvoiding, TextInput } from '@octane-xplat/ui'

export function TravelerName() {
  const [name, setName] = useState('')
  return <KeyboardAvoiding>
    <TextInput accessibilityLabel="Traveler name" placeholder="Your name"
      value={name} onChange={setName} />
  </KeyboardAvoiding>
}
```

`TextArea` supports multiline text. Its submit shortcut is Cmd/Ctrl+Enter on
web; native submits with `returnKeyType="done"` or `"send"`.

```tsrx
import { useState } from 'octane'
import { TextArea } from '@octane-xplat/ui'

export function TravelNotes() {
  const [notes, setNotes] = useState('')
  return <TextArea value={notes} onChange={setNotes} returnKeyType="done"
    onSubmit={() => console.log(notes)} accessibilityLabel="Travel notes" />
}
```

`BottomSheet` opens above the current screen. Keep its open state in your
component and give it a label that explains its purpose.

```tsrx
import { useState } from 'octane'
import { BottomSheet, Pressable, Text } from '@octane-xplat/ui'

export function TripHelp() {
  const [open, setOpen] = useState(false)
  return <>
    <Pressable onPress={() => setOpen(true)}><Text>Trip help</Text></Pressable>
    <BottomSheet label="Trip help" isOpen={open} onOpenChange={setOpen}>
      <Text>You can change your destination later.</Text>
    </BottomSheet>
  </>
}
```

`RichTextSpan` gives individual text runs their own style or press handler.
Native uses formatted text runs for these spans.

```tsrx
import { RichText, RichTextSpan } from '@octane-xplat/ui'

export function TripStatus() {
  return <RichText>
    <RichTextSpan text="Your trip is " />
    <RichTextSpan text="ready" className="status-ready"
      onPress={() => console.log('Show trip')} />
  </RichText>
}
```

## Platform widgets

Choose platform widgets when you want the OS's own controls. Import them only
in the matching platform file. Keep a shared `Preference.tsrx` fallback for
other targets.

```tsrx
// src/Preference.tsrx
import { useState } from 'octane'
import { Switch } from '@octane-xplat/ui'

export function Preference() {
  const [checked, setChecked] = useState(false)
  return <Switch accessibilityLabel="Reminders" value={checked} onChange={setChecked} />
}
```

Use the iOS widget in `Preference.ios.tsrx`.

```tsrx
import { useState } from 'octane'
import { UISwitch } from '@octane-xplat/ui/ios'

export function Preference() {
  const [checked, setChecked] = useState(false)
  return <UISwitch accessibilityLabel="Reminders" value={checked} onChange={setChecked} />
}
```

The Android equivalent belongs in `Preference.android.tsrx`:

```tsrx
import { useState } from 'octane'
import { MaterialSwitch } from '@octane-xplat/ui/android'

export function Preference() {
  const [checked, setChecked] = useState(false)
  return <MaterialSwitch accessibilityLabel="Reminders" value={checked} onChange={setChecked} />
}
```

| Platform | Additional widget names                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `UISlider`, `UIActivityIndicatorView`, `UITableView`, `UITabBar`, `UIModal`, `LiquidGlass`, `LiquidGlassContainer` |
| Android  | `SeekBar`, `CircularProgressIndicator`, `RecyclerView`, `BottomNavigationView`, `MaterialDialog` |

Keep platform lists outside other scrolling containers. Use a layout container
around the list; see the [components guide](https://octane-xplat.goddardai.org/components)
for overlay, hover, tab, and accessibility examples and their platform limits.
