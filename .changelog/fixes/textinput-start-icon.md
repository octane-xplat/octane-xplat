### TextInput startIcon renders on native and spaces like Astryx

`TextInput`'s `startIcon` now renders on iOS and Android — it was silently
dropped before — and a registered icon name resolves to an `Icon` on web
instead of printing as text. On web, the icon sits 8px inside the field with
an 8px gap to the text, matching Astryx's input wrapper; the same 8px now
separates the field from its clear and status affordances.

```tsx
<TextInput label="Search" isLabelHidden placeholder="Search…" startIcon={<Icon name="xplat-search" size={16} />} />
```
