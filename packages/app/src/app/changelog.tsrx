import { Screen, Text } from '@octane-xplat/ui'
import type { RouteProps } from '../routes.gen.contracts'

/** changelog — `dataMode: 'baked'`: the sibling changelog.loader.ts runs
 *  during `xplat routes`/dev/build and its JSON result ships inside the
 *  bundle as `props.data`. No runtime fetch on any target. */
export const dataMode = 'baked'

export function Changelog(props: RouteProps<'/changelog'>) @{
	<Screen className="vx-app changelog gap-3">
		<Text className="text-2xl font-semibold">Changelog (baked)</Text>
		<Text className="text-sm text-muted">{'app version: ' + props.data.version}</Text>
		<Text className="text-sm text-muted">
			{'entries baked: ' + String(props.data.entries.length)}
		</Text>
		<Text className="text-sm text-muted">
			{'first entry: ' + (props.data.entries[0]?.note ?? '—')}
		</Text>
	</Screen>
}
