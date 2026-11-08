// Tray over the StatusNotifierItem + com.canonical.dbusmenu protocols in pure
// Gio D-Bus — GTK4 has no tray API and target distros may ship no
// appindicator/dbusmenu typelibs.

import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GdkPixbuf from 'gi://GdkPixbuf'

import { TrayError } from './errors.js'
import {
  dispatchTraySelect,
  normalizeTrayOptions,
  normalizeTrayUpdate,
  resolvePlatformIcon,
  safeCall,
  type NormalizedTrayOptions,
} from './menu.js'

import type {
  AppResidency,
  Tray,
  TrayAvailability,
  TrayIcon,
  TrayMenuItem,
  TrayOptions,
  TrayRadioOption,
  TrayUpdate,
} from './types.js'

interface TrayVariant {
  deepUnpack(): unknown
}

interface TrayDBusConnection {
  call_sync(
    busName: string | null,
    objectPath: string,
    interfaceName: string,
    methodName: string,
    parameters: TrayVariant | null,
    replyType: object | null,
    flags: number,
    timeoutMsec: number,
    cancellable: null,
  ): TrayVariant
  close_sync(cancellable: null): void
  emit_signal(
    destinationBusName: string | null,
    objectPath: string,
    interfaceName: string,
    signalName: string,
    parameters: TrayVariant | null,
    cancellable: null,
  ): boolean
}

interface TrayDBusExportedObject {
  export(connection: TrayDBusConnection, objectPath: string): void
  unexport(): void
  emit_signal(signalName: string, parameters: TrayVariant | null): void
}

interface GtkWindowLike {
  present(): void
  set_visible(visible: boolean): void
  get_visible(): boolean
  set_hide_on_close(hide: boolean): void
  get_hide_on_close(): boolean
}

interface GtkApplicationLike {
  hold(): void
  release(): void
  get_windows(): GtkWindowLike[]
}

// The shared gi.d.ts does not declare the Gio D-Bus surface used here; these
// two intersections are the single documented runtime assertions per namespace.
type TrayGio = Omit<typeof Gio, 'Application'> & {
  Application: { get_default(): GtkApplicationLike | null }
  BusType: { SESSION: number }
  BusNameWatcherFlags: { NONE: number }
  DBusCallFlags: { NONE: number }
  DBusConnectionFlags: { AUTHENTICATION_CLIENT: number; MESSAGE_BUS_CONNECTION: number }
  Credentials: { new: () => { get_unix_pid(): number } }
  DBusConnection: {
    new_for_address_sync(
      address: string,
      flags: number,
      observer: null,
      cancellable: null,
    ): TrayDBusConnection
  }
  DBusExportedObject: {
    wrapJSObject(xml: string, implementation: object): TrayDBusExportedObject
  }
  dbus_address_get_for_bus_sync(busType: number, cancellable: null): string
  bus_get_sync(busType: number, cancellable: null): TrayDBusConnection
  bus_watch_name_on_connection(
    connection: TrayDBusConnection,
    name: string,
    flags: number,
    nameAppeared:
      | ((connection: TrayDBusConnection, name: string, nameOwner: string) => void)
      | null,
    nameVanished: ((connection: TrayDBusConnection, name: string) => void) | null,
  ): number
  bus_unwatch_name(watcherId: number): void
}

type TrayGLib = typeof GLib & {
  Variant: { new (signature: string, value: unknown): TrayVariant }
  VariantType: { new (signature: string): object }
}

const gio = Gio as unknown as TrayGio
const glib = GLib as unknown as TrayGLib

export type * from './types.js'
export { TrayError } from './errors.js'

const SNI_NAME = 'org.kde.StatusNotifierItem'
const SNI_PATH = '/StatusNotifierItem'
const SNI_WATCHER_NAME = 'org.kde.StatusNotifierWatcher'
const SNI_WATCHER_PATH = '/StatusNotifierWatcher'
const DBUSMENU_IFACE = 'com.canonical.dbusmenu'
const DBUSMENU_PATH = '/MenuBar'
const DBUS_PROPERTIES = 'org.freedesktop.DBus.Properties'
const FREEDESKTOP = 'org.freedesktop.DBus'
const FREEDESKTOP_PATH = '/org/freedesktop/DBus'

