import { lookupGlobal } from '@octane-xplat/lib/capability'
import { createDesktopShell, type DesktopShell } from './service.js'

interface WindowsLaunchHost {
  Windows?: {
    Foundation?: { Uri?: new (url: string) => object }
    System?: { Launcher?: { LaunchUriAsync(uri: object): object } }
  }
  NSWinRT?: { toPromise(operation: object): Promise<boolean> }
}

export type { DesktopShell } from './service.js'
export const shell: DesktopShell = createDesktopShell(() => {
  const windows = lookupGlobal(['Windows']) as WindowsLaunchHost['Windows']
  const runtime = lookupGlobal(['NSWinRT']) as WindowsLaunchHost['NSWinRT']
  const Uri = windows?.Foundation?.Uri
  const launcher = windows?.System?.Launcher
  if (typeof Uri !== 'function' || typeof launcher?.LaunchUriAsync !== 'function' ||
    typeof runtime?.toPromise !== 'function') {
    return
  }

  return (url) => runtime.toPromise(launcher.LaunchUriAsync(new Uri(url)))
})
