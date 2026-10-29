# Powerkeys engine

`src/engine/`, `tests/runtime.web.test.ts`, and `tests/presets.test.ts` derive from
[alloc/powerkeys](https://github.com/alloc/powerkeys) 0.2.5, examined at
[`18ee1fd0`](https://github.com/alloc/powerkeys/tree/18ee1fd0eeee5e4430b193a55e93247d7698d758).
The original MIT license is preserved in [POWERKEYS-LICENSE](POWERKEYS-LICENSE).

Powerkeys supplies the binding parser, scope and conflict ordering, sequence
machine, expression evaluation, context, binding sets, recording, diagnostics,
and reservation presets. Its runtime directly uses DOM constructors and event
targets. Xplat keeps that engine locally so native adapters can supply boundaries,
events, editable detection and timers without pretending native views are DOM
objects. Revisit this fork when upstream offers those host seams.

Local changes include host-neutral event/target types, host-selected platform
with an optional explicit override, focus-loss sequence reset, physical-only
matching for explicit key codes, punctuation/keypad codes, a round-trippable
`Plus` key name, recording-session ownership, positive timeout validation, and
prototype-safe context paths. The expression evaluator is an explicit runtime
dependency; its redundant parsed AST was removed for Node ESM interoperability.

Browser and OS presets are upstream snapshots, not a complete or current list
of reserved keys. Application policy decides which presets to use and whether
validation failures should block a saved choice. Native host constraints and
verification evidence live in the [contributor note](../../.agents/docs/shortcuts.md).
