### Inline dialogs honor their open state

`Dialog` now renders `isInline` panels on iOS and Android and respects their open state on web. Closing an inline dialog removes its panel without opening a modal overlay.

```tsx
<Dialog isInline isOpen={open}>
  <Text>Review your changes.</Text>
</Dialog>
```

See [dialogs](https://octane-xplat.goddardai.org/components).
