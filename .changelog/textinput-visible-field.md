A standalone `TextInput` now shows its own label, description and status message, like Astryx's text input. Before, `label` only set the accessible name, and you needed a `Field` around the input to see any of it. Inside a `Field`, nothing changes: the `Field` still draws those parts.

```tsx
<TextInput label="Email" description="We never share it" status={{ type: 'error', message: 'Enter a valid email' }} />
```

On web, the status message is announced through a page-level screen-reader region instead of an inline `role="alert"` element.
