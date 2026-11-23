// Windows leaf — packaged WinUI apps can toast through
// Microsoft.Windows.AppNotifications, but no leaf exists yet; report explicit
// unavailability instead of pulling @nativescript/local-notifications (mobile
// only) into the bundle.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { NotificationsImpl } from './types'

const UNSUPPORTED: PermissionResponse = {
  status: 'unsupported',
  granted: false,
  canAskAgain: false,
}

/** Local notifications — unavailable on Windows pending a toast leaf. */
export const notifications: Permissioned<NotificationsImpl> = {
  supported: false,
  isAvailable: async () => false,
  getPermissions: async () => UNSUPPORTED,
  requestPermissions: async () => UNSUPPORTED,
  // Same unsupported contract as the web and macOS leaves — a send that can
  // never be delivered throws rather than dropping silently.
  notify: () => {
    throw new UnavailabilityError('notifications')
  },
}
