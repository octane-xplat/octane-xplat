/** @jsxImportSource @octane-xplat/jsx */
// Map view — windows stub. No maps engine ships a windows backend; renders
// nothing and reports via onError once.
import { useEffect } from 'octane'
import type { MapViewProps } from './props'

export function MapView(props: MapViewProps): unknown @{
	useEffect(() => {
		props.onError?.({ message: 'unsupported: MapView is not available on windows' })
	}, [])

	<placeholder style={props.style} className={props.className} />
}
