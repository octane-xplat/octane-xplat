// Type contract for the desktop devtools shell — the AppKit implementation
// lives in Shell.macos.tsrx.
export interface DevtoolsShellProps {
  /** The selected project root `xplat devtools` ran from; null in the harness. */
  preferredRoot: string | null
  /** Tab to show on mount (DEVTOOLS_SELFTEST_TAB). */
  initialTab?: string
  /** Toggle the main window's level (keep-on-top); absent → no toggle shown. */
  onKeepOnTop?: (onTop: boolean) => void
  /** Main-window title updates: `devtools` until a server is targeted. */
  onTitle?: (title: string) => void
  /** Dev-only selftest hook — receives the row-pick function on mount. */
  selftest?: { pick?: (index: number) => void }
}

export declare function Shell(props: DevtoolsShellProps): unknown
