import { Screen, Text } from '@octane-xplat/ui'
import type { RouteLoaderArgs, RouteProps } from '../../routes.gen.contracts'
import { loadStock } from '../../stock.ts'

export function loader({ params }: RouteLoaderArgs<'/stock/:id'>) {
	return loadStock(params.id)
}

export function screen(props: RouteProps<'/stock/:id'>) {
	return <Screen><Text>{'In stock: ' + props.data.count}</Text></Screen>
}
