### Use the keyboard and the app menu in Linux GTK apps

On the GTK runtime, pressing Tab skipped buttons and other interactive views, so a form could not be submitted from the keyboard. Tab now stops on them in document order, and Space or Return activates the focused one. The menu installed with `appMenu` now appears in the window's menubar; before, only its keyboard shortcuts worked. `useFocusWithin` no longer crashes with a stack overflow on GTK.

```tsx
<Button clickAction={save}>Save</Button> // reachable with Tab, activated with Space or Return
```
