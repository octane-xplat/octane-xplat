import { events } from './engine.js'

export const EventEmitter = events
export type EventEmitter = import('./types/events.js').EventEmitter
export const once = events.once
export const on = events.on
export const listenerCount = events.listenerCount
export const setMaxListeners = events.setMaxListeners
export const errorMonitor = events.errorMonitor
export const captureRejectionSymbol = events.captureRejectionSymbol
export type { EventName, Listener } from './types/events.js'
export default events
