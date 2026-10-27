// Geofencing — native leaf, custom bridge (no NS plugin exists). iOS:
// CLLocationManager circular-region monitoring via a delegate class built
// with NSObject.extend. Android: GeofencingClient pending-intent broadcast
// (the receiver lives in platforms/android/java). Suspended delivery is the
// documented constraint: the OS relaunches the app, which must re-register a
// listener to drain buffered events.
import { Application, Utils, isIOS } from '@nativescript/core'
import { android } from '@octane-xplat/platform/android'
import type { GeofenceRegion, Geofencing, PermissionResult, RegionEvent, RegionEventListener } from './types'

declare const CLLocationManager: any
declare const CLLocationManagerDelegate: any
declare const CLCircularRegion: any
declare const CLLocationCoordinate2DMake: any

const listeners = new Set<RegionEventListener>()
let buffer: RegionEvent[] = []

function emit(event: RegionEvent): void {
	if (listeners.size === 0) {
		buffer.push(event)
		return
	}
	for (const listener of listeners) {
		listener(event)
	}
}

// iOS delegate — created once; forwards transitions into emit().
let locationManager: any = null
let DelegateClass: any = null
let delegate: any = null

function iosManager(): any {
	if (typeof CLLocationManager === 'undefined') {
		return null
	}
	if (!locationManager) {
		locationManager = CLLocationManager.new()
		if (!DelegateClass) {
			const NSObject = (globalThis as any).NSObject
			DelegateClass = NSObject.extend(
				{
					locationManagerDidEnterRegion(_m: any, region: any): void {
						emit({ identifier: String(region?.identifier ?? ''), eventType: 'enter' })
					},
					locationManagerDidExitRegion(_m: any, region: any): void {
						emit({ identifier: String(region?.identifier ?? ''), eventType: 'exit' })
					},
				},
				{ name: 'XplatGeofenceDelegate', protocols: [CLLocationManagerDelegate] },
			)
		}
		delegate = DelegateClass.new()
		locationManager.delegate = delegate
	}
	return locationManager
}

function iosEnsure(): Promise<PermissionResult> {
	const m = iosManager()
	if (!m) {
		return Promise.resolve('unsupported')
	}
	const status = CLLocationManager.authorizationStatus?.() ?? m.authorizationStatus?.() ?? 0
	// CLAuthorizationStatus: 3 authorizedAlways, 4 authorizedWhenInUse
	if (status === 3 || status === 4) {
		return Promise.resolve('granted')
	}
	if (status === 1 || status === 2) {
		return Promise.resolve('denied')
	}
	m.requestWhenInUseAuthorization()
	return new Promise((resolve) => {
		// iOS delivers the decision to the delegate — poll lightweightly rather
		// than build a second delegate surface for auth callbacks.
		const check = () => {
			const s = CLLocationManager.authorizationStatus?.() ?? 0
			if (s === 3 || s === 4) {
				resolve('granted')
			} else if (s === 1 || s === 2) {
				resolve('denied')
			} else {
				setTimeout(check, 250)
			}
		}
		setTimeout(check, 250)
	})
}

function androidEnsure(): Promise<PermissionResult> {
	const activity = Application.android.foregroundActivity ?? Application.android.startActivity
	try {
		return activity?.checkSelfPermission?.('android.permission.ACCESS_FINE_LOCATION') ===
			android.content.pm.PackageManager.PERMISSION_GRANTED
			? Promise.resolve('granted')
			: Promise.resolve('denied')
	} catch {
		return Promise.resolve('denied')
	}
}

function androidGeofencingClient(): any {
	const gms = (globalThis as any).com?.google?.android?.gms?.location
	const context = (Utils.android as any)?.getApplicationContext?.()
	return context && gms?.LocationServices ? gms.LocationServices.getGeofencingClient(context) : null
}

function androidPendingIntent(): any {
	const context = (Utils.android as any)?.getApplicationContext?.()
	const intent = new android.content.Intent(context, (globalThis as any).com.octanexplat.geofencing.GeofenceReceiver.class)
	const flags = android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_MUTABLE
	return android.app.PendingIntent.getBroadcast(context, 0, intent, flags)
}

// Android receiver delivery → JS. GeofenceReceiver queues events into the
// 'xplat_geofence_events' SharedPreferences file (it cannot reach a JS hook
// on a cold start); drainQueue() runs on a short poll while the app is live
// and again whenever a listener attaches.
const androidUtils = Utils.android as any
const prefs = () => androidUtils?.getApplicationContext?.()?.getSharedPreferences?.('xplat_geofence_events', 0)

function drainQueue(): void {
	const p = prefs()
	if (!p) {
		return
	}
	const raw = p.getString('queue', '[]')
	if (!raw || raw === '[]') {
		return
	}
	try {
		const queue = JSON.parse(raw)
		p.edit().putString('queue', '[]').apply()
		for (const item of queue) {
			emit({ identifier: String(item.identifier ?? ''), eventType: item.eventType === 'exit' ? 'exit' : 'enter' })
		}
	} catch {}
}

