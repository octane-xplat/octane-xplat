import { lookupGlobal } from '@octane-xplat/lib/capability'
import { getWindowOwner } from '../window/index.windows.js'
import { createDesktopDialog } from './service.js'
import type { DesktopDialog } from './types.js'

export type * from './types.js'

interface DotnetBridge {
  invoke(assembly: string, type: string, method: string, args: string[]): unknown
}

const bridgeType = 'OctaneXplat.Desktop.DesktopFileDialog'

function invoke(method: string, args: string[] = []): string {
  const dotnet = lookupGlobal(['NSWinRT', 'dotnet'])
  if (typeof dotnet !== 'object' || dotnet === null ||
    !('invoke' in dotnet) || typeof dotnet.invoke !== 'function') {
    throw new Error('This Windows host has no NativeScript managed bridge')
  }

  // NativeScript invokes a static method in the generated WinUI application assembly.
  return String((dotnet as DotnetBridge).invoke('', bridgeType, method, args))
}

export const dialog: DesktopDialog = createDesktopDialog({
  supported() {
    try {
      return invoke('IsSupported') === 'yes'
    } catch {
      return false
    }
  },
  ownerOf: getWindowOwner,
  async open(owner, options, onOwnerClose) {
    const result = invoke('Start', [owner.id, options.extensions.join(','), options.multiple ? 'yes' : 'no'])
    if (result !== 'started') {
      throw new Error(`Unable to open a Windows file dialog: ${result}`)
    }

    onOwnerClose(() => invoke('Dismiss'))
    let response = invoke('Poll')
    while (response === 'pending') {
      await new Promise<void>((resolve) => setTimeout(resolve, 100))
      response = invoke('Poll')
    }

    const value: unknown = JSON.parse(response)
    if (value === null) {
      return null
    }
    if (Array.isArray(value) && value.every((path) => typeof path === 'string')) {
      return value
    }
    if (typeof value === 'object' && 'error' in value && typeof value.error === 'string') {
      throw new Error(`Windows Open dialog failed: ${value.error}`)
    }
    throw new Error('Invalid result from the Windows Open dialog')
  },
})
