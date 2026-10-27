export * from './generated/types.js'
import type { Permissioned } from '@octane-xplat/lib/capability'
import type { NotificationsImpl } from './generated/types.js'
/** Local macOS notifications; permission is requested via requestPermissions(). */
export declare const notifications: Permissioned<NotificationsImpl>
