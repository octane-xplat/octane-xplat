import type { Octane } from 'octane/jsx-runtime'
import type { Coordinate, MapType } from './types'

export interface CameraPosition {
	coordinates: Coordinate
	zoom?: number
	bearing?: number
	tilt?: number
}

export interface MarkerDef {
	id?: string
	coordinates: Coordinate
	title?: string
	snippet?: string
	/** Marker tint (CSS color) or a platform image reference. */
	color?: string
	icon?: unknown
	draggable?: boolean
	rotation?: number
	opacity?: number
	onTap?: () => void
}

export interface PolylineDef {
	id?: string
	points: Coordinate[]
	color?: string
	width?: number
	geodesic?: boolean
}

export interface PolygonDef {
	id?: string
	points: Coordinate[]
	holes?: Coordinate[][]
	fillColor?: string
	strokeColor?: string
	strokeWidth?: number
}

export interface CircleDef {
	id?: string
	center: Coordinate
	radius: number
	fillColor?: string
	strokeColor?: string
	strokeWidth?: number
}

export interface CameraEvent {
	cameraPosition: CameraPosition
	/** 'start' = gesture/animation begin, 'move' = mid-move, 'idle' = settled. */
	state: 'idle' | 'start' | 'move'
	isGesture?: boolean
}

export interface MapViewHandle {
	animateCamera(camera: CameraPosition, options?: { duration?: number }): void
	/** Fit the camera to these coordinates with padding (px/dip). */
	fitCoordinates(coordinates: Coordinate[], padding?: number): void
	snapshot(): Promise<unknown>
	native: unknown
}

/** Declarative map view — Google Maps on every target (one engine, real
 *  parity; expo-maps' per-OS provider split is deliberately not followed).
 *  Navigation, geocoding, and clustering stay out of scope. */
export interface MapViewProps {
	className?: any
	style?: any
	cameraPosition?: CameraPosition
	markers?: MarkerDef[]
	polylines?: PolylineDef[]
	polygons?: PolygonDef[]
	circles?: CircleDef[]
	mapType?: MapType
	/** Show the my-location dot — ensures the 'location' permission first. */
	userLocationEnabled?: boolean
	onMapReady?: () => void
	onMapClick?: (e: { coordinates: Coordinate }) => void
	onMapLongPress?: (e: { coordinates: Coordinate }) => void
	onCameraMove?: (e: CameraEvent) => void
	onError?: (e: { message: string }) => void
	ref?: Octane.Ref<MapViewHandle>
	ios?: Record<string, any>
	android?: Record<string, any>
	web?: Record<string, any>
}
