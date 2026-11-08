import { parseAccelerator, toAppKit, toGtk, toWinUI, type ParsedAccelerator } from './accelerator.js'
import type { AppMenuOptions, AppMenuRole, AppMenuSubmenu } from './shared.js'
import type { AppMenuPlatform } from './host-types.js'

export interface NormalizedAction {
  kind: 'action'
  id: number
  key: string
  label: string
  accelerator: ParsedAccelerator | null
  disabled: boolean
  onSelect(): void
}

export interface NormalizedCheckbox {
  kind: 'checkbox'
  id: number
  key: string
  label: string
  value: boolean
  accelerator: ParsedAccelerator | null
  disabled: boolean
  onValueChange(value: boolean): void
}

export interface NormalizedRole {
  kind: 'role'
  id: number
  key: string
  role: AppMenuRole
  label: string
}

export interface NormalizedSeparator {
  kind: 'separator'
  key: string
}

export interface NormalizedSubmenu {
  kind: 'submenu'
  key: string
  label: string
  items: NormalizedEntry[]
}

export type NormalizedEntry =
  | NormalizedAction
  | NormalizedCheckbox
  | NormalizedRole
  | NormalizedSeparator
  | NormalizedSubmenu

export type NormalizedActionable = NormalizedAction | NormalizedCheckbox | NormalizedRole

/** Immutable id-addressed tree handed to hosts. `generation` identifies this
 *  applied tree — native callbacks pass it back through dispatch so stale
 *  items from a superseded tree can be ignored. */
export interface NormalizedAppMenu {
  platform: AppMenuPlatform
  generation: number
  menus: NormalizedSubmenu[]
  /** Normalized `options.macos.applicationItems` — consumed by the macOS
   *  host, ignored elsewhere. */
  applicationItems: NormalizedEntry[]
  nodes: ReadonlyMap<number, NormalizedActionable>
}

const ROLES = new Set<AppMenuRole>([
  'undo',
  'redo',
  'cut',
  'copy',
  'paste',
  'selectAll',
  'minimize',
  'close',
  'quit',
])

export const ROLE_DEFAULT_LABELS: Record<AppMenuRole, string> = {
  undo: 'Undo',
  redo: 'Redo',
  cut: 'Cut',
  copy: 'Copy',
  paste: 'Paste',
  selectAll: 'Select All',
  minimize: 'Minimize',
  close: 'Close',
  quit: 'Quit',
}

/** Accelerators a role *registers* with the platform menu engine, keyed by
 *  platform. macOS registers native key equivalents for every role except
 *  quit (the application menu owns Quit ⌘Q). GTK registers close/quit only —
 *  edit-role accelerators stay widget-owned and are only displayed via the
 *  menu item `accel` attribute. Windows role entries are explicitly unsupported. */
const ROLE_ACCELERATORS: Record<
  'macos' | 'linux' | 'windows',
  Partial<Record<AppMenuRole, string>>
> = {
  macos: {
    undo: 'Mod+Z',
    redo: 'Mod+Shift+Z',
    cut: 'Mod+X',
    copy: 'Mod+C',
    paste: 'Mod+V',
    selectAll: 'Mod+A',
    minimize: 'Mod+M',
    close: 'Mod+W',
  },
  linux: { close: 'Control+W', quit: 'Control+Q' },
  windows: {},
}

/** Accelerators the standard macOS application menu registers regardless of
 *  the installed tree: Hide ⌘H, Hide Others ⌥⌘H, Quit ⌘Q. */
const MACOS_APPLICATION_MENU_ACCELERATORS: readonly [string, string][] = [
  ['Mod+H', 'the standard application menu (Hide)'],
  ['Mod+Alt+H', 'the standard application menu (Hide Others)'],
  ['Mod+Q', 'the standard application menu (Quit)'],
]

function fail(path: string, message: string): never {
  throw new TypeError(`${path}: ${message}`)
}

/** Canonical string identifying one effective accelerator on the target
 *  platform, so `Mod+Q` and `Command+Q` collide on macOS but `Mod+Q` and
 *  `Meta+Q` do not on Linux. */
