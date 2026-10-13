import { Text } from '@octane-xplat/ui'
import { defineStory } from '@octane-xplat/workshop'

// A platform leaf — proves linux story modules load only into the linux
// bundle. Inside the real GJS/WebKitGTK host the bridge handler exists; a
// plain DOM shows the honest fallback.
function HostBridge() {
	const bridged = Boolean(
		(globalThis as { webkit?: { messageHandlers?: { xplat?: unknown } } }).webkit
			?.messageHandlers?.xplat,
	)

	return <Text>{bridged ? 'Host bridge: connected' : 'Host bridge: absent'}</Text>
}

export const Bridge = defineStory({
	id: 'platform/linux-host',
	title: 'Platform / Linux host bridge',
	targets: ['linux'],
	component: HostBridge,
	args: {},
})
