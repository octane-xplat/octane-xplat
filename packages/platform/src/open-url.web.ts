// Outbound links — web leaf. Settings are an app-level concept and are
// explicitly unsupported in a browser.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Service } from '@octane-xplat/lib/capability'
import type { OpenSettingsImpl } from './types'

export function openUrl(url: string): boolean {
  return window.open(url, '_blank', 'noopener,noreferrer') !== null
}

export const openSettings: Service<OpenSettingsImpl> = {
  supported: false,
  isAvailable: async () => false,
  open: () => {
    throw new UnavailabilityError('openSettings')
  },
}
