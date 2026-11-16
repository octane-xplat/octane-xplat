// Notifications — Web Notification API.
import { UnavailabilityError } from '@octane-xplat/lib/capability'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import type { NotificationsImpl } from './types'

const dom = () => typeof Notification !== 'undefined'

const fromStatus = (status: string): PermissionResponse => ({
  status: status as PermissionResponse['status'],
  granted: status === 'granted',
  // Denied web permissions can only be reset in browser UI.
  canAskAgain: status === 'granted' || status === 'undetermined',
})

export const notifications: Permissioned<NotificationsImpl> = {
  get supported() {
    return dom()
  },
  async isAvailable() {
    return dom()
  },
  async getPermissions() {
    if (!dom()) {
      return fromStatus('unsupported')
    }

    return fromStatus(Notification.permission)
  },
  async requestPermissions() {
    if (!dom()) {
      return fromStatus('unsupported')
    }

    return fromStatus(await Notification.requestPermission())
  },
  notify(title, body) {
    if (!dom()) {
      throw new UnavailabilityError('notifications')
    }

    if (Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  },
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})

permissionOwners.notifications = {
  getPermissions: () => notifications.getPermissions(),
  requestPermissions: () => notifications.requestPermissions(),
}
