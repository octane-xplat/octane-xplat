### Section stacks children vertically on macOS

On macOS, `Section` laid out its children in a row instead of stacking them
vertically like every other platform. It now defaults to a column layout;
pass `flexDirection: 'row'` in `style` to lay children out horizontally.
