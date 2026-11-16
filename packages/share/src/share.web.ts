// Share — web leaf. navigator.share where present (mobile Safari/Chrome);
// desktop degrades to clipboard copy so the call still does something useful.
// Files can't share by path in a browser — the Web Share API needs a File
// handle — so sharing a native file path is unavailable.
import type { Share, ShareResult } from './types'

async function navShare(payload: {
  text?: string
  url?: string
  title?: string
}): Promise<ShareResult> {
  const nav = navigator as any

  if (nav.share) {
    try {
      await nav.share(payload)
      return 'shared'
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        return 'cancelled'
      }

      throw error
    }
  }

  if (nav.clipboard) {
    await nav.clipboard.writeText(payload.url ?? payload.text ?? '')
    return 'copied'
  }

  return 'unavailable'
}

export const share: Share = {
  async text(text: string, subject?: string): Promise<ShareResult> {
    return navShare({ text, title: subject })
  },
  async url(url: string, title?: string): Promise<ShareResult> {
    return navShare({ url, title })
  },
  async file(_path: string): Promise<ShareResult> {
    return 'unavailable'
  },
}
