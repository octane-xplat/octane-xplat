import { lookupGlobal, UnavailabilityError } from '@octane-xplat/lib/capability'
import { parseAccelerator, toAppKit } from './accelerator.js'
import type { NormalizedAppMenu, NormalizedEntry } from './model.js'
import type { AppMenuRole } from './shared.js'
import type { AppMenuDispatch, AppMenuHost, NativeAppMenu } from './host-types.js'

// Plain node description the AppKit renderer consumes — kept structural so
// this leaf never imports the renderer package.
interface AppKitMenuItem {
  type: 'item'
  title: string
  keyEquivalent: string
  modifierMask: number
  enabled: boolean
  state: 0 | 1
  onSelect?: () => void
  /** Nil-target standard selector routed down the responder chain
   *  (`copy:`, `terminate:`, `orderFrontStandardAboutPanel:`). */
  selector?: string
}

interface AppKitMenuSeparator {
  type: 'separator'
}

interface AppKitMenuSubmenu {
  type: 'submenu'
  title: string
  children: readonly AppKitMenuNode[]
}

type AppKitMenuNode = AppKitMenuItem | AppKitMenuSeparator | AppKitMenuSubmenu

interface AppKitMenuHandle {
  update(nodes: readonly AppKitMenuNode[]): void
  dispose(): void
}

type InstallApplicationMenu = (nodes: readonly AppKitMenuNode[]) => AppKitMenuHandle | null

const NS_OPTION = 1 << 19
const NS_COMMAND = 1 << 20

/** Role → nil-target selector and registered key equivalent on macOS. `quit`
 *  is absent: outside the automatic application menu it is omitted, and the
 *  app menu owns Quit ⌘Q. */
const ROLE_ITEMS: Record<
  Exclude<AppMenuRole, 'quit'>,
  { selector: string; accelerator: string }
> = {
  undo: { selector: 'undo:', accelerator: 'Mod+Z' },
  redo: { selector: 'redo:', accelerator: 'Mod+Shift+Z' },
  cut: { selector: 'cut:', accelerator: 'Mod+X' },
  copy: { selector: 'copy:', accelerator: 'Mod+C' },
  paste: { selector: 'paste:', accelerator: 'Mod+V' },
  selectAll: { selector: 'selectAll:', accelerator: 'Mod+A' },
  minimize: { selector: 'performMiniaturize:', accelerator: 'Mod+M' },
  close: { selector: 'performClose:', accelerator: 'Mod+W' },
}

const ROLE_KEY_EQUIVALENTS = new Map<AppMenuRole, { keyEquivalent: string; modifierMask: number }>()

for (const role of Object.keys(ROLE_ITEMS) as (keyof typeof ROLE_ITEMS)[]) {
  ROLE_KEY_EQUIVALENTS.set(role, toAppKit(parseAccelerator(ROLE_ITEMS[role].accelerator)))
}

function applicationName(): string {
  const name = lookupGlobal(['NSProcessInfo', 'processInfo', 'processName'])

  return typeof name === 'string' && name ? name : 'App'
}

function convertEntry(
  node: NormalizedEntry,
  dispatch: AppMenuDispatch,
  generation: number,
): AppKitMenuNode | null {
  switch (node.kind) {
    case 'separator':
      return { type: 'separator' }
    case 'submenu':
      return {
        type: 'submenu',
        title: node.label,
        children: convertItems(node.items, dispatch, generation),
      }
    case 'action': {
      const accel = node.accelerator ? toAppKit(node.accelerator) : null

      return {
        type: 'item',
        title: node.label,
        keyEquivalent: accel?.keyEquivalent ?? '',
        modifierMask: accel?.modifierMask ?? 0,
        enabled: !node.disabled,
        state: 0,
        onSelect: () => {
          dispatch(node.id, generation)
        },
      }
    }
    case 'checkbox': {
      const accel = node.accelerator ? toAppKit(node.accelerator) : null

      return {
        type: 'item',
        title: node.label,
        keyEquivalent: accel?.keyEquivalent ?? '',
        modifierMask: accel?.modifierMask ?? 0,
        enabled: !node.disabled,
        state: node.value ? 1 : 0,
        onSelect: () => {
          dispatch(node.id, generation)
        },
      }
    }
    case 'role': {
      if (node.role === 'quit') {
        return null
      }

      const role = ROLE_ITEMS[node.role]
      const accel = ROLE_KEY_EQUIVALENTS.get(node.role)!

      return {
        type: 'item',
        title: node.label,
        keyEquivalent: accel.keyEquivalent,
        modifierMask: accel.modifierMask,
        enabled: true,
        state: 0,
        selector: role.selector,
      }
    }
  }
}

