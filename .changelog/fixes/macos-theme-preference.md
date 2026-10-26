### setThemePreference drives the app appearance on macOS

On macOS, `setThemePreference('light' | 'dark')` now pins the application
appearance (`NSApp.appearance`), so CSS root classes, `prefers-color-scheme`
media queries, and native controls follow the preference instead of only the
OS setting. `setThemePreference('system')` clears the override and follows the
system again.
