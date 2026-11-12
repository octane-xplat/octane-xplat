// Shared devtools panel — `@octane-xplat/devtools/panel`. The web build wraps
// App in a server picker (main.web.tsrx); the macOS app targets one record
// through the Shell. `plugin.ts` is the panel-plugin contract — a package
// default-exports a `defineDevtoolsPanel` result from the subpath named by
// its `octaneXplat.devtoolsPanel` field, and App renders it as a tab after
// the built-ins. The prebuilt web panel (`/devtools/app/`) passes no plugins.

export { App } from './App.tsrx'
export type { DevtoolsPanelProps } from './App.tsrx'
export { PanelModel } from './model'
export type { DevSocketFactory, LogLine, ActionRun } from './model'
export { defineDevtoolsPanel, resolveDevtoolsPanelPlugins } from './plugin.ts'
export type { DevtoolsPanelPlugin, DevtoolsPanelPluginProps } from './plugin.ts'
export type {
  BackendRef,
  DevtoolsConnection,
  DevtoolsMessage,
  DevtoolsServerRecord,
  SessionSnapshot,
} from '../client.ts'

export type { ListedDevtoolsServer } from '../record.ts'
export type { DevSocket } from '../types.ts'
