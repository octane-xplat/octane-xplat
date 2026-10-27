/** @jsxImportSource @octane-xplat/macos-renderer */
// Map view — macOS stub. MKMapView is bridgeable through the AppKit host but
// not wired; renders nothing and reports via onError once.
import { useEffect } from 'octane'
import type { MapViewProps } from './props'

export function MapView(props: MapViewProps) @{
	useEffect(() => {
		props.onError?.({ message: 'unsupported: MapView is not wired on macOS' })
	}, [])

	<masonview style={props.style} className={props.className} />
}
