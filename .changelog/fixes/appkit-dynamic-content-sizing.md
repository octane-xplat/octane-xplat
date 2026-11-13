### AppKit containers resize when children change

Auto-sized AppKit containers now update their height when children are inserted, removed, or reordered inside nested Mason layouts. The containing layout recomputes the available space while preserving keyed child hosts. See [container layouts](https://octane-xplat.goddardai.org/primitives#predictable-container-defaults).
