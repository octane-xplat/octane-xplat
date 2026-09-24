# react-native-web (and the RN API surface as lingua franca)

> Implements React Native's component/API surface over react-dom. This is the
> proof that the direction of convergence should be **constrained native surface
> → implemented on web**, never the reverse.

## The lesson that shapes our primitives layer

RN's vocabulary is small and closed: `View Text Image ScrollView FlatList
TextInput Pressable Modal Switch SafeAreaView…`. The DOM's is open-ended and
semantic. A shared codebase must write to the closed vocabulary — which is why
our primitives are RN-shaped (`View`/`Text`/`Pressable`), not HTML-shaped.
Every web leaf we write is doing the same job RNW does for react-dom.

## What RNW had to normalize (our checklist of hidden seams)

- **Responder/pointer events**: RN gestures (responder grant/move/release)
  shimmed over pointer events. For us: NS `touch`/`pan` vs Pointer Events —
  normalize to one gesture event shape (see `docs/animation-gestures.md`).
- **Text rules**: `Text` cannot contain `View`; nested `Text` = inline spans.
  Same on NS (`label` + `formattedstring`/`span`). Adopt RN's rule verbatim.
- **StyleSheet.create**: mostly a no-op/validation wrapper — but establishes
  the "static styles are declared once" contract that lets each target lower
  them efficiently. For us that's shared CSS classes instead.
- **Accessibility mapping**: `accessibilityRole`/`accessibilityLabel` → ARIA.
  NS exposes the same prop names natively — a shared a11y prop set can be
  near-1:1 (see `docs/platform-services.md`).
- **AppRegistry/root**: web mounts to a DOM node; native registers a
  component. For us: `createRoot(el)` vs `renderNativeScriptApp(page, App)` —
  per-platform `main.*.ts` entries own this.
- **PixelRatio/dimensions**: `useWindowDimensions`, `PixelRatio.get`. NS:
  `Screen.mainScreen` (dip + scale). Shared `useWindowSize()` hook.
- **`Platform.OS` / `Platform.select`**: the value-level split mechanism that
  complements file-level splits. Same pattern: a `platform` module resolved
  per-target so dead branches eliminate at build time.

## Where RNW creaks (avoid these mistakes)

- Shimmed `FlatList`/`Modal`/Responder semantics that never feel native on
  web. For us: **don't force the native primitive's semantics onto web when
  web has a better native answer** — e.g. our `List` can be honest virtualization
  (`@octanejs/tanstack-virtual`) on web while native uses `listview`; `Modal`
  is a portal on web vs a second root on native. Match the _contract_, not the
  implementation.
- CSS escape hatches got messy (`dangerouslySetInnerHTML`-style bypasses).
  Our cleaner seam: platform prop bags (`ios={{ … }}`) + `.web/.native` leaf
  files when props can't express the divergence.

## Takeaway

RNW validates: (1) file-level platform splits + RN-shaped vocabulary is a
sufficient abstraction for most app code; (2) normalize events and text rules
at the primitive boundary; (3) let web leaves use real web behavior rather
than faithfully simulating native quirks.
