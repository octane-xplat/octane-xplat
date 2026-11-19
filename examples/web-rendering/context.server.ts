// 1. Keep request services on the server; transfer only public data.
export function requestContext(_request: Request) {
  return { serverOnly: 'example-server-only' }
}
