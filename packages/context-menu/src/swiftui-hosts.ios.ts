/** @internal iOS SwiftUI context-menu trigger/preview host lifecycle. */
import { SwiftUIManager } from '@nativescript/swift-ui'
import {
  getSwiftUIHostLifecycle,
  registerSwiftUIHost,
  unregisterSwiftUIHost,
} from '@octane-xplat/lib'

declare const NativeScriptViewFactory: any

function ensureNativeScriptViewFactory(): void {
  if (!NativeScriptViewFactory.shared) {
    NativeScriptViewFactory.initShared()
  }
}

/** Register trigger/preview hosts under stable ids so the SwiftUI
 *  representable resolves one factory view per id (uuid-suffixed keys
 *  could never be released — the JS side cannot recover the suffix). */
export function registerContextMenuHosts(
  triggerId: string,
  trigger: unknown,
  previewId: string,
  preview: unknown,
): void {
  ensureNativeScriptViewFactory()
  registerSwiftUIHost(triggerId, { create: () => trigger })
  registerSwiftUIHost(previewId, { create: () => preview })
  SwiftUIManager.registerNativeScriptViews(
    { [triggerId]: true, [previewId]: true },
    getSwiftUIHostLifecycle(),
  )
}

/** Destroy the factory's retained native views before dropping the host
 *  handlers — without this the created views stay in the shared views map
 *  for the app's lifetime (the sheet leaf does the same for its host). */
export function releaseContextMenuHosts(triggerId: string, previewId: string): void {
  NativeScriptViewFactory.shared?.viewDestroyer?.(triggerId)
  NativeScriptViewFactory.shared?.viewDestroyer?.(previewId)
  unregisterSwiftUIHost(triggerId)
  unregisterSwiftUIHost(previewId)
}