function convertItems(
  items: readonly NormalizedEntry[],
  dispatch: AppMenuDispatch,
  generation: number,
): AppKitMenuNode[] {
  const nodes: AppKitMenuNode[] = []

  for (const item of items) {
    const node = convertEntry(item, dispatch, generation)

    if (node === null) {
      continue
    }

    // Quit-role omission can strand separators — collapse again here.
    if (
      node.type === 'separator' &&
      (nodes.length === 0 || nodes[nodes.length - 1]!.type === 'separator')
    ) {
      continue
    }

    nodes.push(node)
  }

  if (nodes.length && nodes[nodes.length - 1]!.type === 'separator') {
    nodes.pop()
  }

  return nodes
}

function item(
  title: string,
  selector: string,
  keyEquivalent = '',
  modifierMask = 0,
): AppKitMenuItem {
  return { type: 'item', title, keyEquivalent, modifierMask, enabled: true, state: 0, selector }
}

/** The standard application menu always leads the bar: About, separator,
 *  `options.macos.applicationItems` (+ separator), Hide ⌘H, Hide Others ⌥⌘H,
 *  Show All, separator, Quit ⌘Q. */
function applicationMenu(tree: NormalizedAppMenu, dispatch: AppMenuDispatch): AppKitMenuSubmenu {
  const name = applicationName()
  const children: AppKitMenuNode[] = [item(`About ${name}`, 'orderFrontStandardAboutPanel:')]
  const extras = convertItems(tree.applicationItems, dispatch, tree.generation)

  if (extras.length) {
    children.push({ type: 'separator' }, ...extras)
  }

  children.push(
    { type: 'separator' },
    item(`Hide ${name}`, 'hide:', 'h', NS_COMMAND),
    item('Hide Others', 'hideOtherApplications:', 'h', NS_COMMAND | NS_OPTION),
    item('Show All', 'unhideAllApplications:'),
    { type: 'separator' },
    item(`Quit ${name}`, 'terminate:', 'q', NS_COMMAND),
  )

  return { type: 'submenu', title: name, children }
}

function convertTree(tree: NormalizedAppMenu, dispatch: AppMenuDispatch): AppKitMenuNode[] {
  const nodes: AppKitMenuNode[] = [applicationMenu(tree, dispatch)]

  for (const menu of tree.menus) {
    nodes.push({
      type: 'submenu',
      title: menu.label,
      children: convertItems(menu.items, dispatch, tree.generation),
    })
  }

  return nodes
}

export const host: AppMenuHost = {
  platform: 'macos',
  supported() {
    return typeof lookupGlobal(['__xplatAppKit', 'installApplicationMenu']) === 'function'
  },
  defer(fn) {
    setTimeout(fn, 0)
  },
  install(tree: NormalizedAppMenu, dispatch: AppMenuDispatch): NativeAppMenu {
    const installer = lookupGlobal(['__xplatAppKit', 'installApplicationMenu'])

    if (typeof installer !== 'function') {
      throw new UnavailabilityError('appMenu')
    }

    const installed: AppKitMenuHandle | null = installer(convertTree(tree, dispatch))

    if (!installed) {
      throw new UnavailabilityError('appMenu')
    }

    return {
      update(next) {
        installed.update(convertTree(next, dispatch))
      },
      dispose() {
        installed.dispose()
      },
    }
  },
}