const SNI_XML = `<node>
	<interface name="org.kde.StatusNotifierItem">
		<property name="Category" type="s" access="read"/>
		<property name="Id" type="s" access="read"/>
		<property name="Title" type="s" access="read"/>
		<property name="Status" type="s" access="read"/>
		<property name="WindowId" type="u" access="read"/>
		<property name="IconThemePath" type="s" access="read"/>
		<property name="IconName" type="s" access="read"/>
		<property name="IconPixmap" type="a(iiay)" access="read"/>
		<property name="OverlayIconName" type="s" access="read"/>
		<property name="OverlayIconPixmap" type="a(iiay)" access="read"/>
		<property name="AttentionIconName" type="s" access="read"/>
		<property name="AttentionIconPixmap" type="a(iiay)" access="read"/>
		<property name="AttentionMovieName" type="s" access="read"/>
		<property name="ToolTip" type="(sa(iiay)ss)" access="read"/>
		<property name="Menu" type="o" access="read"/>
		<property name="ItemIsMenu" type="b" access="read"/>
		<property name="XAyatanaLabel" type="s" access="read"/>
		<property name="XAyatanaLabelGuide" type="s" access="read"/>
		<method name="Activate"><arg type="i" direction="in"/><arg type="i" direction="in"/></method>
		<method name="SecondaryActivate"><arg type="i" direction="in"/><arg type="i" direction="in"/></method>
		<method name="ContextMenu"><arg type="i" direction="in"/><arg type="i" direction="in"/></method>
		<method name="Scroll"><arg type="i" direction="in"/><arg type="s" direction="in"/></method>
		<signal name="NewTitle"/>
		<signal name="NewIcon"/>
		<signal name="NewAttentionIcon"/>
		<signal name="NewOverlayIcon"/>
		<signal name="NewToolTip"/>
		<signal name="NewStatus"><arg type="s"/></signal>
		<signal name="XAyatanaNewLabel"><arg type="s"/><arg type="s"/></signal>
	</interface>
</node>`

const DBUSMENU_XML = `<node>
	<interface name="com.canonical.dbusmenu">
		<property name="Version" type="u" access="read"/>
		<property name="TextDirection" type="s" access="read"/>
		<property name="Status" type="s" access="read"/>
		<property name="IconThemePath" type="as" access="read"/>
		<method name="GetLayout">
			<arg type="i" direction="in"/><arg type="i" direction="in"/><arg type="as" direction="in"/>
			<arg type="u" direction="out"/><arg type="(ia{sv}av)" direction="out"/>
		</method>
		<method name="GetGroupProperties">
			<arg type="ai" direction="in"/><arg type="as" direction="in"/>
			<arg type="a(ia{sv})" direction="out"/>
		</method>
		<method name="GetProperty">
			<arg type="i" direction="in"/><arg type="s" direction="in"/>
			<arg type="v" direction="out"/>
		</method>
		<method name="Event">
			<arg type="i" direction="in"/><arg type="s" direction="in"/><arg type="v" direction="in"/><arg type="u" direction="in"/>
		</method>
		<method name="EventGroup">
			<arg type="a(isvu)" direction="in"/>
			<arg type="ai" direction="out"/>
		</method>
		<method name="AboutToShow">
			<arg type="i" direction="in"/><arg type="b" direction="out"/>
		</method>
		<method name="AboutToShowGroup">
			<arg type="ai" direction="in"/><arg type="ai" direction="out"/><arg type="ai" direction="out"/>
		</method>
		<signal name="LayoutUpdated"><arg type="u"/><arg type="i"/></signal>
		<signal name="ItemsPropertiesUpdated"><arg type="a(ia{sv})"/><arg type="a(ias)"/></signal>
		<signal name="ItemActivationRequested"><arg type="i"/><arg type="u"/></signal>
	</interface>
</node>`

