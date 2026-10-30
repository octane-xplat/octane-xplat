import type { Octane } from 'octane/jsx-runtime'
import type { Coordinate, MapType } from './types'

/** Where the map camera looks. */
export interface CameraPosition {
	/** Lat/lng points. */
	coordinates: Coordinate
	/** Zoom level — platform-specific scale. */
	zoom?: number
	/** Rotation in degrees clockwise from north. */
	bearing?: number
	/** Viewing angle in degrees from vertical. */
	tilt?: number
}

/** A point marker. */
export interface MarkerDef {
	/** App-chosen id echoed back in tap events. */
	id?: string
	/** Lat/lng points. */
	coordinates: Coordinate
	/** Callout title text. */
	title?: string
	/** Callout subtitle text. */
	snippet?: string
	/** Marker tint (CSS color) or a platform image reference. */
	color?: string
	/** Custom marker image. */
	icon?: unknown
	/** Marker can be dragged. */
	draggable?: boolean
	/** Marker rotation in degrees. */
	rotation?: number
	/** Marker opacity 0-1. */
	opacity?: number
	/** Marker tapped. */
	onTap?: () => void
}

/** A stroked path. */
export interface PolylineDef {
	/** App-chosen id echoed back in tap events. */
	id?: string
	/** Ordered vertices. */
	points: Coordinate[]
	/** Stroke/fill color (any platform color string). */
	color?: string
	/** Stroke width in dips. */
	width?: number
	/** Follow the geodesic curve between points. */
	geodesic?: boolean
}

/** A filled polygon, optionally with holes. */
export interface PolygonDef {
	/** App-chosen id echoed back in tap events. */
	id?: string
	/** Ordered vertices. */
	points: Coordinate[]
	/** Interior hole paths. */
	holes?: Coordinate[][]
	/** Interior fill color. */
	fillColor?: string
	/** Border color. */
	strokeColor?: string
	/** Border width in dips. */
	strokeWidth?: number
}

/** A filled circle overlay. */
export interface CircleDef {
	/** App-chosen id echoed back in tap events. */
	id?: string
	/** Circle center coordinate. */
	center: Coordinate
	/** Circle radius in meters. */
	radius: number
	/** Interior fill color. */
	fillColor?: string
	/** Border color. */
	strokeColor?: string
	/** Border width in dips. */
	strokeWidth?: number
}

/** Camera-change payload. */
export interface CameraEvent {
	/** Controlled camera — pair with onCameraMove to own it. */
	cameraPosition: CameraPosition
	/** 'start' = gesture/animation begin, 'move' = mid-move, 'idle' = settled. */
	state: 'idle' | 'start' | 'move'
	/** True when the camera move came from user input. */
	isGesture?: boolean
}

/** Imperative handle exposed through the map `ref`. */
export interface MapViewHandle {
	/** Animate the camera to a new position. */
	animateCamera(camera: CameraPosition, options?: { duration?: number }): void
	/** Fit the camera to these coordinates with padding (px/dip). */
	fitCoordinates(coordinates: Coordinate[], padding?: number): void
	/** Capture the current viewport as an image. */
	snapshot(): Promise<unknown>
	/** The platform map view (any — plugin/MapKit/web surfaces differ). */
	native: unknown
}

/** Declarative map view — Google Maps on every target (one engine, real
 *  parity; expo-maps' per-OS provider split is deliberately not followed).
 *  Navigation, geocoding, and clustering stay out of scope. */
export interface MapViewProps {
	/** Class list applied to the map element. */
	className?: any
	/** Inline style (string CSS or object). */
	style?: any
	/** Controlled camera — pair with onCameraMove to own it. */
	cameraPosition?: CameraPosition
	/** Point markers on the map. */
	markers?: MarkerDef[]
	/** Polylines drawn on the map. */
	polylines?: PolylineDef[]
	/** Filled polygons on the map. */
	polygons?: PolygonDef[]
	/** Circle overlays on the map. */
	circles?: CircleDef[]
	/** Basemap style (standard/satellite/hybrid/terrain). */
	mapType?: MapType
	/** Show the my-location dot — ensures the 'location' permission first. */
	userLocationEnabled?: boolean
	/** Fires once the map view is ready for handle calls. */
	onMapReady?: () => void
	/** Map tapped — carries the tapped coordinate. */
	onMapClick?: (e: { coordinates: Coordinate }) => void
	/** Map long-pressed — carries the coordinate. */
	onMapLongPress?: (e: { coordinates: Coordinate }) => void
	/** Camera changed; isGesture marks user-driven moves. */
	onCameraMove?: (e: CameraEvent) => void
	/** Map engine errors. */
	onError?: (e: { message: string }) => void
	/** Imperative handle — see MapViewHandle. */
	ref?: Octane.Ref<MapViewHandle>
	/** Platform escape hatch (MapView props). */
	ios?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	android?: Record<string, any>
	/** Platform escape hatch — same bag contract as `ios`. */
	web?: Record<string, any>
}
