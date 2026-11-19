### macOS text areas honor `maxRows` after text updates

On native macOS, a multiline `TextArea` with `autoGrow` and `maxRows` now stops growing at the configured row cap instead of tracking every line of content. Constraint-driven size changes reconcile the containing Mason tree and each layout pass bounds children by the parent's latest allocation.

See [text inputs](https://octane-xplat.goddardai.org/components).
