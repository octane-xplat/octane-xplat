import GLib from 'gi://GLib'

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    // NativeScript's windowless entry point stays alive for JS timers.
    if (typeof setTimeout === 'function') {
      setTimeout(resolve, ms)
      return
    }
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
      resolve()
      return false
    })
  })
}
