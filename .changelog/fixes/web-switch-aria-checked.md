### Web Switch reports its state to assistive technology

On web, `Switch` renders `role="switch"` but emitted no `aria-checked`, so
screen readers could not determine whether the control was on or off — the
switch role requires the attribute. The control now reflects its checked
state through `aria-checked`, matching the other checkable controls.

```tsx
// The rendered input now carries aria-checked="true" when on.
<Switch value={enabled} onChange={setEnabled} />
```
