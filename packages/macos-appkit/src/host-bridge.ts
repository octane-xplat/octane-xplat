export function createHostBridge() {
  const appKitBridge = (globalThis.__xplatAppKit ??= {})
  return {
    appKitBridge,
  }
}
