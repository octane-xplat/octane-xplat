export type EventName = string | symbol
export type Listener = (...args: any[]) => void

export interface EventEmitter {
  addListener(name: EventName, listener: Listener): this
  on(name: EventName, listener: Listener): this
  once(name: EventName, listener: Listener): this
  prependListener(name: EventName, listener: Listener): this
  prependOnceListener(name: EventName, listener: Listener): this
  emit(name: EventName, ...args: unknown[]): boolean
  removeListener(name: EventName, listener: Listener): this
  off(name: EventName, listener: Listener): this
  removeAllListeners(name?: EventName): this
  listeners(name: EventName): Listener[]
  rawListeners(name: EventName): Listener[]
  listenerCount(name: EventName): number
  eventNames(): EventName[]
  getMaxListeners(): number
  setMaxListeners(count: number): this
}

export interface EventEmitterConstructor {
  new (): EventEmitter
  EventEmitter: EventEmitterConstructor
  defaultMaxListeners: number
  errorMonitor: symbol
  captureRejectionSymbol: symbol
  listenerCount(emitter: EventEmitter, name: EventName): number
  setMaxListeners(count: number, ...emitters: EventEmitter[]): void
  once(emitter: EventEmitter, name: EventName): Promise<unknown[]>
  on(emitter: EventEmitter, name: EventName): AsyncIterableIterator<unknown[]>
}
