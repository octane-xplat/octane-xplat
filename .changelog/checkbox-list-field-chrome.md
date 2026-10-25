### Show labels and list rows for checkbox lists

`CheckboxList` (`CheckboxGroup`) now renders its options as a real list and adopts Astryx's field chrome:

- A standalone `CheckboxList` renders its `label`, `description`, `status`, and required/optional markers through the shared field wrapper — previously only the option rows rendered.
- Options render as `<ul>`/`<li>` list items (via `List`/`ListItem`), so row density, dividers, and semantics match `List`. New `density` and `hasDividers` props are passed through; `density="compact"` renders small checkboxes.
- Clicking anywhere on a row toggles its option, matching Astryx.
- The group's accessible name now comes from its visible label element (`role="group"` + `aria-labelledby`).

[Input components](https://octane-xplat.goddardai.org/components#inputs)
