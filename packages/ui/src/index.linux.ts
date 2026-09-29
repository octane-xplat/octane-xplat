// Linux index — the webview target shares the web surface except where a
// host bridge changes the answer: openWindow becomes a real GTK window and
// colorScheme follows the host's appearance push (WebKitGTK's own
// prefers-color-scheme doesn't track GNOME). Explicit named exports here
// shadow the same names in the star re-export.
export * from './index.web'
export { openWindow } from './windows.linux'
export type { LinuxWindowHandle } from './windows.linux'
export { useColorScheme, getColorScheme } from './theme/colorScheme.linux'
export type { ColorScheme } from './theme/colorScheme.linux'
