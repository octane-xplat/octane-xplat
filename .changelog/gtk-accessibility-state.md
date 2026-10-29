### Preserve GTK control accessibility flags

GTK controls can now report multiple accessibility flags together, including
loading, required and invalid state. Updating or removing flags updates native
metadata; textfield editability and widget sensitivity remain separate controls
for interaction.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function AccountField(props: { required: boolean; loading: boolean; invalid: boolean }) {
  return (
    <textfield
      accessibilityLabel="Account"
      accessibilityState={{ required: props.required, busy: props.loading, invalid: props.invalid }}
      text=""
    />
  )
}
```

[GTK control state](https://octane-xplat.goddardai.org/linux-gtk#control-accessibility-state).
