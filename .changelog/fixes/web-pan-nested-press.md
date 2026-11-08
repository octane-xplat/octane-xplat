### Nested presses work inside a web pan host

On web, a `View` or `Pressable` with `onPan` no longer swallows clicks on controls nested inside it. The gesture previously captured the pointer on `pointerdown`, which retargeted the trailing `click` to the pan host — a plain click on a nested `Pressable` never fired `onPress`. The pointer is now captured only after it travels past the drag slop, so stationary clicks activate nested controls while real drags still report `began`/`moved`/`ended` and do not activate anything.

```tsx
<View onPan={(event) => console.log(event.state, event.dx)}>
  <Pressable onPress={() => setSearching(true)}>
    <Text>Search</Text>
  </Pressable>
</View>
// Clicking Search now fires onPress; dragging fires onPan.
```
