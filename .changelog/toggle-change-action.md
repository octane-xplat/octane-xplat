`Switch` and `CheckboxInput` now support Astryx's `changeAction` — an async callback that runs after `onChange`. While it runs the control shows its loading state; a rejection reverts the toggle and reports the previous value through `onChange` again. `Switch` also gains Astryx's `labelPosition="start"` (label before the track) and `labelSpacing="spread"` (label pushed to the field's opposite edge).

```tsx
<Switch label="Email updates" value={on} onChange={setOn} changeAction={savePreference} labelSpacing="spread" />
```
