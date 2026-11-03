/** Keep data URIs on core's async WinRT decoder. Its synchronous base64 path
 * calls the pinned Windows host's unimplemented atob polyfill. */
export function resolveRasterSource(source: string): string | object | null {
  return source
}
