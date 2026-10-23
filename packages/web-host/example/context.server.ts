/** Request services live on the server; transfer projects only public data. */
export function requestContext(_request: Request) {
	return { serverOnly: 'example-server-only' }
}
