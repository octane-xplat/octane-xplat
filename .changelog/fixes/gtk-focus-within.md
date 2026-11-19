### Prevent a GTK crash when tracking focus within a view

Calling `useFocusWithin` on Linux GTK previously caused a stack overflow. The hook now reports when focus enters or leaves the view.

[Focus and keyboard navigation](https://octane-xplat.goddardai.org/accessibility)
