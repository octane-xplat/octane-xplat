// Geofencing — iOS leaf, custom bridge (no NS plugin exists).
// CLLocationManager circular-region monitoring via a delegate class built
// with NSObject.extend. Suspended delivery is the documented constraint: the
// OS relaunches the app, which must re-register a listener to drain buffered
// events.
import { attachRegionListener, emitRegionEvent, flushRegionEvents } from './geofencing.mobile'
import type { GeofenceRegion, Geofencing, PermissionResult, RegionEventListener } from './types'

declare const CLLocationManager: any
declare const CLLocationManagerDelegate: any
declare const CLCircularRegion: any
declare const CLLocationCoordinate2DMake: any

// iOS delegate — created once; forwards transitions into emitRegionEvent().
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
            emitRegionEvent({ identifier: String(region?.identifier ?? ''), eventType: 'enter' })
          },
          locationManagerDidExitRegion(_m: any, region: any): void {
            emitRegionEvent({ identifier: String(region?.identifier ?? ''), eventType: 'exit' })
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

/** Geofence-monitoring service — see Geofencing. */
export const geofencing: Geofencing = {
  supported: typeof CLLocationManager !== 'undefined',

  ensure(): Promise<PermissionResult> {
    return iosEnsure()
  },

  ensureBackground(): Promise<PermissionResult> {
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
  },

  async startMonitoring(regions: GeofenceRegion[]): Promise<void> {
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
  },

  async stopMonitoring(identifiers?: string[]): Promise<void> {
    const m = iosManager()
    const monitored = m?.monitoredRegions
    const all = monitored?.allObjects

    for (let i = 0; i < (all?.count ?? 0); i++) {
      const region = all.objectAtIndex(i)

      if (!identifiers?.length || identifiers.includes(String(region.identifier))) {
        m.stopMonitoringForRegion(region)
      }
    }
  },

  async getMonitoredRegions(): Promise<GeofenceRegion[]> {
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
    const detach = attachRegionListener(listener)

    flushRegionEvents(listener)
    return detach
  },
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners['location-always'] = () => geofencing.ensureBackground()
