// Windows leaf — gallery picking routes through the file-open picker
// (the same managed ServiceInterop path that backs files.pick); camera
// capture has no leaf yet and resolves null. Windows has no per-app photo
// permission — the picker mediates access, so both domains report
// 'unsupported'.
import { files } from '@octane-xplat/files'
import { NSWinRT } from '@octane-xplat/platform/windows'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { MediaImpl, MediaPermissionKind, PickedImage } from './types'

const UNSUPPORTED: PermissionResponse = {
  status: 'unsupported',
  granted: false,
  canAskAgain: false,
}

type DotnetBridge = {
  invoke?: (assembly: string, type: string, method: string, args: unknown[]) => unknown
}

// Picks need the app-embedded managed helper — see files.windows.ts. The
// dotnet bridge's absence is the cheapest honest availability signal.
function pickerAvailable(): boolean {
  return typeof (NSWinRT as { dotnet?: DotnetBridge } | undefined)?.dotnet?.invoke === 'function'
}

/** Media service — gallery pick via the file picker; camera capture bounded. */
export const media: Permissioned<MediaImpl> = {
  get supported() {
    return pickerAvailable()
  },
  async isAvailable() {
    return pickerAvailable()
  },
  async pickImage(): Promise<PickedImage | null> {
    const ref = await files.pick('image/*')

    return ref ? { name: ref.name, uri: ref.uri } : null
  },
  async pickImages(): Promise<PickedImage[]> {
    const refs = await files.pickMultiple('image/*')

    return refs.map((ref) => ({ name: ref.name, uri: ref.uri }))
  },
  async capturePhoto(): Promise<PickedImage | null> {
    return null
  },
  getPermissions(_kind: MediaPermissionKind): Promise<PermissionResponse> {
    return Promise.resolve(UNSUPPORTED)
  },
  requestPermissions(_kind: MediaPermissionKind): Promise<PermissionResponse> {
    return Promise.resolve(UNSUPPORTED)
  },
}
