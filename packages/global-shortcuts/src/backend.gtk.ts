import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { linuxKeysym } from './accelerator.js'
import type { BindOutcome, BindRequest, HotkeyBackend } from './backend.js'
import type { GlobalShortcutSupport } from './types.js'

// The shared gi.d.ts does not declare the Gio D-Bus surface used here; one
// documented runtime assertion per namespace, matching packages/tray.
interface PortalVariant {
  unpack(): unknown
  deepUnpack(): unknown
  get_child_value(index: number): PortalVariant
  get_variant(): PortalVariant
  print?(typeString: boolean): string
}

interface PortalConnection {
  call(
    busName: string | null,
    objectPath: string,
    interfaceName: string,
    methodName: string,
    parameters: PortalVariant | null,
    replyType: object | null,
    flags: number,
    timeoutMsec: number,
    cancellable: null,
    callback: (connection: PortalConnection, result: unknown) => void,
  ): void
  call_finish(result: unknown): PortalVariant
  call_sync(
    busName: string | null,
    objectPath: string,
    interfaceName: string,
    methodName: string,
    parameters: PortalVariant | null,
    replyType: object | null,
    flags: number,
    timeoutMsec: number,
    cancellable: null,
  ): PortalVariant
  close_sync(cancellable: null): void
  get_unique_name(): string
  signal_subscribe(
    sender: string | null,
    interfaceName: string | null,
    member: string | null,
    objectPath: string | null,
    arg0: string | null,
    flags: number,
    callback: (
      connection: PortalConnection,
      sender: string,
      objectPath: string,
      interfaceName: string,
      signalName: string,
      parameters: PortalVariant,
    ) => void,
  ): number
  signal_unsubscribe(subscriptionId: number): void
}

interface PortalApplication {
  get_application_id?(): string | null
  application_id?: string | null
  connect?(signal: string, handler: (...args: unknown[]) => unknown): number
  disconnect?(handlerId: number): void
}

type PortalGio = Omit<typeof Gio, 'Application'> & {
  Application: { get_default(): PortalApplication | null }
  BusType: { SESSION: number }
  DBusCallFlags: { NONE: number }
  DBusConnectionFlags: { AUTHENTICATION_CLIENT: number; MESSAGE_BUS_CONNECTION: number }
  DBusSignalFlags: { NONE: number }
  DBusConnection: {
    new_for_address_sync(
      address: string,
      flags: number,
      observer: null,
      cancellable: null,
    ): PortalConnection
  }
  dbus_address_get_for_bus_sync(busType: number, cancellable: null): string
}

type PortalGLib = typeof GLib & {
  Variant: { new (signature: string, value: unknown): PortalVariant }
  VariantType: { new (signature: string): object }
  timeout_add(priority: number, interval: number, fn: () => boolean): number
  source_remove(id: number): boolean
  PRIORITY_DEFAULT: number
}

const gio = Gio as unknown as PortalGio
const glib = GLib as unknown as PortalGLib

const PORTAL_NAME = 'org.freedesktop.portal.Desktop'
const PORTAL_PATH = '/org/freedesktop/portal/desktop'
const SHORTCUTS_IFACE = 'org.freedesktop.portal.GlobalShortcuts'
const REQUEST_IFACE = 'org.freedesktop.portal.Request'
const SESSION_IFACE = 'org.freedesktop.portal.Session'
const REGISTRY_IFACE = 'org.freedesktop.host.portal.Registry'
const PROPERTIES_IFACE = 'org.freedesktop.DBus.Properties'

const variant = (signature: string, value: unknown): PortalVariant =>
  new glib.Variant(signature, value)

interface LiveBinding {
  request: BindRequest
  portalId: string
  onPress: () => void
}

interface PendingBind {
  key: number
  portalId: string
  resolve(outcome: BindOutcome): void
}

let conn: PortalConnection | null = null
let connFailed = false
let subscriptions: number[] = []
let session: string | null = null
let sessionPromise: Promise<string | null> | null = null
let appId: string | null = null
let tokenCounter = 0
// Portal shortcut ids must be unique in the session; caller ids may repeat
// across registry instances.
const live = new Map<number, LiveBinding>()
const livePortalIds = new Map<string, number>()
const pendingBinds = new Map<number, PendingBind>()
const pendingResponses = new Map<string, (code: number, results: PortalVariant) => void>()
let rebindChain: Promise<unknown> = Promise.resolve()

function senderPath(): string {
  return conn!.get_unique_name().slice(1).replace(/\./g, '_')
}

