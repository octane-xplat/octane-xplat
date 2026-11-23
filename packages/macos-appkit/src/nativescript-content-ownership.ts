import type { NSView } from '@octane-xplat/platform/macos'
import type { UniversalRoot } from 'octane/universal/native'

const ownedRoots = new WeakMap<NSView, UniversalRoot>()

export function registerAppKitContentRoot(content: NSView, root: UniversalRoot): () => void {
  ownedRoots.set(content, root)
  return () => {
    if (ownedRoots.get(content) === root) {
      ownedRoots.delete(content)
    }
  }
}

export function unmountAppKitContentRoot(content: NSView): void {
  ownedRoots.get(content)?.unmount()
}
