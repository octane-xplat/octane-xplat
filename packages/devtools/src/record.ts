// Host-neutral discovery-record validation, shared by the Node records leaf
// (src/host/records.ts) and the macOS Foundation leaf
// (src/macos/servers.macos.ts). Mirrors dev_server_record.go: records live
// under the native history cache in dev-servers-v1/<app-key>/server.json, one
// per app, each carrying the panel's devtoolsToken. The RPC token is never
// returned to the panel.

export interface ListedDevtoolsServer {
  /** app-key directory the record was published under. */
  key: string
  appRoot: string
  endpoint: string
  instanceId: string
  devtoolsToken: string
}

const ENDPOINT = /^http:\/\/127\.0\.0\.1:\d{1,5}\/rpc$/

// Light validation only — connectDevtools enforces the full contract before
// opening a socket. Records that fail here are omitted, not fatal.
// `isAbsolutePath` is the host's own absolute-path check (node:path on Node,
// a POSIX leading-slash check on the JSC host).
export function parseDevtoolsServerRecord(
  key: string,
  data: string,
  isAbsolutePath: (path: string) => boolean,
): ListedDevtoolsServer | null {
  let record: unknown

  try {
    record = JSON.parse(data)
  } catch {
    return null
  }

  if (
    typeof record !== 'object' ||
    record === null ||
    (record as { protocol?: unknown }).protocol !== 'octane-dev-server' ||
    (record as { version?: unknown }).version !== 1
  ) {
    return null
  }

  const { appRoot, endpoint, instanceId, devtoolsToken } = record as {
    appRoot?: unknown
    endpoint?: unknown
    instanceId?: unknown
    devtoolsToken?: unknown
  }

  if (
    typeof appRoot !== 'string' ||
    !isAbsolutePath(appRoot) ||
    typeof endpoint !== 'string' ||
    !ENDPOINT.test(endpoint) ||
    typeof instanceId !== 'string' ||
    !/^[a-f0-9]{32}$/.test(instanceId) ||
    typeof devtoolsToken !== 'string' ||
    !/^[a-f0-9]{64}$/.test(devtoolsToken)
  ) {
    return null
  }

  return { key, appRoot, endpoint, instanceId, devtoolsToken }
}
