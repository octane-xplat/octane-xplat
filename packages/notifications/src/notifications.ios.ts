// Notifications — iOS local notifications. Permission flows stay on
// @nativescript/local-notifications, but delivery posts through
// UNUserNotificationCenter directly: plugin 7.0.0 only ever builds a fixed
// ~2s UNTimeIntervalNotificationTrigger for unscheduled sends, so a nil
// trigger is the only immediate-delivery path on iOS.
import { LocalNotifications } from '@nativescript/local-notifications'
import type { Permissioned, PermissionResponse } from '@octane-xplat/lib/capability'
import { notificationBody } from './notification-body'
import type { NotificationsImpl } from './types'

declare const UNMutableNotificationContent: any
declare const UNNotificationRequest: any
declare const UNNotificationSound: any
declare const UNUserNotificationCenter: any
declare const NSMutableDictionary: any

// Keep IDs distinct for rapid sends and within a signed 32-bit range.
let nextId = Date.now() % 2147483647

const respond = (granted: boolean, canAskAgain: boolean): PermissionResponse => ({
  status: granted ? 'granted' : 'denied',
  granted,
  canAskAgain,
})

/** iOS local notifications — plugin permissions, untriggered UN delivery. */
export const notifications: Permissioned<NotificationsImpl> = {
  supported: true,
  isAvailable: async () => true,
  async getPermissions() {
    // The plugin exposes only a boolean — 'undetermined' reads as 'denied'.
    return respond(await LocalNotifications.hasPermission(), true)
  },
  async requestPermissions() {
    const granted = await LocalNotifications.requestPermission()
    // A request denial is permanent on iOS and cannot be re-prompted.
    return respond(granted, granted)
  },
  notify(title, body) {
    const id = nextId
    nextId = (nextId + 1) % 2147483647
    void (async () => {
      if (await LocalNotifications.hasPermission()) {
        // Match the plugin's content mapping: a ' ' body keeps the title
        // slot while satisfying iOS's non-empty-body requirement.
        const content = UNMutableNotificationContent.new()
        content.title = title
        content.body = notificationBody(body)
        content.sound = UNNotificationSound.defaultSound
        // Mirror the plugin observer's userInfo markers so foreground
        // presentation keeps its established handling (badge + sound).
        const userInfo = NSMutableDictionary.new()
        userInfo.setObjectForKey('nativescript-local-notifications', '__NotificationType')
        userInfo.setObjectForKey(false, 'forceShowWhenInForeground')
        userInfo.setObjectForKey(0, 'priority')
        content.userInfo = userInfo
        // A nil trigger delivers as soon as possible — this is the only
        // immediate path; the plugin always schedules a ~2s trigger.
        const request = UNNotificationRequest.requestWithIdentifierContentTrigger(
          `${id}`,
          content,
          null,
        )

        UNUserNotificationCenter.currentNotificationCenter().addNotificationRequestWithCompletionHandler(
          request,
          () => {},
        )
      }
    })().catch(() => {})
  },
}

const permissionOwners = ((globalThis as any).__xplatPermissionOwners ??= {})
permissionOwners.notifications = {
  getPermissions: () => notifications.getPermissions(),
  requestPermissions: () => notifications.requestPermissions(),
}
