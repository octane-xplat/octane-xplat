import { lookupGlobal } from '@octane-xplat/lib/capability'
import { bufferAddress, call, projection, ptr, u32 } from '../windows-interop.js'
import { createDesktopShell, type DesktopShell } from './service.js'

interface WindowsLaunchHost {
  Windows?: {
    Foundation?: { Uri?: new (url: string) => object }
    System?: { Launcher?: { LaunchUriAsync(uri: object): object } }
  }
  NSWinRT?: { toPromise(operation: object): Promise<boolean> }
}

function invokeTrash(method: 'IsSupported' | 'Start' | 'Poll', ...args: string[]): string {
  const bridge = lookupGlobal(['NSWinRT', 'dotnet'])
  if (typeof bridge !== 'object' || bridge === null ||
    !('invoke' in bridge) || typeof bridge.invoke !== 'function') {
    throw new Error('This Windows host has no managed Trash bridge')
  }
  return String(bridge.invoke('', 'OctaneXplat.Desktop.DesktopTrash', method, args))
}

export type { DesktopShell } from './service.js'
export const shell: DesktopShell = createDesktopShell({
  getLauncher: () => {
    const windows = lookupGlobal(['Windows']) as WindowsLaunchHost['Windows']
    const runtime = lookupGlobal(['NSWinRT']) as WindowsLaunchHost['NSWinRT']
    const Uri = windows?.Foundation?.Uri
    const launcher = windows?.System?.Launcher
    if (
      typeof Uri !== 'function' ||
      typeof launcher?.LaunchUriAsync !== 'function' ||
      typeof runtime?.toPromise !== 'function'
    ) {
      return
    }

    return (url) => runtime.toPromise(launcher.LaunchUriAsync(new Uri(url)))
  },
  getRevealer: () => {
    const runtime = projection().NSWinRT
    if (typeof runtime?.win32?.call !== 'function' || !runtime.interop) {
      return
    }
    return (path) => {
      const buffer = new Uint16Array(path.length + 1)
      for (let index = 0; index < path.length; index++) {
        buffer[index] = path.charCodeAt(index)
      }
      const initialized = Number(call('ole32.dll', 'CoInitializeEx', 'i32', ptr(0), u32(2)))
      if (initialized < 0) {
        return false
      }
      try {
        const item = Number(
          call('shell32.dll', 'ILCreateFromPathW', 'pointer', ptr(bufferAddress(buffer))),
        )
        if (!item) {
          return false
        }
        try {
          return (
            Number(
              call(
                'shell32.dll',
                'SHOpenFolderAndSelectItems',
                'i32',
                ptr(item),
                u32(0),
                ptr(0),
                u32(0),
              ),
            ) >= 0
          )
        } finally {
          call('shell32.dll', 'ILFree', 'void', ptr(item))
        }
      } finally {
        call('ole32.dll', 'CoUninitialize', 'void')
      }
    }
  },
  getTrasher() {
    try {
      if (invokeTrash('IsSupported') !== 'yes') return
    } catch {
      return
    }

    return async (path) => {
      const id = invokeTrash('Start', path)
      let result = invokeTrash('Poll', id)
      while (result === 'pending') {
        await new Promise<void>((resolve) => setTimeout(resolve, 100))
        result = invokeTrash('Poll', id)
      }
      return result === 'recycled'
    }
  },
  isAbsolutePath: (path) => /^[a-z]:[\\/]/i.test(path) || /^\\\\[^\\?.][^\\]*\\[^\\]+/.test(path),
})
