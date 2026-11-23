// Geofencing — Android leaf, custom bridge (no NS plugin exists).
// GeofencingClient pending-intent broadcast (the receiver lives in
// platforms/android/java). Suspended delivery is the documented constraint:
// the OS relaunches the app, which must re-register a listener to drain
// buffered events.
import { Application, Utils } from '@nativescript/core'
import type { PermissionStatus } from '@octane-xplat/platform'
import { android, java } from '@octane-xplat/platform/android'
import { attachRegionListener, emitRegionEvent, flushRegionEvents } from './geofencing.mobile'
import type { GeofenceRegion, Geofencing, PermissionResult, RegionEventListener } from './types'

const PERMISSION_FINE = 'android.permission.ACCESS_FINE_LOCATION'
const PERMISSION_BACKGROUND = 'android.permission.ACCESS_BACKGROUND_LOCATION'

let geofenceRequestCode = 7741

function checkGranted(perm: string): boolean {
  const activity = Application.android.foregroundActivity ?? Application.android.startActivity

  try {
    return (
      activity?.checkSelfPermission?.(perm) ===
      android.content.pm.PackageManager.PERMISSION_GRANTED
    )
  } catch {
    return false
  }
}

// Runtime prompt through the host activity — same requestPermissionsEvent
// convention as the other capability leaves (barcode-scanner, camera,
// recorder). The result handler re-reads the permission rather than
// trusting grantResults: on API 30+ the background-location prompt routes
// through Settings, so the live status is the only reliable answer.
function requestPermission(perm: string): Promise<PermissionResult> {
  const activity = Application.android.foregroundActivity ?? Application.android.startActivity

  if (!activity?.requestPermissions) {
    return Promise.resolve('denied')
  }

  return new Promise<PermissionResult>((resolve) => {
    const requestCode = geofenceRequestCode++
    const event = Application.android.activityRequestPermissionsEvent
    const onResult = (args: any) => {
      if (args.requestCode !== requestCode) {
        return
      }

      Application.android.off(event, onResult)
      resolve(checkGranted(perm) ? 'granted' : 'denied')
    }

    Application.android.on(event, onResult)
    try {
      activity.requestPermissions([perm], requestCode)
    } catch {
      Application.android.off(event, onResult)
      resolve('denied')
    }
  })
}

function androidEnsure(): Promise<PermissionResult> {
  if (checkGranted(PERMISSION_FINE)) {
    return Promise.resolve('granted')
  }

  return requestPermission(PERMISSION_FINE)
}

// ACCESS_BACKGROUND_LOCATION exists from API 29 — below it, background
// delivery needs only fine location. When the SDK level cannot be read
// (a stub or non-Android host) assume modern, since the only cost is a
// request for a permission the OS does not know, which resolves denied.
function sdkInt(): number {
  try {
    const sdk = android.os.Build.VERSION.SDK_INT

    return typeof sdk === 'number' ? sdk : 29
  } catch {
    return 29
  }
}

async function androidEnsureBackground(): Promise<PermissionResult> {
  if (sdkInt() >= 29 && checkGranted(PERMISSION_BACKGROUND)) {
    return 'granted'
  }

  // The OS ignores a background prompt until fine is granted.
  if (!checkGranted(PERMISSION_FINE)) {
    if ((await androidEnsure()) !== 'granted') {
      return 'denied'
    }
  }

  return sdkInt() >= 29 ? requestPermission(PERMISSION_BACKGROUND) : 'granted'
}

function androidGeofencingClient(): any {
  const gms = (globalThis as any).com?.google?.android?.gms?.location
  const context = (Utils.android as any)?.getApplicationContext?.()

  return context && gms?.LocationServices ? gms.LocationServices.getGeofencingClient(context) : null
}

function androidPendingIntent(): any {
  const context = (Utils.android as any)?.getApplicationContext?.()
  const intent = new android.content.Intent(
    context,
    (globalThis as any).com.octanexplat.geofencing.GeofenceReceiver.class,
  )

  const flags =
    android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_MUTABLE

  return android.app.PendingIntent.getBroadcast(context, 0, intent, flags)
}

// Android receiver delivery → JS. GeofenceReceiver queues events into the
// 'xplat_geofence_events' SharedPreferences file (it cannot reach a JS hook
// on a cold start); drainQueue() runs on a short poll while the app is live
// and again whenever a listener attaches.
const androidUtils = Utils.android as any
const prefs = () =>
  androidUtils?.getApplicationContext?.()?.getSharedPreferences?.('xplat_geofence_events', 0)

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
      emitRegionEvent({
        identifier: String(item.identifier ?? ''),
        eventType: item.eventType === 'exit' ? 'exit' : 'enter',
      })
    }
  } catch {}
}

setInterval(drainQueue, 5000)
setTimeout(drainQueue, 0)

// GeofencingClient returns gms Tasks — without awaiting their completion a
// failed registration (missing permission, Play Services off) resolves the
// JS promise as though it succeeded.
function awaitTask(task: any): Promise<void> {
  const OnComplete = (globalThis as any).com?.google?.android?.gms?.tasks?.OnCompleteListener

  if (!task || !OnComplete || typeof task.addOnCompleteListener !== 'function') {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    task.addOnCompleteListener(
      new OnComplete({
        onComplete(t: any) {
          if (t?.isSuccessful?.() === false) {
            reject(t.getException?.() ?? new Error('GeofencingClient operation failed'))
          } else {
            resolve()
          }
        },
      }),
    )
  })
}