function canonicalAccelerator(parsed: ParsedAccelerator, platform: AppMenuPlatform): string {
  switch (platform) {
    case 'macos': {
      const { keyEquivalent, modifierMask } = toAppKit(parsed)
      return `${modifierMask}:${keyEquivalent.codePointAt(0) ?? 0}`
    }
    case 'linux':
      return toGtk(parsed)
    case 'windows': {
      const { key, modifiers } = toWinUI(parsed)
      return `${modifiers}:${key}`
    }
    case null:
      return JSON.stringify(parsed)
  }
}

interface NormalizationContext {
  platform: AppMenuPlatform
  nodes: Map<number, NormalizedActionable>
  nextId: number
  /** Null disables duplicate-accelerator detection — used for
   *  `options.macos.applicationItems` on non-macOS platforms, where those
   *  items never reach the installed tree. */
  accelerators: Map<string, string> | null
}

function noteAccelerator(
  context: NormalizationContext,
  parsed: ParsedAccelerator,
  source: string,
  owner: string,
): void {
  if (!context.accelerators) {
    return
  }
  const canonical = canonicalAccelerator(parsed, context.platform)
  const existing = context.accelerators.get(canonical)
  if (existing !== undefined) {
    fail(owner, `accelerator "${source}" duplicates ${existing}`)
  }
  context.accelerators.set(canonical, owner)
}

function normalizeChildren(
  entries: readonly unknown[],
  path: string,
  context: NormalizationContext,
): NormalizedEntry[] {
  const siblings = new Set<string>()
  const items: NormalizedEntry[] = []
  for (const [index, entry] of entries.entries()) {
    const itemPath = `${path}[${index}]`
    if (typeof entry !== 'object' || entry === null) {
      fail(itemPath, 'expected a menu entry object')
    }
    const record = entry as Record<string, unknown>
    const key = record.key
    if (typeof key !== 'string' || !key) {
      fail(itemPath, 'key must be a non-empty string')
    }
    if (siblings.has(key)) {
      fail(itemPath, `duplicate sibling key "${key}"`)
    }
    siblings.add(key)

    switch (record.type) {
      case 'action': {
        const label = requireLabel(record, itemPath)
        const accelerator = parseAcceleratorField(record, itemPath, context)
        if (typeof record.onSelect !== 'function') {
          fail(itemPath, 'onSelect must be a function')
        }
        const node: NormalizedAction = {
          kind: 'action',
          id: context.nextId++,
          key,
          label,
          accelerator,
          disabled: Boolean(record.isDisabled),
          onSelect: record.onSelect as () => void,
        }
        context.nodes.set(node.id, node)
        items.push(node)
        break
      }
      case 'checkbox': {
        const label = requireLabel(record, itemPath)
        const accelerator = parseAcceleratorField(record, itemPath, context)
        if (typeof record.value !== 'boolean') {
          fail(itemPath, 'value must be a boolean')
        }
        if (typeof record.onValueChange !== 'function') {
          fail(itemPath, 'onValueChange must be a function')
        }
        const node: NormalizedCheckbox = {
          kind: 'checkbox',
          id: context.nextId++,
          key,
          label,
          value: record.value,
          accelerator,
          disabled: Boolean(record.isDisabled),
          onValueChange: record.onValueChange as (value: boolean) => void,
        }
        context.nodes.set(node.id, node)
        items.push(node)
        break
      }
      case 'separator': {
        const node: NormalizedSeparator = { kind: 'separator', key }
        // Leading/trailing/repeated separators collapse — GTK sections and
        // the macOS quit-role omission both depend on it.
        if (items.length === 0 || items[items.length - 1]!.kind === 'separator') {
          break
        }
        items.push(node)
        break
      }
      case 'submenu': {
        const label = requireLabel(record, itemPath)
        if (!Array.isArray(record.items)) {
          fail(itemPath, 'items must be an array')
        }
        const node: NormalizedSubmenu = {
          kind: 'submenu',
          key,
          label,
          items: normalizeChildren(record.items, `${itemPath}.items`, context),
        }
        items.push(node)
        break
      }
      case 'role': {
        if (context.platform === 'windows') {
          fail(itemPath, 'standard app menu roles are unsupported on Windows; use an action callback')
        }
        const role = record.role
        if (typeof role !== 'string' || !ROLES.has(role as AppMenuRole)) {
          fail(itemPath, `unknown role ${JSON.stringify(role)}`)
        }
        let label = ROLE_DEFAULT_LABELS[role as AppMenuRole]
        if (record.label !== undefined) {
          if (typeof record.label !== 'string' || !record.label) {
            fail(itemPath, 'label must be a non-empty string')
          }
          label = record.label
        }
        const node: NormalizedRole = { kind: 'role', id: context.nextId++, key, role: role as AppMenuRole, label }
        context.nodes.set(node.id, node)
        const registered = context.platform ? ROLE_ACCELERATORS[context.platform][node.role] : undefined
        if (registered) {
          noteAccelerator(
            context,
            parseAccelerator(registered),
            registered,
            `${itemPath} (role "${node.role}")`,
          )
        }
        items.push(node)
        break
      }
      default:
        fail(itemPath, `unknown menu entry type ${JSON.stringify(record.type)}`)
    }
  }
  if (items.length && items[items.length - 1]!.kind === 'separator') {
    items.pop()
  }
  return items
}

