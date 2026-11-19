// geofencing.android leaf tests. @nativescript/core is mocked and the
// gms/global interop surfaces are replaced with faithful stub shapes so the
// permission-request flow, Task awaiting, and the persisted region registry
// are exercised in node — not a substitute for native smoke.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const PERM_FINE = 'android.permission.ACCESS_FINE_LOCATION'
const PERM_BACKGROUND = 'android.permission.ACCESS_BACKGROUND_LOCATION'
const GRANTED = 0

const mock = vi.hoisted(() => {
  const granted = new Set<string>()
  const requests: { perms: string[]; requestCode: number }[] = []
  const handlers = new Map<string, Set<(args: unknown) => void>>()
  const stores = new Map<string, Map<string, string>>()
  const prefs = (name: string) => {
    let store = stores.get(name)

    if (!store) {
      store = new Map()
      stores.set(name, store)
    }

    return {
      getString: (key: string, fallback: string) => store!.get(key) ?? fallback,
      edit: () => ({
        putString: (key: string, value: string) => ({
          apply: () => void store!.set(key, value),
        }),
      }),
    }
  }
  const activity = {
    checkSelfPermission: (perm: string) => (granted.has(perm) ? GRANTED : -1),
    requestPermissions: (perms: string[], requestCode: number) => {
      requests.push({ perms, requestCode })
    },
  }
  const context = { getSharedPreferences: (name: string, _mode: number) => prefs(name) }
  const task = (ok: boolean, failure: unknown = new Error('task failed')) => ({
    addOnCompleteListener: (listener: { onComplete(t: unknown): void }) =>
      listener.onComplete({ isSuccessful: () => ok, getException: () => failure }),
  })
  const client = {
    addGeofences: vi.fn(() => task(true)),
    removeGeofences: vi.fn(() => task(true)),
  }

  return { granted, requests, handlers, stores, activity, context, task, client }
})

vi.mock('@nativescript/core', () => ({
  Application: {
    android: {
      activityRequestPermissionsEvent: 'activityRequestPermissions',
      get foregroundActivity() {
        return mock.activity
      },
      startActivity: null,
      on(event: string, handler: (args: unknown) => void) {
        let set = mock.handlers.get(event)

        if (!set) {
          set = new Set()
          mock.handlers.set(event, set)
        }

        set.add(handler)
      },
      off(event: string, handler: (args: unknown) => void) {
        mock.handlers.get(event)?.delete(handler)
      },
    },
  },
  Utils: {
    android: {
      getApplicationContext: () => mock.context,
    },
  },
}))

import { geofencing } from '../src/geofencing.android.ts'

let sdkInt = 35

function stubAndroidRuntime() {
  // gms Builder chain — every method returns itself, .build() yields an
  // opaque request object.
  const chainable: any = new Proxy(function () {}, {
    get: (_t, p) => (p === 'build' ? () => ({}) : chainable),
    construct: () => chainable,
    apply: () => chainable,
  })

  ;(globalThis as any).android = {
    os: { Build: { VERSION: { get SDK_INT() { return sdkInt } } } },
    app: {
      PendingIntent: {
        FLAG_UPDATE_CURRENT: 1,
        FLAG_MUTABLE: 2,
        getBroadcast: vi.fn(() => ({})),
      },
    },
    content: {
      pm: { PackageManager: { PERMISSION_GRANTED: GRANTED } },
      Intent: class Intent {
        constructor(_context: unknown, _cls: unknown) {}
      },
    },
  }

  ;(globalThis as any).java = { util: { Arrays: { asList: (list: string[]) => list } } }

  ;(globalThis as any).com = {
    octanexplat: { geofencing: { GeofenceReceiver: { class: {} } } },
    google: {
      android: {
        gms: {
          tasks: {
            OnCompleteListener: class {
              constructor(impl: { onComplete(t: unknown): void }) {
                Object.assign(this, impl)
              }
            },
          },
          location: {
            LocationServices: { getGeofencingClient: () => mock.client },
            GeofencingRequest: { Builder: chainable, INITIAL_TRIGGER_ENTER: 1 },
            Geofence: {
              Builder: chainable,
              GEOFENCE_TRANSITION_ENTER: 1,
              GEOFENCE_TRANSITION_EXIT: 2,
              NEVER_EXPIRE: -1,
            },
          },
        },
      },
    },
  }
}

// Deliver the permission-prompt result the way the NS runtime does: the
// grant happens first, then the activity fires the result event.
function answerRequest(
  index: number,
  perms: string[],
  decision: 'granted' | 'denied',
): void {
  const request = mock.requests[index]

  if (decision === 'granted') {
    for (const perm of perms) {
      mock.granted.add(perm)
    }
  }

  for (const handler of mock.handlers.get('activityRequestPermissions') ?? []) {
    handler({
      requestCode: request.requestCode,
      grantResults: perms.map(() => (decision === 'granted' ? GRANTED : -1)),
    })
  }
}

beforeEach(() => {
  sdkInt = 35
  stubAndroidRuntime()
})