// Geofence registrations outlive the process — the receiver fires on the
// OS's schedule and relaunches the app — so the monitored-region list must
// persist too. The 'xplat_geofence_regions' SharedPreferences file mirrors
// every successful start/stop call; Android exposes no API to enumerate
// registered geofences.
const REGION_PREFS = 'xplat_geofence_regions'

function readRegionRegistry(): GeofenceRegion[] {
  try {
    const raw = androidUtils
      ?.getApplicationContext?.()
      ?.getSharedPreferences?.(REGION_PREFS, 0)
      ?.getString('regions', '[]')

    const list: unknown = raw ? JSON.parse(raw) : []

    return Array.isArray(list)
      ? list.filter(
          (r): r is GeofenceRegion =>
            typeof r === 'object' &&
            r !== null &&
            typeof (r as GeofenceRegion).identifier === 'string' &&
            typeof (r as GeofenceRegion).latitude === 'number' &&
            typeof (r as GeofenceRegion).longitude === 'number' &&
            typeof (r as GeofenceRegion).radius === 'number',
        )
      : []
  } catch {
    return []
  }
}

function writeRegionRegistry(regions: GeofenceRegion[]): void {
  try {
    androidUtils
      ?.getApplicationContext?.()
      ?.getSharedPreferences?.(REGION_PREFS, 0)
      ?.edit()
      ?.putString('regions', JSON.stringify(regions))
      ?.apply()
  } catch {}
}

/** Geofence-monitoring service — see Geofencing. */
export const geofencing: Geofencing = {
  supported: androidGeofencingClient() !== null,

  ensure(): Promise<PermissionResult> {
    return androidEnsure()
  },

  ensureBackground(): Promise<PermissionResult> {
    return androidEnsureBackground()
  },

  async startMonitoring(regions: GeofenceRegion[]): Promise<void> {
    const client = androidGeofencingClient()

    if (!client) {
      throw new Error('unsupported: GeofencingClient is not on the classpath')
    }

    if (regions.length === 0) {
      return
    }

    const gms = (globalThis as any).com.google.android.gms.location
    const builder = new gms.GeofencingRequest.Builder()

    builder.setInitialTrigger(gms.GeofencingRequest.INITIAL_TRIGGER_ENTER)
    for (const r of regions) {
      let transitions = 0

      if (r.notifyOnEnter ?? true) {
        transitions |= gms.Geofence.GEOFENCE_TRANSITION_ENTER
      }

      if (r.notifyOnExit ?? true) {
        transitions |= gms.Geofence.GEOFENCE_TRANSITION_EXIT
      }

      builder.addGeofence(
        new gms.Geofence.Builder()
          .setRequestId(r.identifier)
          .setCircularRegion(r.latitude, r.longitude, r.radius)
          .setTransitionTypes(transitions)
          .setExpirationDuration(gms.Geofence.NEVER_EXPIRE)
          .build(),
      )
    }

    await awaitTask(client.addGeofences(builder.build(), androidPendingIntent()))

    // Persist only after the client accepted the request — re-registering an
    // identifier replaces it, so merge over the existing entries.
    const known = readRegionRegistry().filter(
      (r) => !regions.some((n) => n.identifier === r.identifier),
    )

    writeRegionRegistry([...known, ...regions])
  },

  async stopMonitoring(identifiers?: string[]): Promise<void> {
    const client = androidGeofencingClient()

    if (!client) {
      return
    }

    if (identifiers?.length) {
      await awaitTask(client.removeGeofences(java.util.Arrays.asList(identifiers)))
      const drop = new Set(identifiers)

      writeRegionRegistry(readRegionRegistry().filter((r) => !drop.has(r.identifier)))
    } else {
      await awaitTask(client.removeGeofences(androidPendingIntent()))
      writeRegionRegistry([])
    }
  },

  async getMonitoredRegions(): Promise<GeofenceRegion[]> {
    return readRegionRegistry()
  },

  onRegionEvent(listener: RegionEventListener): () => void {
    const detach = attachRegionListener(listener)

    drainQueue()
    flushRegionEvents(listener)
    return detach
  },
}

// Non-prompting authorization read for the dispatcher's getPermissions.
// Android can't distinguish never-asked from denied without the rationale
// hook — report undetermined and let request resolve it.
function androidAlwaysStatus(): PermissionStatus {
  const activity = Application.android.foregroundActivity ?? Application.android.startActivity

  return activity?.checkSelfPermission?.('android.permission.ACCESS_BACKGROUND_LOCATION') ===
    android.content.pm.PackageManager.PERMISSION_GRANTED
    ? 'granted'
    : 'undetermined'
}

const toResponse = (status: PermissionStatus) => ({
  status,
  granted: status === 'granted',
  canAskAgain: status === 'granted' || status === 'undetermined',
})

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners['location-always'] = {
  getPermissions: async () => toResponse(androidAlwaysStatus()),
  requestPermissions: async () => toResponse(await geofencing.ensureBackground()),
}