function nextToken(prefix: string): string {
  tokenCounter += 1
  return `xplat_gs_${prefix}_${tokenCounter}`
}

function ensureConnection(): PortalConnection | null {
  if (conn !== null) {
    return conn
  }
  if (connFailed) {
    return null
  }
  try {
    const address = gio.dbus_address_get_for_bus_sync(gio.BusType.SESSION, null)
    conn = gio.DBusConnection.new_for_address_sync(
      address,
      gio.DBusConnectionFlags.AUTHENTICATION_CLIENT |
        gio.DBusConnectionFlags.MESSAGE_BUS_CONNECTION,
      null,
      null,
    )

    subscriptions = [
      conn.signal_subscribe(
        PORTAL_NAME,
        REQUEST_IFACE,
        'Response',
        null,
        null,
        gio.DBusSignalFlags.NONE,
        (_c, _s, path, _i, _n, params) => {
          const waiter = pendingResponses.get(path)
          if (waiter) {
            pendingResponses.delete(path)
            waiter(params.get_child_value(0).unpack() as number, params.get_child_value(1))
          }
        },
      ),
      conn.signal_subscribe(
        PORTAL_NAME,
        SHORTCUTS_IFACE,
        'Activated',
        null,
        null,
        gio.DBusSignalFlags.NONE,
        (_c, _s, _p, _i, _n, params) => {
          const unpacked = params.deepUnpack() as unknown[]
          const shortcutId = unpacked?.[1]
          if (typeof shortcutId !== 'string') {
            return
          }
          const key = livePortalIds.get(shortcutId)
          if (key !== undefined) {
            live.get(key)?.onPress()
          }
        },
      ),
      conn.signal_subscribe(
        PORTAL_NAME,
        SESSION_IFACE,
        'Closed',
        null,
        null,
        gio.DBusSignalFlags.NONE,
        (_c, _s, path) => {
          if (session !== null && path === session) {
            session = null
            sessionPromise = null
            for (const pending of pendingResponses.values()) {
              pending(-1, variant('a{sv}', {}))
            }

            pendingResponses.clear()
          }
        },
      ),
    ]

    return conn
  } catch {
    conn = null
    connFailed = true
    return null
  }
}

function callMethod(
  interfaceName: string,
  methodName: string,
  parameters: PortalVariant | null,
  replySignature: string | null,
): Promise<PortalVariant> {
  const bus = ensureConnection()
  if (bus === null) {
    return Promise.reject(new Error('no D-Bus session connection'))
  }
  return new Promise((resolve, reject) => {
    bus.call(
      PORTAL_NAME,
      PORTAL_PATH,
      interfaceName,
      methodName,
      parameters,
      replySignature === null ? null : new glib.VariantType(replySignature),
      gio.DBusCallFlags.NONE,
      -1,
      null,
      (connection, result) => {
        try {
          resolve(connection.call_finish(result))
        } catch (error) {
          reject(error)
        }
      },
    )
  })
}

function awaitResponse(
  path: string,
  timeoutMs: number,
): Promise<{ code: number; results: PortalVariant | null }> {
  return new Promise((resolve) => {
    let settled = false
    const timer = glib.timeout_add(glib.PRIORITY_DEFAULT, timeoutMs, () => {
      if (!settled) {
        settled = true
        pendingResponses.delete(path)
        resolve({ code: -1, results: null })
      }
      return false
    })
    pendingResponses.set(path, (code, results) => {
      if (!settled) {
        settled = true
        glib.source_remove(timer)
        resolve({ code, results })
      }
    })
  })
}

async function requestWithResponse(
  interfaceName: string,
  methodName: string,
  parameters: PortalVariant,
  options: { timeoutMs: number },
): Promise<{ code: number; results: PortalVariant | null }> {
  const reply = await callMethod(interfaceName, methodName, parameters, '(o)')
  const path = reply.get_child_value(0).unpack() as string
  return awaitResponse(path, options.timeoutMs)
}

function resolveAppId(request?: BindRequest): string {
  if (appId !== null) {
    return appId
  }
  const hinted = request?.appId?.trim()
  if (hinted) {
    appId = hinted
    return appId
  }
  try {
    const app = gio.Application.get_default()
    const fromApp = app?.get_application_id?.() ?? app?.application_id ?? null
    appId = typeof fromApp === 'string' && fromApp !== '' ? fromApp : ''
  } catch {
    appId = ''
  }
  return appId
}

