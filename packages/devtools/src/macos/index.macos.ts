// macOS leaf barrel — `@octane-xplat/devtools/macos`. JSC-host-only pieces for
// the native devtools app: the Network.framework DevSocket and the Foundation
// discovery-record reader.

export { nwDevSocket } from './socket.macos.ts'
export { listDevtoolsServers } from './servers.macos.ts'
export type { ListedDevtoolsServer } from '../record.ts'