function requireLabel(record: Record<string, unknown>, path: string): string {
  if (typeof record.label !== 'string' || !record.label) {
    fail(path, 'label must be a non-empty string')
  }
  return record.label
}

function parseAcceleratorField(
  record: Record<string, unknown>,
  path: string,
  context: NormalizationContext,
): ParsedAccelerator | null {
  const source = record.accelerator
  if (source === undefined) {
    return null
  }
  if (typeof source !== 'string') {
    fail(path, 'accelerator must be a string')
  }
  let parsed: ParsedAccelerator
  try {
    parsed = parseAccelerator(source)
  } catch (error) {
    fail(`${path}.accelerator`, error instanceof Error ? error.message : String(error))
  }
  noteAccelerator(context, parsed!, source, path)
  return parsed!
}

/** Validate and normalize an install/update payload into an id-addressed
 *  tree. Throws `TypeError` carrying a path (`menus[1].items[0]`) before any
 *  native write. Runs the whole pass before hosts see the tree. */
export function normalizeAppMenu(
  menus: readonly AppMenuSubmenu[],
  options: AppMenuOptions | undefined,
  platform: AppMenuPlatform,
  generation: number,
): NormalizedAppMenu {
  if (!Array.isArray(menus)) {
    fail('menus', 'must be an array of submenus')
  }
  const accelerators = new Map<string, string>()
  const context: NormalizationContext = { platform, nodes: new Map(), nextId: 1, accelerators }
  if (platform === 'macos') {
    for (const [source, owner] of MACOS_APPLICATION_MENU_ACCELERATORS) {
      accelerators.set(canonicalAccelerator(parseAccelerator(source), platform), owner)
    }
  }

  const normalized: NormalizedSubmenu[] = []
  const topKeys = new Set<string>()
  for (const [index, menu] of menus.entries()) {
    const path = `menus[${index}]`
    if (typeof menu !== 'object' || menu === null || (menu as { type?: unknown }).type !== 'submenu') {
      fail(path, 'menu bar entries must be submenus')
    }
    const record = menu as unknown as Record<string, unknown>
    if (typeof record.key !== 'string' || !record.key) {
      fail(path, 'key must be a non-empty string')
    }
    if (topKeys.has(record.key)) {
      fail(path, `duplicate sibling key "${record.key}"`)
    }
    topKeys.add(record.key)
    const label = requireLabel(record, path)
    if (!Array.isArray(record.items)) {
      fail(path, 'items must be an array')
    }
    normalized.push({
      kind: 'submenu',
      key: record.key,
      label,
      items: normalizeChildren(record.items, `${path}.items`, context),
    })
  }

  // options.macos is namespaced — always validated, only consumed on macOS.
  const applicationItems = options?.macos?.applicationItems
  let normalizedApplicationItems: NormalizedEntry[] = []
  if (applicationItems !== undefined) {
    if (!Array.isArray(applicationItems)) {
      fail('options.macos.applicationItems', 'must be an array')
    }
    if (platform === 'macos') {
      normalizedApplicationItems = normalizeChildren(
        applicationItems,
        'options.macos.applicationItems',
        context,
      )
    } else {
      const dormant: NormalizationContext = { platform: null, nodes: new Map(), nextId: context.nextId, accelerators: null }
      normalizedApplicationItems = normalizeChildren(
        applicationItems,
        'options.macos.applicationItems',
        dormant,
      )
    }
  }

  return {
    platform,
    generation,
    menus: normalized,
    applicationItems: normalizedApplicationItems,
    nodes: context.nodes,
  }
}