async function ensureSession(request?: BindRequest): Promise<string | null> {
  if (session !== null) {
    return session
  }
  if (sessionPromise !== null) {
    return sessionPromise
  }
  sessionPromise = (async () => {
    const bus = ensureConnection()
    if (bus === null) {
      return null
    }
    const id = resolveAppId(request)
    if (id !== '') {
      // Host registry names the app for portal persistence; older portals
      // (<1.19) lack the interface — every failure here is tolerated.
      try {
        const reply = await requestWithResponse(
          REGISTRY_IFACE,
          'Register',
          variant('(sa{sv})', [id, {}]),
          { timeoutMs: 5000 },
        )

        void reply
      } catch {
        // Unknown method / older portal: continue without registry naming.
      }
    }
    try {
      const sessionToken = nextToken('sess')
      const response = await requestWithResponse(
        SHORTCUTS_IFACE,
        'CreateSession',
        variant('(a{sv})', [
          {
            handle_token: variant('s', nextToken('req')),
            session_handle_token: variant('s', sessionToken),
          },
        ]),
        { timeoutMs: 30000 },
      )

      if (response.code !== 0 || response.results === null) {
        return null
      }

      const results = response.results.deepUnpack() as Record<string, unknown>
      const handle = results['session_handle']
      session =
        typeof handle === 'string' && handle !== ''
          ? handle
          : `/org/freedesktop/portal/desktop/session/${senderPath()}/${sessionToken}`

      return session
    } catch {
      return null
    }
  })()
  const result = await sessionPromise
  if (result === null) {
    sessionPromise = null
  }
  return result
}

function closeSession(): void {
  const bus = conn
  const handle = session
  session = null
  sessionPromise = null
  if (bus === null || handle === null) {
    return
  }
  try {
    bus.call(
      PORTAL_NAME,
      handle,
      SESSION_IFACE,
      'Close',
      null,
      null,
      gio.DBusCallFlags.NONE,
      -1,
      null,
      () => {},
    )
  } catch {
    // Closing is best-effort; the private connection drops the session on
    // process exit regardless.
  }
}

function preferredTrigger(request: BindRequest): string | null {
  const keysym = linuxKeysym(request.accelerator.code)
  if (keysym === null) {
    return null
  }
  const parts: string[] = []
  if (request.accelerator.ctrl) {
    parts.push('CTRL')
  }
  if (request.accelerator.alt) {
    parts.push('ALT')
  }
  if (request.accelerator.shift) {
    parts.push('SHIFT')
  }
  if (request.accelerator.meta) {
    parts.push('LOGO')
  }
  parts.push(keysym)
  return parts.join('+')
}

function shortcutEntries(): [string, Record<string, PortalVariant>][] {
  const entries: [string, Record<string, PortalVariant>][] = []
  for (const binding of live.values()) {
    const props: Record<string, PortalVariant> = {
      description: variant('s', binding.request.description),
    }

    const trigger = preferredTrigger(binding.request)
    if (trigger !== null) {
      props['preferred_trigger'] = variant('s', trigger)
    }

    entries.push([binding.portalId, props])
  }
  return entries
}

function settlePending(
  keys: ReadonlySet<number>,
  results: PortalVariant | null,
  code: number,
): void {
  // results['shortcuts'] is a(sa{sv}): [shortcutId, {trigger_description, ...}]
  const granted = new Map<string, string>()
  if (results !== null && code === 0) {
    const unpacked = results.deepUnpack() as Record<string, unknown>
    const list = unpacked['shortcuts']
    if (Array.isArray(list)) {
      for (const row of list) {
        if (!Array.isArray(row)) {
          continue
        }

        const [id, props] = row as [unknown, unknown]
        if (typeof id !== 'string') {
          continue
        }

        const trigger =
          props !== null && typeof props === 'object'
            ? (props as Record<string, unknown>)['trigger_description']
            : null

        granted.set(id, typeof trigger === 'string' && trigger !== '' ? trigger : id)
      }
    }
  }
  for (const key of keys) {
    const pending = pendingBinds.get(key)
    if (pending === undefined) {
      continue
    }

    pendingBinds.delete(key)
    const trigger = granted.get(pending.portalId)
    if (code !== 0) {
      removeBinding(key)
      pending.resolve({
        ok: false,
        error: {
          code: code === -1 ? 'unavailable' : 'denied',
          message:
            code === -1
              ? 'The desktop did not answer the global shortcut request.'
              : `The desktop declined the global shortcut request (portal response ${code}).`,
        },
      })
    } else if (trigger === undefined) {
      // The desktop bound a subset (or nothing — seen on KDE 5.27 for
      // unpackaged apps); do not claim success the OS did not grant.
      removeBinding(key)
      pending.resolve({
        ok: false,
        error: {
          code: 'denied',
          message:
            'The desktop did not assign this global shortcut; it may need an installed desktop entry or user confirmation.',
        },
      })
    } else {
      pending.resolve({
        ok: true,
        trigger,
        release: async () => {
          removeBinding(key)
          await rebind()
        },
      })
    }
  }
}

