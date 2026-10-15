# Upstream limitations

Keep limitations in Octane, NativeScript, `@nativescript-community/octane`,
and other upstream dependencies visible to maintainers. A local workaround
may be appropriate, but do not let it hide the upstream behavior or imply that
upstream supports the behavior.

## Where to record a limitation

Record the finding in the relevant topic page under `.agents/docs/`, such as a
framework note, platform investigation, parity record, or feature note. If no
page owns the topic, create one and link it from
[the internal docs index](README.md). Keep the evidence with the conclusion
rather than making a second, detached inventory that can go stale.

Include enough detail to distinguish a verified upstream constraint from an
assumption:

- The owning upstream package and the version or commit examined.
- The affected API, platform, and conditions, plus the observable limitation.
- Evidence type and a link to the relevant upstream source, documentation,
  issue, or local probe. Distinguish source/build evidence from runtime
  behavior.
- Whether Xplat leaves the behavior unsupported, works around it, or carries a
  local patch; explain the workaround's scope and constraints.
- The current status and what upstream change or dependency update would allow
  the workaround to be removed, when applicable.

Check the record when upgrading the upstream dependency. Update its status
when the limitation changes, and keep historical evidence distinguishable
from current behavior.
