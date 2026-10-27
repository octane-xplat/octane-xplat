/** @jsxImportSource @nativescript-community/octane */
import { useImperativeHandle, useCallback, useEffect, useRef } from 'octane'
import { isAndroid } from '@nativescript/core'
import { registerElement } from '@nativescript-community/octane'
import {
	CameraUpdate,
	CameraPosition as NativeCameraPosition,
	MapView as NativeMapView,
	type Coordinate,
} from '@nativescript/google-maps'
import type { CameraEvent, CircleDef, MapViewHandle, MapViewProps, MarkerDef, PolygonDef, PolylineDef } from './props'
import type { CameraPosition } from './props'

registerElement('xplatmapview', NativeMapView)

const toCoord = (c: { latitude: number; longitude: number }): Coordinate => ({
	lat: c.latitude,
	lng: c.longitude,
})
const fromCoord = (c: Coordinate) => ({ latitude: c.lat, longitude: c.lng })

let defIds = 0
const keyed = <T extends { id?: string }>(items: T[] | undefined) =>
	new Map((items ?? []).map((item) => [item.id ?? `anon-${defIds++}`, item]))

/** Declarative Google Map — declarative prop arrays are diffed into the
 *  plugin's imperative add/remove overlay API keyed by def id. */
export function MapView(props: MapViewProps) @{
	const host = useRef<NativeMapView | null>(null)
	const map = useRef<any>(null)
	const overlays = useRef(new Map<string, any>())
	const latest = useRef(props)
	latest.current = props

	const bindHost = useCallback((v: NativeMapView | null) => {
		host.current = v
	}, [])

	const mapOf = () => map.current

	const handle = (v: any): MapViewHandle => ({
		animateCamera: (camera, options) => {
			const update = CameraUpdate.fromCoordinate(toCoord(camera.coordinates), camera.zoom ?? 0)
			if (options?.duration !== undefined) {
				mapOf()?.animateCamera(update, options.duration)
			} else {
				mapOf()?.animateCamera(update)
			}
		},
		fitCoordinates: (coordinates, padding = 50) => {
			mapOf()?.animateCamera(CameraUpdate.fromCoordinates(coordinates.map(toCoord), padding))
		},
		snapshot: () => mapOf()?.snapshot(),
		native: v,
	})
	useImperativeHandle(props.ref, () => handle(host.current), [])

	useEffect(() => {
		const v = host.current
		if (!v) {
			return
		}
		v.on('ready', (e: any) => {
			map.current = e?.map
			syncAll()
			latest.current.onMapReady?.()
		})
		v.on('mapTap', (e: any) => {
			if (e?.coordinate) {
				latest.current.onMapClick?.({ coordinates: fromCoord(e.coordinate) })
			}
		})
		v.on('mapLongPress', (e: any) => {
			if (e?.coordinate) {
				latest.current.onMapLongPress?.({ coordinates: fromCoord(e.coordinate) })
			}
		})
		v.on('cameraPosition', (e: any) => {
			const p = e?.cameraPosition
			if (!p) {
				return
			}
			const out: CameraEvent = {
				cameraPosition: {
					coordinates: fromCoord(p.target),
					zoom: p.zoom,
					bearing: p.bearing,
					tilt: p.tilt,
				},
				state: e?.state ?? 'idle',
				isGesture: e?.isGesture,
			}
			latest.current.onCameraMove?.(out)
		})
		v.on('markerTap', (e: any) => {
			const def = e?.marker?.userData?.def as MarkerDef | undefined
			def?.onTap?.()
		})
		const bag = isAndroid ? props.android : props.ios
		if (bag) {
			Object.assign(v, bag)
		}
	}, [])

	function syncOverlays<T extends { id?: string }>(
		kind: 'marker' | 'polyline' | 'polygon' | 'circle',
		defs: T[] | undefined,
		apply: (def: T, key: string) => any,
	) {
		const g = mapOf()
		if (!g) {
			return
		}
		const want = keyed(defs)
		for (const [key, ref] of overlays.current) {
			if (key.startsWith(`${kind}:`) && !want.has(key.slice(kind.length + 1))) {
				g[`remove${kind[0].toUpperCase()}${kind.slice(1)}`]?.(ref)
				overlays.current.delete(key)
			}
		}
		for (const [key, def] of want) {
			const fullKey = `${kind}:${key}`
			if (!overlays.current.has(fullKey)) {
				const created = apply(def, key)
				if (created) {
					overlays.current.set(fullKey, created)
				}
			}
		}
	}

	function syncAll() {
		const g = mapOf()
		if (!g) {
			return
		}
		const p = latest.current
		if (p.cameraPosition) {
			g.cameraPosition = new NativeCameraPosition(
				toCoord(p.cameraPosition.coordinates),
				p.cameraPosition.zoom ?? 0,
				p.cameraPosition.bearing ?? 0,
				p.cameraPosition.tilt ?? 0,
			)
		}
		if (p.mapType) {
			g.mapType = p.mapType
		}
		if (p.userLocationEnabled !== undefined) {
			g.myLocationEnabled = p.userLocationEnabled
		}
		syncOverlays('marker', p.markers, (def: MarkerDef) =>
			g.addMarker({
				position: toCoord(def.coordinates),
				title: def.title,
				snippet: def.snippet,
				color: def.color,
				draggable: def.draggable,
				rotation: def.rotation,
				opacity: def.opacity,
				userData: { def },
			}),
		)
		syncOverlays('polyline', p.polylines, (def: PolylineDef) =>
			g.addPolyline({
				points: def.points.map(toCoord),
				color: def.color,
				width: def.width,
				geodesic: def.geodesic,
			}),
		)
		syncOverlays('polygon', p.polygons, (def: PolygonDef) =>
			g.addPolygon({
				points: def.points.map(toCoord),
				holes: (def.holes ?? []).map((ring) => ring.map(toCoord)),
				fillColor: def.fillColor,
				strokeColor: def.strokeColor,
				strokeWidth: def.strokeWidth,
			}),
		)
		syncOverlays('circle', p.circles, (def: CircleDef) =>
			g.addCircle({
				center: toCoord(def.center),
				radius: def.radius,
				fillColor: def.fillColor,
				strokeColor: def.strokeColor,
				strokeWidth: def.strokeWidth,
			}),
		)
	}

	useEffect(syncAll, [
		props.mapType,
		props.userLocationEnabled,
		JSON.stringify(props.cameraPosition),
		JSON.stringify(props.markers?.map((m) => m.id)),
		JSON.stringify(props.markers),
		JSON.stringify(props.polylines),
		JSON.stringify(props.polygons),
		JSON.stringify(props.circles),
	])

	<xplatmapview ref={bindHost} style={props.style} className={props.className} />
}
