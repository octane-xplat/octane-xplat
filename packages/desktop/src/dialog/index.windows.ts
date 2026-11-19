import { lookupGlobal } from '@octane-xplat/lib/capability'
import { getWindowOwner } from '../window/index.windows.js'
import { createDesktopDialog, type OnOwnerClose } from './service.js'
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

async function pick(method: 'Start' | 'StartSave' | 'StartMessageBox', args: string[], onOwnerClose: OnOwnerClose): Promise<unknown> {
  const result = invoke(method, args)
  if (result !== 'started') {
    throw new Error(`Unable to open a Windows dialog: ${result}`)
  }

  onOwnerClose(() => invoke('Dismiss'))
  let response = invoke('Poll')
  while (response === 'pending') {
    await new Promise<void>((resolve) => setTimeout(resolve, 100))
    response = invoke('Poll')
  }

  return JSON.parse(response)
}

function invalidResult(value: unknown, kind: 'Open' | 'Save' | 'message box'): never {
  if (typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string') {
    throw new Error(`Windows ${kind} dialog failed: ${value.error}`)
  }
  throw new Error(`Invalid result from the Windows ${kind} dialog`)
}

export const dialog: DesktopDialog = createDesktopDialog({
  supported() {
    try {
      return invoke('IsSupported') === 'yes'
    } catch {
      return false
    }
  },
  supportsMessageBox() {
    try {
      return invoke('IsMessageBoxSupported') === 'yes'
    } catch {
      return false
    }
  },
  ownerOf: getWindowOwner,
  async messageBox(owner, options, onOwnerClose) {
    const value = await pick('StartMessageBox', [
      owner.id, options.message, options.detail ?? '', JSON.stringify(options.buttons), String(options.defaultId),
    ], onOwnerClose)
    if (value === null || typeof value === 'number') return value
    return invalidResult(value, 'message box')
  },
  async open(owner, options, onOwnerClose) {
    const value = await pick('Start', [owner.id, options.extensions.join(','), options.multiple ? 'yes' : 'no'], onOwnerClose)
    if (value === null || (Array.isArray(value) && value.every((path) => typeof path === 'string'))) {
      return value
    }
    return invalidResult(value, 'Open')
  },
  async save(owner, options, onOwnerClose) {
    const value = await pick('StartSave', [owner.id, options.extensions.join(','), options.suggestedName ?? ''], onOwnerClose)
    if (value === null || typeof value === 'string') {
      return value
    }
    return invalidResult(value, 'Save')
  },
})
