# AppKit workflow recipes

Use these task-specific recipes when changing the experimental native macOS
host or reviewing its platform behavior. Each recipe links the relevant guide,
fixtures, and qualification limits. For cross-platform workflows, start with
the [main recipe index](recipes/README.md).

## Actions and choices

- [Keep AppKit provider-button actions with their mounted owner](recipes/appkit-auth-button-actions.md)
- [Show AppKit busy feedback](recipes/appkit-busy-feedback.md)
- [Save and open help with AppKit buttons](recipes/appkit-button-actions.md)
- [Compose AppKit multi-choice controls](recipes/appkit-checkbox-list.md)
- [Label an AppKit checkbox](recipes/appkit-checkbox-metadata.md)
- [Reveal secondary row actions on AppKit](recipes/appkit-container-reveal.md)
- [Expose AppKit self-drawn control semantics](recipes/appkit-control-accessibility.md)
- [Choose finite AppKit options](recipes/appkit-finite-select.md)
- [Open and select AppKit cards](recipes/appkit-interactive-cards.md)
- [Own AppKit primary actions across nested controls and lifecycle changes](recipes/appkit-nested-clicks.md)
- [Label and gate AppKit PIN entry](recipes/appkit-pin-fields.md)
- [Identify AppKit actions without changing their spoken names](recipes/appkit-pressable-metadata.md)
- [Compose AppKit radio choices](recipes/appkit-radio-composition.md)
- [Switch views with AppKit segments](recipes/appkit-segmented-control.md)
- [Adjust an AppKit setting or range](recipes/appkit-slider.md)
- [Save an AppKit switch setting](recipes/appkit-switch-actions.md)
- [Save a pin with an AppKit toggle button](recipes/appkit-toggle-actions.md)

## Text, fields, and search

- [Request initial AppKit date or time focus](recipes/appkit-date-autofocus.md)
- [Space formatted text on AppKit](recipes/appkit-formatted-spacing.md)
- [Update raw AppKit search text during composition](recipes/appkit-search-text.md)
- [Bound AppKit multiline input](recipes/appkit-text-limits.md)
- [Choose native AppKit label overflow with CSS](recipes/appkit-text-overflow-css.md)
- [Keep AppKit text actions owned by the current field](recipes/appkit-text-ownership.md)
- [Preserve AppKit text styles](recipes/appkit-text-styles.md)
- [Preserve current AppKit time and date-time drafts](recipes/appkit-time-drafts.md)
- [Remove current AppKit tokens from an empty input](recipes/appkit-token-entry.md)
- [Keep AppKit token overflow bounded](recipes/appkit-token-overflow.md)
- [Own AppKit typeahead focus and results](recipes/appkit-typeahead-focus.md)

## Navigation, tables, and overlays

- [Cycle through AppKit screen regions](recipes/appkit-landmark-navigation.md)
- [Seek AppKit content from its logical start](recipes/appkit-logical-scroll.md)
- [Keep native AppKit menus scoped to their current record and view](recipes/appkit-native-context-menu.md)
- [Keep native AppKit date-picker selection and attachment current](recipes/appkit-native-date-picker.md)
- [Keep native AppKit picker choices owned by stable record and option IDs](recipes/appkit-native-picker.md)
- [Own native AppKit window sheets from the declaring tree](recipes/appkit-native-sheet.md)
- [Page through AppKit content](recipes/appkit-paging.md)
- [Adapt a native macOS screen to its window](recipes/appkit-responsive-layout.md)
- [Bind incoming AppKit links to the primary root lifetime](recipes/appkit-route-links.md)
- [Navigate AppKit tab strips](recipes/appkit-tab-navigation.md)
- [Resize AppKit data table columns](recipes/appkit-table-column-resize.md)
- [Scroll a wide data table on AppKit](recipes/appkit-table-scroll.md)
- [Keep AppKit table columns visible while scrolling](recipes/appkit-table-sticky-columns.md)
- [Prepare source-owned AppKit window layers](recipes/appkit-window-layer-source.md)

## System services and display

- [Show an animated illustration on AppKit](recipes/appkit-animated-image.md)
- [Keep AppKit network and activity readers alive and owned](recipes/appkit-connectivity.md)
- [Keep native AppKit platform event readers independently owned](recipes/appkit-host-events.md)
- [Open an in-app document browser on AppKit](recipes/appkit-in-app-browser.md)
- [Load and replace images on AppKit](recipes/appkit-image-loading.md)
- [Read consistent locale and device metadata on AppKit](recipes/appkit-locale-metadata.md)
- [Read AppKit notification permission without prompting](recipes/appkit-notification-permissions.md)
- [Paint patterned borders on native AppKit boxes](recipes/appkit-patterned-borders.md)
- [Clip AppKit container overflow](recipes/appkit-overflow-clipping.md)
- [Open System Settings on AppKit](recipes/appkit-settings.md)
- [Share native AppKit text, links and local files](recipes/appkit-sharing.md)
- [Save ordinary AppKit settings and purge saved query snapshots](recipes/appkit-storage.md)
- [Import the unsupported phone system-bar API safely on AppKit](recipes/appkit-system-bars.md)
- [Render SVG images on AppKit](recipes/appkit-svg-images.md)
- [Open URL links on AppKit](recipes/appkit-url-links.md)
