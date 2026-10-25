Fixed `TextArea` differences from Astryx's default text area:

- A standalone `TextArea` now renders its `label`, `description`, `status`, and required/optional markers as visible field chrome on web and native, like `TextInput` already does — previously the field rendered the textarea alone.
- The textarea now sits inside Astryx's bordered box on web (8px radius, emphasized border), with the status icon pinned inside its top end.
- Text metrics now match Astryx: 14px/20px type, 4px block padding (8px at `size="lg"`), so a 3-row field measures 68px instead of 51px.
- The web field keeps Astryx's manual vertical resize handle; `autoGrow` still suppresses it since it owns the height.
