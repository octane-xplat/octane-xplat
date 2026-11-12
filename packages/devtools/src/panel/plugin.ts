// Panel plugin contract — a package opts in with the `octaneXplat.devtoolsPanel`
// field in its package.json; the desktop app's Vite config discovers the
// module through `devtoolsPanels` (src/host/panels.ts) and passes the default
// exports to App via `plugins`. Each plugin renders inside the shared shell
// and talks to sessions/backends through the App's live connection.
import type { DevtoolsConnection } from '../client.ts'

export interface DevtoolsPanelPluginProps {
  /** The App's live connectDevtools connection to the targeted dev server. */
  connection: DevtoolsConnection
  /** Connection state, kept in props so a plugin does not re-subscribe. */
  state: 'connecting' | 'live' | 'closed'
}

export interface DevtoolsPanelPlugin {
  /** `/^[a-z][a-z0-9-]{0,31}$/` — the tab id; built-in ids are reserved. */
  id: string
  /** Tab label. */
  title: string
  /** The tab's Octane component; it owns its own scrolling. */
  Panel: (props: DevtoolsPanelPluginProps) => unknown
}

export const DEVTOOLS_PANEL_ID = /^[a-z][a-z0-9-]{0,31}$/
export const DEVTOOLS_BUILTIN_TABS = new Set(['sessions', 'actions', 'logs'])

export function defineDevtoolsPanel(plugin: DevtoolsPanelPlugin): DevtoolsPanelPlugin {
  if (!DEVTOOLS_PANEL_ID.test(plugin.id)) {
    throw new Error(
      `[devtools] invalid panel plugin id "${plugin.id}" — expected ${DEVTOOLS_PANEL_ID.source}`,
    )
  }

  if (DEVTOOLS_BUILTIN_TABS.has(plugin.id)) {
    throw new Error(`[devtools] panel plugin id "${plugin.id}" is a built-in tab id`)
  }

  return plugin
}

/** Defensive filter for plugin lists passed straight to App — invalid or
 *  duplicate ids are dropped with one console.error each. */
export function resolveDevtoolsPanelPlugins(
  plugins: readonly DevtoolsPanelPlugin[],
): DevtoolsPanelPlugin[] {
  const seen = new Set<string>(DEVTOOLS_BUILTIN_TABS)
  const out: DevtoolsPanelPlugin[] = []

  for (const plugin of plugins) {
    if (
      !plugin ||
      !DEVTOOLS_PANEL_ID.test(plugin.id) ||
      DEVTOOLS_BUILTIN_TABS.has(plugin.id) ||
      seen.has(plugin.id)
    ) {
      console.error(`[devtools] skipping invalid or duplicate panel plugin id "${plugin?.id}"`)
      continue
    }

    seen.add(plugin.id)
    out.push(plugin)
  }

  return out
}
