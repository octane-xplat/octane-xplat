import { UnavailabilityError } from '@octane-xplat/lib/capability'

export interface DesktopShell {
  /** Whether the host exposes a launcher for web links. */
  readonly supported: boolean
  /** Ask the default browser to open an absolute HTTP or HTTPS link. */
  openExternal(url: string): Promise<void>
  /** Whether this host can request selection in its file manager. */
  readonly canShowItemInFolder: boolean
  /** Reveal an absolute native path in its containing folder. */
  showItemInFolder(path: string): Promise<void>
  /** Whether the host exposes a recoverable Trash operation. */
  readonly canTrashItem: boolean
  /** Move an absolute native path to Trash. */
  trashItem(path: string): Promise<void>
}

type GetOperation = () => ((value: string) => boolean | Promise<boolean>) | undefined

interface NativeShell {
  getLauncher?: GetOperation
  getRevealer?: GetOperation
  getTrasher?: GetOperation
  isAbsolutePath?: (path: string) => boolean
}

export function createDesktopShell({
  getLauncher,
  getRevealer,
  getTrasher,
  isAbsolutePath = (path) => path.startsWith('/'),
}: NativeShell): DesktopShell {
  function assertNativePath(path: string, feature: string) {
    if (typeof path !== 'string' || path.includes('\0') || !isAbsolutePath(path)) {
      throw new TypeError(`${feature} requires an absolute native path`)
    }
  }

  return {
    get supported() {
      return getLauncher?.() !== undefined
    },
    get canShowItemInFolder() {
      return getRevealer?.() !== undefined
    },
    async showItemInFolder(path) {
      assertNativePath(path, 'shell.showItemInFolder')
      const reveal = getRevealer?.()
      if (!reveal) {
        throw new UnavailabilityError('shell.showItemInFolder')
      }
      if (!(await reveal(path))) {
        throw new Error('The desktop host could not reveal the item')
      }
    },
    get canTrashItem() {
      return getTrasher?.() !== undefined
    },
    async trashItem(path) {
      assertNativePath(path, 'shell.trashItem')
      const trash = getTrasher?.()
      if (!trash) {
        throw new UnavailabilityError('shell.trashItem')
      }
      if (!(await trash(path))) {
        throw new Error('The desktop host could not move the item to Trash')
      }
    },
    async openExternal(url) {
      if (
        !/^https?:\/\/[^/?#\\\s]+(?:[/?#]|$)/i.test(url) ||
        /[\s\\]/.test(url) ||
        Array.from(url).some((character) => character.charCodeAt(0) < 32)
      ) {
        throw new TypeError('shell.openExternal requires an absolute HTTP or HTTPS URL')
      }

      const launch = getLauncher?.()
      if (!launch) {
        throw new UnavailabilityError('shell.openExternal')
      }
      if (!(await launch(url))) {
        throw new Error('The desktop host could not open the link')
      }
    },
  }
}
