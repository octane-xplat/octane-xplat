import {
  NSModalResponseCancel,
  NSModalResponseOK,
  NSOpenPanel,
  UTType,
  type NSURL,
} from '@octane-xplat/platform/macos'
import { getWindowOwner } from '../window/index.macos.js'
import { createDesktopDialog } from './service.js'
import type { DesktopDialog } from './types.js'

export type * from './types.js'

export const dialog: DesktopDialog = createDesktopDialog({
  supported: () => typeof NSOpenPanel?.openPanel === 'function',
  ownerOf: getWindowOwner,
  open(owner, options, onOwnerClose) {
    if (owner.attachedSheet != null) {
      throw new Error('This window already has a native sheet open')
    }

    const panel = NSOpenPanel.openPanel()
    panel.canChooseFiles = true
    panel.canChooseDirectories = false
    panel.allowsMultipleSelection = options.multiple
    if (options.extensions.length) {
      panel.allowedContentTypes = options.extensions.map((extension) =>
        UTType.typeWithFilenameExtension(extension),
      )
    }

    return new Promise<string[] | null>((resolve, reject) => {
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
            const paths: string[] = []
            const urls = panel.URLs
            for (let index = 0; index < urls.count; index++) {
              const url = urls.objectAtIndex(index) as NSURL
              paths.push(url.path ?? '')
            }
            resolve(paths)
          } else {
            reject(new Error(`Unknown AppKit Open dialog result: ${response}`))
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  },
})
