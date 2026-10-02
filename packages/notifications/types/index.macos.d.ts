export * from './generated/types.js'
import type { Capability, NotificationsImpl } from './generated/types.js'
/** Local macOS notifications; call ensure() before notify(). */
export declare const notifications: Capability<NotificationsImpl>