if (!isIOS) {
	setInterval(drainQueue, 5000)
	setTimeout(drainQueue, 0)
}

export const geofencing: Geofencing = {
	supported: isIOS ? typeof CLLocationManager !== 'undefined' : androidGeofencingClient() !== null,

	ensure(): Promise<PermissionResult> {
		return isIOS ? iosEnsure() : androidEnsure()
	},

	ensureBackground(): Promise<PermissionResult> {
		if (isIOS) {
			const m = iosManager()
			if (!m) {
				return Promise.resolve('unsupported')
			}
			const status = CLLocationManager.authorizationStatus?.() ?? 0
			if (status === 3) {
				return Promise.resolve('granted')
			}
			m.requestAlwaysAuthorization()
			return Promise.resolve(status === 3 ? 'granted' : 'denied')
		}
		const activity = Application.android.foregroundActivity ?? Application.android.startActivity
		try {
			return activity?.checkSelfPermission?.('android.permission.ACCESS_BACKGROUND_LOCATION') ===
				android.content.pm.PackageManager.PERMISSION_GRANTED
				? Promise.resolve('granted')
				: Promise.resolve('denied')
		} catch {
			return Promise.resolve('denied')
		}
	},

	async startMonitoring(regions: GeofenceRegion[]): Promise<void> {
		if (isIOS) {
			const m = iosManager()
			if (!m) {
				throw new Error('unsupported: CLLocationManager is not available')
			}
			for (const r of regions) {
				const center = CLLocationCoordinate2DMake(r.latitude, r.longitude)
				const region = CLCircularRegion.alloc().initWithCenterRadiusIdentifier(
					center,
					r.radius,
					r.identifier,
				)
				region.notifyOnEntry = r.notifyOnEnter ?? true
				region.notifyOnExit = r.notifyOnExit ?? true
				m.startMonitoringForRegion(region)
			}
			return
		}
		const client = androidGeofencingClient()
		if (!client) {
			throw new Error('unsupported: GeofencingClient is not on the classpath')
		}
		const gms = (globalThis as any).com.google.android.gms.location
		const builder = new gms.GeofencingRequest.Builder()
		builder.setInitialTrigger(gms.GeofencingRequest.INITIAL_TRIGGER_ENTER)
		for (const r of regions) {
			let transitions = 0
			if (r.notifyOnEnter ?? true) {transitions |= gms.Geofence.GEOFENCE_TRANSITION_ENTER}
			if (r.notifyOnExit ?? true) {transitions |= gms.Geofence.GEOFENCE_TRANSITION_EXIT}
			builder.addGeofence(
				new gms.Geofence.Builder()
					.setRequestId(r.identifier)
					.setCircularRegion(r.latitude, r.longitude, r.radius)
					.setTransitionTypes(transitions)
					.setExpirationDuration(gms.Geofence.NEVER_EXPIRE)
					.build(),
			)
		}
		client.addGeofences(builder.build(), androidPendingIntent())
	},

	async stopMonitoring(identifiers?: string[]): Promise<void> {
		if (isIOS) {
			const m = iosManager()
			const monitored = m?.monitoredRegions
			const all = monitored?.allObjects
			for (let i = 0; i < (all?.count ?? 0); i++) {
				const region = all.objectAtIndex(i)
				if (!identifiers?.length || identifiers.includes(String(region.identifier))) {
					m.stopMonitoringForRegion(region)
				}
			}
			return
		}
		const client = androidGeofencingClient()
		if (!client) {
			return
		}
		if (identifiers?.length) {
			client.removeGeofences(java.util.Arrays.asList(identifiers))
		} else {
			client.removeGeofences(androidPendingIntent())
		}
	},

	async getMonitoredRegions(): Promise<GeofenceRegion[]> {
		if (!isIOS) {
			return []
		}
		const m = iosManager()
		const all = m?.monitoredRegions?.allObjects
		const out: GeofenceRegion[] = []
		for (let i = 0; i < (all?.count ?? 0); i++) {
			const r = all.objectAtIndex(i)
			out.push({
				identifier: String(r.identifier),
				latitude: r.center?.latitude ?? 0,
				longitude: r.center?.longitude ?? 0,
				radius: r.radius ?? 0,
				notifyOnEnter: !!r.notifyOnEntry,
				notifyOnExit: !!r.notifyOnExit,
			})
		}
		return out
	},

	onRegionEvent(listener: RegionEventListener): () => void {
		listeners.add(listener)
		if (!isIOS) {
			drainQueue()
		}
		const pending = buffer
		buffer = []
		for (const event of pending) {
			listener(event)
		}
		return () => listeners.delete(listener)
	},
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners['location-always'] = () => geofencing.ensureBackground()
