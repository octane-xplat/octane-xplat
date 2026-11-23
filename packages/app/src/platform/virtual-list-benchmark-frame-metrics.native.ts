export function observeAndroidFrames() {
  return {
    dispose: () => {},
    result: () => ({ status: 'not-collected', pollingIsFramePacing: false }),
  }
}
