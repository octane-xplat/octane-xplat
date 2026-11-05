// Explicit Go foreground dev owns this channel. Only an app/target credential
// enters generated code; it cannot authenticate the CLI's private HTTP API.
export function nativeDevSocketPlugin() {
	const source = process.env.XPLAT_DEV_APP_BRIDGE
	if (!source) return null
	if (source.length > 8192) throw new Error('Invalid native app bridge configuration')
	let bridge
	try {
		bridge = JSON.parse(source)
	} catch {
		throw new Error('Invalid native app bridge JSON')
	}
	const endpoint = new URL(bridge.socket)
	if (
		bridge.protocol !== 'octane-app-debug' ||
		bridge.version !== 1 ||
		endpoint.protocol !== 'ws:' ||
		endpoint.hostname !== '127.0.0.1' ||
		!endpoint.port ||
		endpoint.pathname !== '/app' ||
		endpoint.username ||
		endpoint.password ||
		endpoint.hash ||
		!/^[a-f0-9]{32}$/.test(bridge.instanceId) ||
		!/^[a-f0-9]{64}$/.test(bridge.token) ||
		typeof bridge.targetId !== 'string' ||
		!bridge.targetId ||
		endpoint.searchParams.get('instance') !== bridge.instanceId ||
		endpoint.searchParams.get('target') !== bridge.targetId ||
		[...endpoint.searchParams].length !== 2
	)
		throw new Error('Invalid native app bridge identity')
	return {
		name: 'xplat-native-app-debug',
		apply: (_config: unknown, environment: { command: string; mode: string }) =>
			environment.command === 'serve' || environment.mode === 'development',
		config() {
			return {
				define: {
					__XPLAT_DEV_BRIDGE__: JSON.stringify({
						token: bridge.token,
						socket: bridge.socket,
						instanceId: bridge.instanceId,
						targetId: bridge.targetId,
					}),
				},
			}
		},
	}
}
