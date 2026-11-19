import { NSURL, NSWorkspace } from '@octane-xplat/platform/macos'
import { createDesktopShell, type DesktopShell } from './service.js'

export type { DesktopShell } from './service.js'
export const shell: DesktopShell = createDesktopShell(() => {
  const workspace = NSWorkspace?.sharedWorkspace
  if (typeof workspace?.openURL !== 'function') {
    return
  }

  return (url) => {
    const target = NSURL.URLWithString(url)
    return target != null && workspace.openURL(target)
  }
}, () => {
  const workspace = NSWorkspace?.sharedWorkspace
  if (typeof workspace?.selectFileInFileViewerRootedAtPath !== 'function') {
    return
  }
  return (path) => workspace.selectFileInFileViewerRootedAtPath(path, path.slice(0, path.lastIndexOf('/')) || '/')
})
