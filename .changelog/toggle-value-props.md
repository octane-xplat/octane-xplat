`Switch`, `CheckboxInput`, `UISwitch`, and `MaterialSwitch` now use Astryx's prop names. `checked` is now `value`, `defaultChecked` is now `defaultValue`, and `onCheckedChange` is now `onChange`. On `CheckboxInput`, the `indeterminate` flag is folded into `value`: pass `value="indeterminate"` instead of `indeterminate`.

```tsx
// before
<Switch checked={on} onCheckedChange={setOn} />
<CheckboxInput checked={ok} indeterminate={mixed} onCheckedChange={setOk} />

// after
<Switch value={on} onChange={setOn} />
<CheckboxInput value={mixed ? 'indeterminate' : ok} onChange={setOk} />
```
