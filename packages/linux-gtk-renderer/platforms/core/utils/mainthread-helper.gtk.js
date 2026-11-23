import GLib from 'gi://GLib'
export function isMainThread() {
  return true
}
export function dispatchToMainThread(callback) {
  GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
    callback()
    return GLib.SOURCE_REMOVE
  })
}
export const dispatchToUIThread = dispatchToMainThread