interface PixbufLike {
  get_width(): number
  get_height(): number
  get_rowstride(): number
  get_n_channels(): number
  get_has_alpha(): boolean
  get_pixels(): Uint8Array
  add_alpha(substitute: boolean, red: number, green: number, blue: number): PixbufLike
  scale_simple(width: number, height: number, interp: number): PixbufLike
}

type Pixmap = [number, number, Uint8Array]
type PropertyMap = Record<string, TrayVariant>

interface MenuNode {
  id: number
  props: PropertyMap
  children: MenuNode[]
  item?: TrayMenuItem
  option?: TrayRadioOption
}

const variant = (signature: string, value: unknown) => new glib.Variant(signature, value)

function pixbufToArgb(source: PixbufLike): Pixmap {
  const pixbuf = source.get_has_alpha() ? source : source.add_alpha(false, 0, 0, 0)
  const width = pixbuf.get_width()
  const height = pixbuf.get_height()
  const stride = pixbuf.get_rowstride()
  const channels = pixbuf.get_n_channels()
  const pixels = pixbuf.get_pixels()
  // The spec wants 32-bit ARGB in network byte order: byte sequence A,R,G,B.
  const argb = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = y * stride + x * channels
      const dst = (y * width + x) * 4
      argb[dst] = channels === 4 ? pixels[src + 3] : 255
      argb[dst + 1] = pixels[src]
      argb[dst + 2] = pixels[src + 1]
      argb[dst + 3] = pixels[src + 2]
    }
  }
  return [width, height, argb]
}

function iconPixmaps(path: string): Pixmap[] {
  let loaded: PixbufLike
  try {
    loaded = GdkPixbuf.Pixbuf.new_from_file(path)
  } catch (error) {
    throw new TrayError('invalid-icon', `tray icon file is not readable: ${path}`)
  }
  if (!loaded) {
    throw new TrayError('invalid-icon', `tray icon file is not readable: ${path}`)
  }
  const sizes: Pixmap[] = [pixbufToArgb(loaded)]
  for (const edge of [24, 48]) {
    const width = loaded.get_width()
    const height = loaded.get_height()
    if (width === 0 || height === 0 || Math.max(width, height) === edge) {
      continue
    }

    const scale = edge / Math.max(width, height)
    const scaled = loaded.scale_simple(
      Math.max(1, Math.round(width * scale)),
      Math.max(1, Math.round(height * scale)),
      GdkPixbuf.InterpType.BILINEAR,
    )

    sizes.push(pixbufToArgb(scaled))
  }
  return sizes
}

interface IconState {
  name: string
  pixmaps: Pixmap[]
}

function loadIcon(icon: TrayIcon): IconState {
  if (icon.type === 'named') {
    return { name: icon.name, pixmaps: [] }
  }
  return { name: '', pixmaps: iconPixmaps(icon.path) }
}

function processId(): string {
  try {
    return String(gio.Credentials.new().get_unix_pid())
  } catch {
    return `j${Math.floor(Math.random() * 36 ** 6).toString(36)}`
  }
}

let registrationCounter = 0

/** Whether the session bus is reachable and a status notifier host is registered. */
function checkStatusNotifierHost(conn: TrayDBusConnection): 'ok' | 'no-host' {
  try {
    const owned = conn.call_sync(
      FREEDESKTOP,
      FREEDESKTOP_PATH,
      FREEDESKTOP,
      'NameHasOwner',
      variant('(s)', [SNI_WATCHER_NAME]),
      new glib.VariantType('(b)'),
      gio.DBusCallFlags.NONE,
      -1,
      null,
    )

    if ((owned.deepUnpack() as boolean[])[0] !== true) {
      return 'no-host'
    }

    const registered = conn.call_sync(
      SNI_WATCHER_NAME,
      SNI_WATCHER_PATH,
      DBUS_PROPERTIES,
      'Get',
      variant('(ss)', [SNI_WATCHER_NAME, 'IsStatusNotifierHostRegistered']),
      new glib.VariantType('(v)'),
      gio.DBusCallFlags.NONE,
      -1,
      null,
    )

    const value = registered.deepUnpack() as unknown[]
    const inner = value[0] as { deepUnpack?: () => unknown }
    const host = typeof inner?.deepUnpack === 'function' ? inner.deepUnpack() : inner
    return host === true ? 'ok' : 'no-host'
  } catch {
    return 'no-host'
  }
}

