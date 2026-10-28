/** @jsxImportSource @octane-xplat/jsx/dom */
import { useImperativeHandle, useEffect, useRef } from 'octane'
import { Loader } from '@googlemaps/js-api-loader'
import type { MapViewHandle, MapViewProps } from './props'
import { webApiKey } from './maps.web'

const MAP_TYPE: Record<string, string> = {
	normal: 'roadmap',
	satellite: 'satellite',
	terrain: 'terrain',
	hybrid: 'hybrid',
	none: 'roadmap',
}

let loaderPromise: Promise<any> | null = null

function loadMaps(): Promise<any> {
	if (!loaderPromise) {
		const key = webApiKey()
		if (!key) {
			return Promise.reject(new Error('maps.init({apiKey}) must run before <MapView>'))
		}

		loaderPromise = new Loader({ apiKey: key, version: 'weekly' })
			.load()
			.then(() => (globalThis as any).google.maps)
	}

	return loaderPromise
}

/** Google Maps JS leaf — same engine as native, so prop semantics match. */
export function MapView(props: MapViewProps) @{
	const el = useRef<HTMLDivElement | null>(null)
	const map = useRef<any>(null)
	const overlays = useRef(new Map<string, any>())
	const latest = useRef(props)
	latest.current = props

	const handle = (g: any): MapViewHandle => ({
		animateCamera: (camera) => {
			g?.panTo({ lat: camera.coordinates.latitude, lng: camera.coordinates.longitude })
			if (camera.zoom !== undefined) {
				g?.setZoom(camera.zoom)
			}
		},
		fitCoordinates: (coordinates, padding = 50) => {
			const bounds = new (globalThis as any).google.maps.LatLngBounds()
			for (const c of coordinates) {
				bounds.extend({ lat: c.latitude, lng: c.longitude })
			}

			g?.fitBounds(bounds, padding)
		},
		snapshot: () => Promise.reject(new Error('unsupported: map snapshot is not available on web')),
		native: g,
	})

	useImperativeHandle(props.ref, () => handle(map.current), [])

	function sync() {
		const g = map.current
		const G = (globalThis as any).google?.maps
		if (!g || !G) {
			return
		}

		const p = latest.current
		if (p.mapType) {
			g.setMapTypeId(MAP_TYPE[p.mapType])
		}

		if (p.userLocationEnabled !== undefined && navigator.geolocation && p.userLocationEnabled) {
			navigator.geolocation.getCurrentPosition((pos) => {
				const marker = new G.Marker({
					position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
					map: g,
					title: 'Current location',
				})

				overlays.current.set('userlocation:', marker)
			})
		}

		const syncSet = (kind: string, defs: any[] | undefined, apply: (def: any) => any) => {
			const want = new Map((defs ?? []).map((d, i) => [d.id ?? `anon-${i}`, d]))
			for (const [key, ref] of overlays.current) {
				if (key.startsWith(`${kind}:`) && !want.has(key.slice(kind.length + 1))) {
					ref.setMap(null)
					overlays.current.delete(key)
				}
			}

			for (const [key, def] of want) {
				if (!overlays.current.has(`${kind}:${key}`)) {
					overlays.current.set(`${kind}:${key}`, apply(def))
				}
			}
		}

		syncSet('marker', p.markers, (def) => {
			const marker = new G.Marker({
				position: { lat: def.coordinates.latitude, lng: def.coordinates.longitude },
				map: g,
				title: def.title,
				draggable: def.draggable,
				opacity: def.opacity,
				rotation: def.rotation,
			})

			if (def.onTap) {
				marker.addListener('click', def.onTap)
			}

			return marker
		})

		syncSet(
			'polyline',
			p.polylines,
			(def) =>
				new G.Polyline({
					path: def.points.map((c: any) => ({ lat: c.latitude, lng: c.longitude })),
					map: g,
					strokeColor: def.color,
					strokeWeight: def.width,
					geodesic: def.geodesic,
				}),
		)

		syncSet(
			'polygon',
			p.polygons,
			(def) =>
				new G.Polygon({
					paths: [def.points, ...(def.holes ?? [])].map((ring: any[]) =>
						ring.map((c) => ({ lat: c.latitude, lng: c.longitude })),
					),
					map: g,
					fillColor: def.fillColor,
					strokeColor: def.strokeColor,
					strokeWeight: def.strokeWidth,
				}),
		)

		syncSet(
			'circle',
			p.circles,
			(def) =>
				new G.Circle({
					center: { lat: def.center.latitude, lng: def.center.longitude },
					radius: def.radius,
					map: g,
					fillColor: def.fillColor,
					strokeColor: def.strokeColor,
					strokeWeight: def.strokeWidth,
				}),
		)
	}

	useEffect(() => {
		const host = el.current
		if (!host) {
			return
		}

		let cancelled = false
		loadMaps()
			.then((G) => {
				if (cancelled) {
					return
				}

				const camera = latest.current.cameraPosition
				map.current = new G.Map(host, {
					center: camera
						? { lat: camera.coordinates.latitude, lng: camera.coordinates.longitude }
						: { lat: 0, lng: 0 },
					zoom: camera?.zoom ?? 2,
					mapTypeId: MAP_TYPE[latest.current.mapType ?? 'normal'],
				})

				map.current.addListener('click', (e: any) => {
					latest.current.onMapClick?.({
						coordinates: { latitude: e.latLng.lat(), longitude: e.latLng.lng() },
					})
				})

				map.current.addListener('center_changed', () => {
					const c = map.current.getCenter()
					latest.current.onCameraMove?.({
						cameraPosition: {
							coordinates: { latitude: c.lat(), longitude: c.lng() },
							zoom: map.current.getZoom(),
						},
						state: 'move',
					})
				})

				map.current.addListener('idle', () => {
					const c = map.current.getCenter()
					latest.current.onCameraMove?.({
						cameraPosition: {
							coordinates: { latitude: c.lat(), longitude: c.lng() },
							zoom: map.current.getZoom(),
						},
						state: 'idle',
					})
				})

				sync()
				latest.current.onMapReady?.()
			})
			.catch((e) => latest.current.onError?.({ message: e?.message ?? String(e) }))

		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		const g = map.current
		if (!g) {
			return
		}

		const c = props.cameraPosition
		if (c) {
			g.setCenter({ lat: c.coordinates.latitude, lng: c.coordinates.longitude })
			if (c.zoom !== undefined) {
				g.setZoom(c.zoom)
			}
		}

		sync()
	}, [JSON.stringify(props.cameraPosition)])

	useEffect(sync, [
		props.mapType,
		props.userLocationEnabled,
		JSON.stringify(props.markers),
		JSON.stringify(props.polylines),
		JSON.stringify(props.polygons),
		JSON.stringify(props.circles),
	])

	<div
		ref={(e: HTMLDivElement | null) => {
			el.current = e
		}}
		style={props.style}
		className={props.className}
	/>
}
