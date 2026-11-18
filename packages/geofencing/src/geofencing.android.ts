// Geofencing — Android leaf, custom bridge (no NS plugin exists).
// GeofencingClient pending-intent broadcast (the receiver lives in
// platforms/android/java). Suspended delivery is the documented constraint:
// the OS relaunches the app, which must re-register a listener to drain
// buffered events.
import { Application, Utils } from '@nativescript/core'
import { android, java } from '@octane-xplat/platform/android'
import { attachRegionListener, emitRegionEvent, flushRegionEvents } from './geofencing.mobile'
import type { GeofenceRegion, Geofencing, PermissionResult, RegionEventListener } from './types'

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

/** Geofence-monitoring service — see Geofencing. */
export const geofencing: Geofencing = {
  supported: androidGeofencingClient() !== null,

  ensure(): Promise<PermissionResult> {
    return androidEnsure()
  },

  ensureBackground(): Promise<PermissionResult> {
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
    const client = androidGeofencingClient()

    if (!client) {
      throw new Error('unsupported: GeofencingClient is not on the classpath')
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

    client.addGeofences(builder.build(), androidPendingIntent())
  },

  async stopMonitoring(identifiers?: string[]): Promise<void> {
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
    return []
  },

  onRegionEvent(listener: RegionEventListener): () => void {
    const detach = attachRegionListener(listener)

    drainQueue()
    flushRegionEvents(listener)
    return detach
  },
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners['location-always'] = () => geofencing.ensureBackground()