afterEach(() => {
  mock.granted.clear()
  mock.requests.length = 0
  mock.handlers.clear()
  mock.stores.clear()
  mock.client.addGeofences.mockClear()
  mock.client.removeGeofences.mockClear()
})

describe('geofencing.ensure (fine location)', () => {
  it('resolves granted without prompting when already granted', async () => {
    mock.granted.add(PERM_FINE)

    await expect(geofencing.ensure()).resolves.toBe('granted')
    expect(mock.requests).toHaveLength(0)
  })

  it('requests ACCESS_FINE_LOCATION and resolves from the prompt result', async () => {
    const pending = geofencing.ensure()

    expect(mock.requests).toHaveLength(1)
    expect(mock.requests[0].perms).toEqual([PERM_FINE])

    answerRequest(0, [PERM_FINE], 'granted')
    await expect(pending).resolves.toBe('granted')
    expect(mock.handlers.get('activityRequestPermissions')?.size ?? 0).toBe(0)
  })

  it('resolves denied when the user declines', async () => {
    const pending = geofencing.ensure()

    answerRequest(0, [PERM_FINE], 'denied')
    await expect(pending).resolves.toBe('denied')
  })

  it('resolves denied when no activity can issue the prompt', async () => {
    const activity = mock.activity

    ;(mock as any).activity = null
    try {
      await expect(geofencing.ensure()).resolves.toBe('denied')
    } finally {
      ;(mock as any).activity = activity
    }
  })
})

describe('geofencing.ensureBackground', () => {
  it('requests fine first, then background, on API 29+', async () => {
    const pending = geofencing.ensureBackground()

    expect(mock.requests).toHaveLength(1)
    expect(mock.requests[0].perms).toEqual([PERM_FINE])

    answerRequest(0, [PERM_FINE], 'granted')
    await Promise.resolve()
    await Promise.resolve()

    expect(mock.requests).toHaveLength(2)
    expect(mock.requests[1].perms).toEqual([PERM_BACKGROUND])

    answerRequest(1, [PERM_BACKGROUND], 'granted')
    await expect(pending).resolves.toBe('granted')
  })

  it('skips the fine prompt when fine is already granted', async () => {
    mock.granted.add(PERM_FINE)

    const pending = geofencing.ensureBackground()

    expect(mock.requests).toHaveLength(1)
    expect(mock.requests[0].perms).toEqual([PERM_BACKGROUND])

    answerRequest(0, [PERM_BACKGROUND], 'denied')
    await expect(pending).resolves.toBe('denied')
  })

  it('resolves denied when the fine request is declined', async () => {
    const pending = geofencing.ensureBackground()

    answerRequest(0, [PERM_FINE], 'denied')
    await expect(pending).resolves.toBe('denied')
    expect(mock.requests).toHaveLength(1)
  })

  it('needs only fine location below API 29', async () => {
    sdkInt = 28

    const pending = geofencing.ensureBackground()

    expect(mock.requests).toHaveLength(1)
    expect(mock.requests[0].perms).toEqual([PERM_FINE])

    answerRequest(0, [PERM_FINE], 'granted')
    await expect(pending).resolves.toBe('granted')
    expect(mock.requests).toHaveLength(1)
  })

  it('resolves granted when background is already held', async () => {
    mock.granted.add(PERM_BACKGROUND)

    await expect(geofencing.ensureBackground()).resolves.toBe('granted')
    expect(mock.requests).toHaveLength(0)
  })
})

describe('geofencing monitoring', () => {
  const region = (id: string) => ({
    identifier: id,
    latitude: 1,
    longitude: 2,
    radius: 100,
  })

  it('rejects when the GeofencingClient task fails and keeps no registry entry', async () => {
    mock.client.addGeofences.mockImplementationOnce(() => mock.task(false) as any)

    await expect(geofencing.startMonitoring([region('a')])).rejects.toThrow('task failed')
    await expect(geofencing.getMonitoredRegions()).resolves.toEqual([])
  })

  it('persists regions so getMonitoredRegions survives the process', async () => {
    await geofencing.startMonitoring([region('a'), region('b')])

    const regions = await geofencing.getMonitoredRegions()

    expect(regions.map((r) => r.identifier).sort()).toEqual(['a', 'b'])
  })

  it('drops stopped identifiers and clears on untargeted stop', async () => {
    await geofencing.startMonitoring([region('a'), region('b')])
    await geofencing.stopMonitoring(['a'])

    expect((await geofencing.getMonitoredRegions()).map((r) => r.identifier)).toEqual(['b'])

    await geofencing.stopMonitoring()

    expect(await geofencing.getMonitoredRegions()).toEqual([])
  })

  it('rejects a failed removal and preserves the registry', async () => {
    await geofencing.startMonitoring([region('a')])
    mock.client.removeGeofences.mockImplementationOnce(() => mock.task(false) as any)

    await expect(geofencing.stopMonitoring(['a'])).rejects.toThrow('task failed')
    expect((await geofencing.getMonitoredRegions()).map((r) => r.identifier)).toEqual(['a'])
  })
})
