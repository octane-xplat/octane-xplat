import type { NSView } from '@octane-xplat/platform/macos'
import { FailureCollector } from './failures'
import type { MacOSRootOptions } from './runtime'
import { defineUniversalComponent, type UniversalRenderable, type UniversalRoot } from 'octane/universal/native'

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

type ContentRootFactory = (host: NSView, options?: MacOSRootOptions) => UniversalRoot
let createContentRoot: ContentRootFactory | undefined

const RetainedContent = defineUniversalComponent<{ content: UniversalRenderable }>(
  'nativescript',
  ({ content }) => content,
)

export function installAppKitContentRootFactory(factory: ContentRootFactory) {
  createContentRoot = factory
}

export function renderAppKitRetainedContent(
  host: NSView,
  content: UniversalRenderable,
  fontFamily?: string,
): UniversalRoot {
  const current = ownedRoots.get(host)
  const root = current ?? createContentRoot?.(host, { fontFamily })
  if (!root) {
    throw new Error('The AppKit host has no content root factory')
  }
  try {
    root.render(RetainedContent, { content })
  } catch (error) {
    if (!current) {
      const failures = new FailureCollector()
      failures.run('retained content render', () => {
        throw error
      })
      failures.run('retained content release', () => root.unmount())
      failures.throwIfFailed()
    }
    throw error
  }
  return root
}
