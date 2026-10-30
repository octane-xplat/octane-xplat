// Map view — macOS stub. MKMapView is bridgeable through the AppKit host but
// not wired; renders nothing (null) and reports via onError once. The leaf has
// no JSX — a masonview leaf would need a macos-renderer dependency this
// package doesn't take.
import { useEffect } from 'octane'
import type { MapViewProps } from './props'

export function MapView(props: MapViewProps): void @{
	useEffect(() => {
		props.onError?.({ message: 'unsupported: MapView is not wired on macOS' })
	}, [])
}
