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
}

export function createDesktopShell(
  getLauncher: () => ((url: string) => boolean | Promise<boolean>) | undefined,
  getRevealer: () => ((path: string) => boolean | Promise<boolean>) | undefined = () => undefined,
  isAbsolutePath: (path: string) => boolean = (path) => path.startsWith('/'),
): DesktopShell {
  return {
    get supported() {
      return getLauncher() !== undefined
    },
    get canShowItemInFolder() {
      return getRevealer() !== undefined
    },
    async showItemInFolder(path) {
      if (typeof path !== 'string' || path.includes('\0') || !isAbsolutePath(path)) {
        throw new TypeError('shell.showItemInFolder requires an absolute native path')
      }
      const reveal = getRevealer()
      if (!reveal) {
        throw new UnavailabilityError('shell.showItemInFolder')
      }
      if (!(await reveal(path))) {
        throw new Error('The desktop host could not reveal the item')
      }
    },
    async openExternal(url) {
      if (!/^https?:\/\/[^/?#\\\s]+(?:[/?#]|$)/i.test(url) || /[\s\\]/.test(url) ||
        Array.from(url).some((character) => character.charCodeAt(0) < 32)) {
        throw new TypeError('shell.openExternal requires an absolute HTTP or HTTPS URL')
      }

      const launch = getLauncher()
      if (!launch) {
        throw new UnavailabilityError('shell.openExternal')
      }
      if (!(await launch(url))) {
        throw new Error('The desktop host could not open the link')
      }
    },
  }
}