class GtkTray implements Tray {
  readonly id: string
  private conn: TrayDBusConnection
  private state: NormalizedTrayOptions
  private icon: IconState
  private sniExported: TrayDBusExportedObject | null = null
  private menuExported: TrayDBusExportedObject | null = null
  private watcherOwner = ''
  private watcherId = 0
  private wellKnown = ''
  private destroyed = false
  private revision = 1
  private nodesById = new Map<number, MenuNode>()
  private nextNodeId = 1

  constructor(options: TrayOptions) {
    this.state = normalizeTrayOptions(options, 'linux')
    this.id = this.state.id
    this.icon = loadIcon(this.state.icon)
    this.rebuildMenuModel()

    // A dedicated session-bus connection per tray: every tray exports the
    // standard /StatusNotifierItem and /MenuBar paths, which must not
    // collide when one process owns several trays.
    this.conn = openSessionConnection()

    const sni = gio.DBusExportedObject.wrapJSObject(SNI_XML, this.sniImplementation())
    sni.export(this.conn, SNI_PATH)
    this.sniExported = sni
    const menu = gio.DBusExportedObject.wrapJSObject(DBUSMENU_XML, this.menuImplementation())
    menu.export(this.conn, DBUSMENU_PATH)
    this.menuExported = menu

    registrationCounter += 1
    this.wellKnown = `${SNI_NAME}-${processId()}-${registrationCounter}`
    try {
      this.requestName()
      this.watcherOwner = this.watcherUniqueOwner()
      this.registerWithWatcher()
    } catch (error) {
      this.releaseResources()
      throw error
    }
    // The initial appeared callback reports the current owner — re-register
    // only when a genuinely different watcher shows up (panel restart).
    this.watcherId = gio.bus_watch_name_on_connection(
      this.conn,
      SNI_WATCHER_NAME,
      gio.BusNameWatcherFlags.NONE,
      (_conn, _name, owner) => {
        if (!this.destroyed && owner !== this.watcherOwner) {
          this.watcherOwner = owner
          try {
            this.registerWithWatcher()
          } catch (error) {
            console.error('[tray] re-registering with the status notifier watcher failed', error)
          }
        }
      },
      null,
    )
  }

  get isDestroyed(): boolean {
    return this.destroyed
  }

  /** Own the well-known name synchronously so registration cannot race. */
  private requestName() {
    const reply = this.conn.call_sync(
      FREEDESKTOP,
      FREEDESKTOP_PATH,
      FREEDESKTOP,
      'RequestName',
      variant('(su)', [this.wellKnown, 4 /* DBUS_NAME_FLAG_DO_NOT_QUEUE */]),
      new glib.VariantType('(u)'),
      gio.DBusCallFlags.NONE,
      -1,
      null,
    )
    const result = (reply.deepUnpack() as number[])[0]
    if (result !== 1 /* DBUS_REQUEST_NAME_REPLY_PRIMARY_OWNER */) {
      throw new TrayError(
        'registration-failed',
        `could not own ${this.wellKnown} on the session bus (RequestName=${result})`,
      )
    }
  }

  private watcherUniqueOwner(): string {
    try {
      const reply = this.conn.call_sync(
        FREEDESKTOP,
        FREEDESKTOP_PATH,
        FREEDESKTOP,
        'GetNameOwner',
        variant('(s)', [SNI_WATCHER_NAME]),
        new glib.VariantType('(s)'),
        gio.DBusCallFlags.NONE,
        -1,
        null,
      )

      const owner = (reply.deepUnpack() as unknown[])[0]
      return typeof owner === 'string' ? owner : ''
    } catch {
      return ''
    }
  }

