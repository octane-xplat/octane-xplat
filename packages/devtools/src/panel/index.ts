// Shared devtools panel — `@octane-xplat/devtools/panel`. The web build wraps
// App in a server picker (main.web.tsrx); the macOS app mounts one App per
// discovered record with the nwDevSocket transport.

export { App } from './App.tsrx'
export type { DevtoolsPanelProps } from './App.tsrx'
export { PanelModel } from './model'
export type { DevSocketFactory, LogLine, ActionRun } from './model'
export type { DevtoolsServerRecord } from '../client.ts'
export type { ListedDevtoolsServer } from '../record.ts'
export type { DevSocket } from '../types.ts'
