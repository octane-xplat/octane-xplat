/** @jsxImportSource @octane-xplat/macos-renderer */
import { Text } from '@octane-xplat/ui'
import type { RouteProps } from '../../default-routes.gen.contracts'
export const dataMode = 'baked'
export default function BakedRoute(props: RouteProps<'/baked'>): any {
	return <Text id="baked-route-title">{props.data.title + ':' + props.data.count}</Text>
}
