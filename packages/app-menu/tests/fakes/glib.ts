// Minimal GLib fake — Variant construction and an inspectable idle queue.

export class Variant {
  constructor(
    readonly kind: string,
    readonly value: unknown,
  ) {}

  static new_boolean(value: boolean): Variant {
    return new Variant('b', value)
  }

  static new_string(value: string): Variant {
    return new Variant('s', value)
  }
}

export const PRIORITY_DEFAULT = 0
export const SOURCE_REMOVE = false
export const SOURCE_CONTINUE = true

export const idleQueue: (() => boolean)[] = []

export function idle_add(_priority: number, fn: () => boolean): number {
  idleQueue.push(fn)
  return idleQueue.length
}

export default {
  Variant,
  PRIORITY_DEFAULT,
  SOURCE_REMOVE,
  SOURCE_CONTINUE,
  idle_add,
  idleQueue,
}
