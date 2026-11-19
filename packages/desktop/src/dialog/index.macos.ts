import {
  NSAlert,
  NSAlertFirstButtonReturn,
  NSModalResponseCancel,
  NSModalResponseOK,
  NSOpenPanel,
  NSSavePanel,
  UTType,
  type NSURL,
  type NSWindow,
} from '@octane-xplat/platform/macos'
import { getWindowOwner } from '../window/index.macos.js'
import { createDesktopDialog, type OnOwnerClose } from './service.js'
import type { DesktopDialog } from './types.js'

export type * from './types.js'

function showPanel<Result>(
  owner: NSWindow,
  panel: NSSavePanel,
  extensions: readonly string[],
  onOwnerClose: OnOwnerClose,
  readResult: () => Result,
): Promise<Result | null> {
  if (owner.attachedSheet != null) {
    throw new Error('This window already has a native sheet open')
  }
  if (extensions.length) {
    panel.allowedContentTypes = extensions.map((extension) =>
      UTType.typeWithFilenameExtension(extension),
    )
  }

  return new Promise<Result | null>((resolve, reject) => {
    let finished = false
    onOwnerClose(() => {
      if (!finished) {
        panel.cancel(null)
      }
    })
    panel.beginSheetModalForWindowCompletionHandler(owner, (response) => {
      finished = true
      try {
        if (response === NSModalResponseCancel) {
          resolve(null)
        } else if (response === NSModalResponseOK) {
          resolve(readResult())
        } else {
          reject(new Error(`Unknown AppKit file dialog result: ${response}`))
        }
      } catch (error) {
        reject(error)
      }
    })
  })
}

export const dialog: DesktopDialog = createDesktopDialog({
  supported: () => typeof NSOpenPanel?.openPanel === 'function' &&
    typeof NSSavePanel?.savePanel === 'function',
  ownerOf: getWindowOwner,
  messageBox(owner, options, onOwnerClose) {
    if (owner.attachedSheet != null) {
      throw new Error('This window already has a native sheet open')
    }
    const alert = NSAlert.alloc().init()
    alert.messageText = options.message
    alert.informativeText = options.detail ?? ''
    const buttons = options.buttons.map((label) => alert.addButtonWithTitle(label))
    buttons.forEach((button, index) => {
      button.keyEquivalent = index === options.defaultId ? '\r' : index === options.cancelId ? '\u001b' : ''
    })
    return new Promise<number | null>((resolve) => {
      let complete = false
      onOwnerClose(() => {
        if (complete) return
        complete = true
        resolve(null)
        if (alert.window.sheetParent) {
          owner.endSheetReturnCode(alert.window, NSModalResponseCancel)
        }
      })
      alert.beginSheetModalForWindowCompletionHandler(owner, (response) => {
        complete = true
        resolve(response === NSModalResponseCancel ? null : response - NSAlertFirstButtonReturn)
      })
    })
  },
  open(owner, options, onOwnerClose) {
    const panel = NSOpenPanel.openPanel()
    panel.canChooseFiles = true
    panel.canChooseDirectories = false
    panel.allowsMultipleSelection = options.multiple

    return showPanel(owner, panel, options.extensions, onOwnerClose, () => {
      const urls = panel.URLs
      const paths: string[] = []
      for (let index = 0; index < urls.count; index++) {
        const url = urls.objectAtIndex(index) as NSURL
        paths.push(url.path ?? '')
      }
      return paths
    })
  },
  save(owner, options, onOwnerClose) {
    const panel = NSSavePanel.savePanel()
    if (options.suggestedName !== undefined) {
      panel.nameFieldStringValue = options.suggestedName
    }
    return showPanel(owner, panel, options.extensions, onOwnerClose, () => panel.URL?.path ?? '')
  },
})