function removeBinding(key: number): void {
  const binding = live.get(key)
  if (binding === undefined) {
    return
  }
  live.delete(key)
  livePortalIds.delete(binding.portalId)
  if (live.size === 0) {
    closeSession()
  }
}

function rebind(): Promise<void> {
  const work = rebindChain.then(async () => {
    if (live.size === 0) {
      return
    }
    const handle = await ensureSession()
    if (handle === null) {
      for (const [key, pending] of pendingBinds) {
        pendingBinds.delete(key)
        pending.resolve({
          ok: false,
          error: {
            code: 'unavailable',
            message: 'The desktop portal session for global shortcuts could not be created.',
          },
        })
      }

      return
    }
    // Settle only the binds included in this request; binds that arrive
    // while the D-Bus roundtrip is in flight wait for the next rebind.
    const settledKeys = new Set(pendingBinds.keys())
    try {
      const response = await requestWithResponse(
        SHORTCUTS_IFACE,
        'BindShortcuts',
        variant('(oa(sa{sv})sa{sv})', [
          handle,
          shortcutEntries(),
          '',
          { handle_token: variant('s', nextToken('req')) },
        ]),
        // The desktop may wait on the person in its shortcut settings; do
        // not impose a short deadline. Session Close still settles waiters.
        { timeoutMs: 300000 },
      )

      settlePending(settledKeys, response.results, response.code)
    } catch {
      settlePending(settledKeys, null, -1)
    }
  })
  rebindChain = work.catch(() => undefined)
  return work
}

const SUPPORT: GlobalShortcutSupport = {
  supported: true,
  platform: 'linux',
  mechanism: 'xdg-portal',
  assignment: 'desktop',
}

const UNSUPPORTED: GlobalShortcutSupport = {
  supported: false,
  platform: 'linux',
  mechanism: 'none',
  assignment: 'none',
  reason: 'This desktop does not provide the XDG GlobalShortcuts portal.',
}

export const backend: HotkeyBackend = {
  platform: 'linux',

  support() {
    const bus = ensureConnection()
    if (bus === null) {
      return Promise.resolve({
        ...UNSUPPORTED,
        reason: 'No D-Bus session bus is available.',
      })
    }
    try {
      const reply = bus.call_sync(
        PORTAL_NAME,
        PORTAL_PATH,
        PROPERTIES_IFACE,
        'Get',
        variant('(ss)', [SHORTCUTS_IFACE, 'version']),
        new glib.VariantType('(v)'),
        gio.DBusCallFlags.NONE,
        3000,
        null,
      )

      reply.get_child_value(0).get_variant().unpack()
      return Promise.resolve({ ...SUPPORT })
    } catch {
      return Promise.resolve({ ...UNSUPPORTED })
    }
  },

  bind(request: BindRequest, onPress: () => void): Promise<BindOutcome> {
    const bus = ensureConnection()
    if (bus === null) {
      return Promise.resolve({
        ok: false,
        error: {
          code: 'unsupported',
          message: 'No D-Bus session bus is available; global shortcuts need a desktop session.',
        },
      })
    }
    if (preferredTrigger(request) === null) {
      return Promise.resolve({
        ok: false,
        error: {
          code: 'invalid-accelerator',
          message: `The key ${request.accelerator.code} cannot be used for a global shortcut on Linux.`,
        },
      })
    }
    resolveAppId(request)
    const portalId = livePortalIds.has(request.id) ? `${request.id}~${request.key}` : request.id
    live.set(request.key, { request, portalId, onPress })
    livePortalIds.set(portalId, request.key)
    return new Promise((resolve) => {
      pendingBinds.set(request.key, { key: request.key, portalId, resolve })
      void rebind()
    })
  },

  onExit(listener: () => void): () => void {
    try {
      const app = gio.Application.get_default()
      const handlerId = app?.connect?.('shutdown', () => {
        listener()
        try {
          conn?.close_sync(null)
        } catch {
          // Connection already gone.
        }
      })

      return () => {
        if (typeof handlerId === 'number') {
          app?.disconnect?.(handlerId)
        }
      }
    } catch {
      return () => {}
    }
  },
}
