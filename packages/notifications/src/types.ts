/** Local-notification façade; push (APNs/FCM) is intentionally out of scope. */
export interface NotificationsImpl {
  /** Post a local notification. Fire-and-forget: silently dropped when
   *  permission is not granted. iOS posts an untriggered request to
   *  UNUserNotificationCenter for immediate delivery; other targets use the
   *  plugin's scheduled send. */
  notify(title: string, body?: string): void
}

export { UnavailabilityError } from '@octane-xplat/lib/capability'
export type {
  Permissioned,
  PermissionResponse,
  PermissionStatus,
  Service,
} from '@octane-xplat/lib/capability'
