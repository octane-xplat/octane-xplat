/** @jsxImportSource @octane-xplat/jsx */
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

/** Mount only while the reading screen is open. */
export function ReadingScreen() {
	useKeepAwake()
	return <Text>Your reading screen stays awake while it is open.</Text>
}
