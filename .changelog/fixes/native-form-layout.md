### Keep native editors while rearranging a form

On iOS and Android, FormLayout now places horizontal fields through Mason grid
tracks. Changing direction, including horizontal labels, keeps the existing
editor and its local text instead of replacing the field's control tree.

```tsx
<FormLayout direction={direction} style={{ gap: 16 }}>
  <Field label="Name"><TextInput /></Field>
</FormLayout>
```

[Text entry](https://octane-xplat.goddardai.org/app/text-entry)
