### Inline dialogs honor their open state

Inline dialogs now appear on iOS and Android. On web, closing one removes its panel. Set `isInline` to show the panel in the page without a modal overlay.

```tsx
<Dialog isInline isOpen={open}>
  <Text>Review your changes.</Text>
</Dialog>
```

See [dialogs](https://octane-xplat.goddardai.org/components).
