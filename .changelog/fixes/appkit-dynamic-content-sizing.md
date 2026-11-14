### AppKit containers resize when children change

Auto-sized AppKit containers now update their height when children are inserted, removed, or reordered inside nested Mason layouts, or when text changes. Long text wraps within its allocated width, and shorter text lets the container shrink again. The containing layout recomputes the available space while preserving child hosts. See [container layouts](https://octane-xplat.goddardai.org/primitives#predictable-container-defaults).