  private registerWithWatcher() {
    try {
      this.conn.call_sync(
        SNI_WATCHER_NAME,
        SNI_WATCHER_PATH,
        SNI_WATCHER_NAME,
        'RegisterStatusNotifierItem',
        variant('(s)', [this.wellKnown]),
        null,
        gio.DBusCallFlags.NONE,
        -1,
        null,
      )
    } catch (error) {
      throw new TrayError(
        'registration-failed',
        `org.kde.StatusNotifierWatcher.RegisterStatusNotifierItem failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  private sniImplementation() {
    const tray = this
    return {
      get Category() {
        return 'ApplicationStatus'
      },
      get Id() {
        return tray.state.id
      },
      get Title() {
        return tray.state.title ?? tray.state.id
      },
      get Status() {
        return 'Active'
      },
      get WindowId() {
        return 0
      },
      get IconThemePath() {
        return ''
      },
      get IconName() {
        return tray.icon.name
      },
      get IconPixmap() {
        return tray.icon.pixmaps
      },
      get OverlayIconName() {
        return ''
      },
      get OverlayIconPixmap() {
        return []
      },
      get AttentionIconName() {
        return ''
      },
      get AttentionIconPixmap() {
        return []
      },
      get AttentionMovieName() {
        return ''
      },
      get ToolTip() {
        return ['', [], tray.state.title ?? tray.state.id, tray.state.tooltip ?? '']
      },
      get Menu() {
        return DBUSMENU_PATH
      },
      get ItemIsMenu() {
        return !tray.state.onActivate
      },
      get XAyatanaLabel() {
        return tray.state.title ?? ''
      },
      get XAyatanaLabelGuide() {
        return ''
      },
      Activate(_x: number, _y: number) {
        if (tray.state.onActivate) {
          safeCall(tray.state.onActivate)
        }
      },
      SecondaryActivate(_x: number, _y: number) {},
      ContextMenu(_x: number, _y: number) {},
      Scroll(_delta: number, _orientation: string) {},
    }
  }

  private layoutNode(
    node: MenuNode,
    depth: number,
    propertyNames: readonly string[],
  ): [number, PropertyMap, TrayVariant[]] {
    const children =
      depth === 0
        ? []
        : node.children.map((child) =>
            variant(
              '(ia{sv}av)',
              this.layoutNode(child, depth < 0 ? -1 : depth - 1, propertyNames),
            ),
          )
    return [node.id, filterProps(node.props, propertyNames), children]
  }

  private menuImplementation() {
    const tray = this
    return {
      get Version() {
        return 3
      },
      get TextDirection() {
        return 'ltr'
      },
      get Status() {
        return 'normal'
      },
      get IconThemePath() {
        return []
      },
      GetLayout(parentId: number, recursionDepth: number, propertyNames: string[]) {
        const node = tray.nodesById.get(parentId)
        if (!node) {
          throw new Error(`com.canonical.dbusmenu: unknown id ${parentId}`)
        }
        return [tray.revision, tray.layoutNode(node, recursionDepth, propertyNames)]
      },
      GetGroupProperties(ids: number[], propertyNames: string[]) {
        const entries: [number, PropertyMap][] = []
        for (const id of ids) {
          const node = tray.nodesById.get(id)
          if (node) {
            entries.push([id, filterProps(node.props, propertyNames)])
          }
        }
        return [entries]
      },
      GetProperty(id: number, name: string) {
        const node = tray.nodesById.get(id)
        const value = node?.props[name]
        if (!node || !value) {
          throw new Error(`com.canonical.dbusmenu: unknown property ${name} on id ${id}`)
        }
        return value
      },
      Event(id: number, eventId: string, _data: unknown, _timestamp: number) {
        if (eventId !== 'clicked') {
          return
        }
        const node = tray.nodesById.get(id)
        if (node?.item) {
          dispatchTraySelect(node.item, node.option)
        }
      },
      EventGroup(events: [number, string, unknown, number][]) {
        for (const [id, eventId] of events) {
          if (eventId !== 'clicked') {
            continue
          }

          const node = tray.nodesById.get(id)
          if (node?.item) {
            dispatchTraySelect(node.item, node.option)
          }
        }
        return [[]]
      },
      AboutToShow(_id: number) {
        return false
      },
      AboutToShowGroup(_ids: number[]) {
        return [[], []]
      },
    }
  }

  private buildLevel(items: readonly TrayMenuItem[]): MenuNode[] {
    const nodes: MenuNode[] = []
    const add = (
      props: PropertyMap,
      children: MenuNode[] = [],
      item?: TrayMenuItem,
      option?: TrayRadioOption,
    ): MenuNode => {
      const node: MenuNode = { id: this.nextNodeId++, props, children, item, option }
      this.nodesById.set(node.id, node)
      nodes.push(node)
      return node
    }
    const baseProps = (label: string, enabled: boolean): PropertyMap => ({
      label: variant('s', label),
      enabled: variant('b', enabled),
      visible: variant('b', true),
    })
    for (const [index, item] of items.entries()) {
      switch (item.type) {
        case 'separator':
          add({
            type: variant('s', 'separator'),
            label: variant('s', ''),
            enabled: variant('b', true),
            visible: variant('b', true),
          })

          break
        case 'action':
          add(baseProps(item.label, !item.isDisabled), [], item)
          break
        case 'checkbox':
          add(
            {
              ...baseProps(item.label, !item.isDisabled),
              'toggle-type': variant('s', 'checkmark'),
              'toggle-state': variant('i', item.value ? 1 : 0),
            },
            [],
            item,
          )

          break
        case 'radio-group': {
          const hasLabel = typeof item.label === 'string' && item.label.length > 0
          if (hasLabel && index > 0) {
            add({
              type: variant('s', 'separator'),
              label: variant('s', ''),
              enabled: variant('b', true),
              visible: variant('b', true),
            })
          }

          if (hasLabel) {
            add({
              label: variant('s', item.label!),
              enabled: variant('b', false),
              visible: variant('b', true),
            })
          }

          for (const option of item.items) {
            add(
              {
                ...baseProps(option.label, !item.isDisabled && !option.isDisabled),
                'toggle-type': variant('s', 'radio'),
                'toggle-state': variant('i', (option.value ?? option.key) === item.value ? 1 : 0),
              },
              [],
              item,
              option,
            )
          }

          break
        }
        case 'submenu': {
          const children = this.buildLevel(item.items)
          add(
            {
              ...baseProps(item.label, !item.isDisabled),
              'children-display': variant('s', 'submenu'),
            },
            children,
          )

          break
        }
        case 'section': {
          if (index > 0) {
            add({
              type: variant('s', 'separator'),
              label: variant('s', ''),
              enabled: variant('b', true),
              visible: variant('b', true),
            })
          }

          add({
            label: variant('s', item.label),
            enabled: variant('b', false),
            visible: variant('b', true),
          })

          nodes.push(...this.buildLevel(item.items))
          break
        }
      }
    }
    return nodes
  }

  private rebuildMenuModel() {
    this.nodesById.clear()
    this.nextNodeId = 1
    const root: MenuNode = { id: 0, props: {}, children: [] }
    this.nodesById.set(0, root)
    root.children = this.buildLevel(this.state.menu ?? [])
  }

  update(changes: TrayUpdate): void {
    if (this.destroyed) {
      throw new TrayError('destroyed', `tray "${this.id}" was destroyed`)
    }
    const normalized = normalizeTrayUpdate(changes, 'linux')
    if (normalized.icon !== undefined) {
      this.state.icon = resolvePlatformIcon(normalized.icon, 'linux')
      this.icon = loadIcon(this.state.icon)
      this.sniExported?.emit_signal('NewIcon', null)
      this.propertiesChanged(SNI_PATH, SNI_NAME, {
        IconName: variant('s', this.icon.name),
        IconPixmap: variant('a(iiay)', this.icon.pixmaps),
      })
    }
    if (normalized.title !== undefined) {
      this.state.title = normalized.title ?? undefined
      this.sniExported?.emit_signal('NewTitle', null)
      this.sniExported?.emit_signal(
        'XAyatanaNewLabel',
        variant('(ss)', [this.state.title ?? '', '']),
      )

      this.propertiesChanged(SNI_PATH, SNI_NAME, {
        Title: variant('s', this.state.title ?? this.state.id),
        XAyatanaLabel: variant('s', this.state.title ?? ''),
      })
    }
    if (normalized.tooltip !== undefined) {
      this.state.tooltip = normalized.tooltip ?? undefined
      this.sniExported?.emit_signal('NewToolTip', null)
      this.propertiesChanged(SNI_PATH, SNI_NAME, {
        ToolTip: variant('(sa(iiay)ss)', [
          '',
          [],
          this.state.title ?? this.state.id,
          this.state.tooltip ?? '',
        ]),
      })
    }
    if (normalized.menu !== undefined) {
      this.state.menu = normalized.menu ?? undefined
      this.revision += 1
      this.rebuildMenuModel()
      this.menuExported?.emit_signal('LayoutUpdated', variant('(ui)', [this.revision, 0]))
    }
    if (normalized.onActivate !== undefined) {
      this.state.onActivate = normalized.onActivate ?? undefined
      this.propertiesChanged(SNI_PATH, SNI_NAME, {
        ItemIsMenu: variant('b', !this.state.onActivate),
      })
    }
  }

  private propertiesChanged(path: string, iface: string, changed: PropertyMap) {
    try {
      this.conn.emit_signal(
        null,
        path,
        DBUS_PROPERTIES,
        'PropertiesChanged',
        variant('(sa{sv}as)', [iface, changed, []]),
        null,
      )
    } catch (error) {
      console.error('[tray] PropertiesChanged emission failed', error)
    }
  }

  private releaseResources() {
    if (this.watcherId) {
      gio.bus_unwatch_name(this.watcherId)
      this.watcherId = 0
    }
    try {
      this.sniExported?.unexport()
    } catch {
      // A dead connection makes unexport inert.
    }
    try {
      this.menuExported?.unexport()
    } catch {
      // A dead connection makes unexport inert.
    }
    this.sniExported = null
    this.menuExported = null
    if (this.wellKnown) {
      try {
        this.conn.call_sync(
          FREEDESKTOP,
          FREEDESKTOP_PATH,
          FREEDESKTOP,
          'ReleaseName',
          variant('(s)', [this.wellKnown]),
          null,
          gio.DBusCallFlags.NONE,
          -1,
          null,
        )
      } catch {
        // A dead bus makes the release inert.
      }
    }
    try {
      this.conn.close_sync(null)
    } catch {
      // The connection may already be closed.
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return
    }
    this.destroyed = true
    this.nodesById.clear()
    this.releaseResources()
  }
}

function filterProps(props: PropertyMap, names: readonly string[]): PropertyMap {
  if (!names.length) {
    return props
  }
  const out: PropertyMap = {}
  for (const name of names) {
    if (props[name]) {
      out[name] = props[name]
    }
  }
  return out
}

function openSessionConnection(): TrayDBusConnection {
  const address = gio.dbus_address_get_for_bus_sync(gio.BusType.SESSION, null)
  return gio.DBusConnection.new_for_address_sync(
    address,
    gio.DBusConnectionFlags.AUTHENTICATION_CLIENT | gio.DBusConnectionFlags.MESSAGE_BUS_CONNECTION,
    null,
    null,
  )
}

function sessionBus(): TrayDBusConnection {
  try {
    return gio.bus_get_sync(gio.BusType.SESSION, null)
  } catch (error) {
    throw new TrayError(
      'no-session-bus',
      'cannot connect to the D-Bus session bus; a tray icon needs a desktop session',
    )
  }
}

function requireNotifierHost(conn: TrayDBusConnection) {
  if (checkStatusNotifierHost(conn) !== 'ok') {
    throw new TrayError(
      'no-status-notifier-host',
      'no org.kde.StatusNotifierWatcher owner or no registered status notifier host on the session bus',
    )
  }
}

/** Report whether this host can create a tray item. */
export function getTrayAvailability(): Promise<TrayAvailability> {
  let conn: TrayDBusConnection
  try {
    conn = gio.bus_get_sync(gio.BusType.SESSION, null)
  } catch {
    return Promise.resolve({
      available: false,
      reason: 'no-session-bus',
      message: 'cannot connect to the D-Bus session bus; a tray icon needs a desktop session',
    })
  }
  if (checkStatusNotifierHost(conn) !== 'ok') {
    return Promise.resolve({
      available: false,
      reason: 'no-status-notifier-host',
      message:
        'no org.kde.StatusNotifierWatcher owner or no registered status notifier host on the session bus',
    })
  }
  return Promise.resolve({ available: true, platform: 'linux' })
}

/** Create a tray item; rejects with `TrayError` on unsupported hosts or invalid options. */
export function createTray(options: TrayOptions): Promise<Tray> {
  try {
    const conn = sessionBus()
    requireNotifierHost(conn)
    return Promise.resolve(new GtkTray(options))
  } catch (error) {
    return Promise.reject(error)
  }
}

function requireGtkApplication(hint: string): GtkApplicationLike {
  const app: GtkApplicationLike | null = gio.Application.get_default()
  if (!app || typeof app.get_windows !== 'function') {
    throw new TrayError(
      'invalid-options',
      `${hint} needs a running Gtk.Application (gio.Application.get_default() returned none)`,
    )
  }
  return app
}

/** Reveal and focus the app's windows; `false` when no app window exists to show. */
export function showAppWindows(): boolean {
  const app = requireGtkApplication('showAppWindows')
  const windows = app.get_windows()
  if (!windows.length) {
    return false
  }
  for (const window of windows) {
    try {
      window.present()
    } catch (error) {
      console.error('[tray] presenting an app window failed', error)
    }
  }
  return true
}

/** Hide the app's visible windows. */
export function hideAppWindows(): void {
  const app = requireGtkApplication('hideAppWindows')
  for (const window of app.get_windows()) {
    try {
      window.set_visible(false)
    } catch (error) {
      console.error('[tray] hiding an app window failed', error)
    }
  }
}

/** Whether any app window is currently visible. */
export function areAppWindowsVisible(): boolean {
  const app = requireGtkApplication('areAppWindowsVisible')
  return app.get_windows().some((window) => {
    try {
      return window.get_visible()
    } catch {
      return false
    }
  })
}

/** Toggle window visibility; returns the visibility after toggling. */
export function toggleAppWindows(): boolean {
  if (areAppWindowsVisible()) {
    hideAppWindows()
    return false
  }
  return showAppWindows()
}

/** Keep the app running without visible windows until the returned residency releases. */
export function keepAppResident(options?: { hideWindowsOnClose?: boolean }): AppResidency {
  const app = requireGtkApplication('keepAppResident')
  app.hold()
  const hideOnClose = options?.hideWindowsOnClose === true
  const restored: { window: GtkWindowLike; hideOnClose: boolean }[] = []
  if (hideOnClose) {
    for (const window of app.get_windows()) {
      try {
        restored.push({ window, hideOnClose: window.get_hide_on_close() })
        window.set_hide_on_close(true)
      } catch {
        // Windows that reject the flag keep their own behavior.
      }
    }
  }
  let released = false
  return {
    release() {
      if (released) {
        return
      }
      released = true
      for (const entry of restored) {
        try {
          entry.window.set_hide_on_close(entry.hideOnClose)
        } catch {
          // A closed window may already be gone.
        }
      }
      restored.length = 0
      try {
        app.release()
      } catch {
        // Releasing a quitting app is best-effort.
      }
    },
  }
}
