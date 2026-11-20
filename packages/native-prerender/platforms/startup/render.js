/**
 * Non-native stub: the startup entry mounts and adopts platform-native views,
 * so it exists only inside a NativeScript iOS/Android runtime.
 */
export function renderWithStartup() {
  throw new Error(
    '@octane-xplat/native-prerender/startup requires a NativeScript iOS or Android runtime',
  )
}
