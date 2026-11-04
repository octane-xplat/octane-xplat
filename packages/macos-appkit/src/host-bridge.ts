export type HostBridge = ReturnType<typeof createHostBridge>

export function createHostBridge() {
  const appKitBridge = (globalThis.__xplatAppKit ??= {})
  return {
    appKitBridge,
  }
}
