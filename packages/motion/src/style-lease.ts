import type { MotionData } from './value-codec'
import type { StyleProperty } from './types'

export type StyleLease = {
  write(values: Partial<Record<StyleProperty, MotionData>>): void
  release(key?: StyleProperty): void
}

/** Restore only writes still owned by this lease, retaining intervening style writers. */
export function createStyleLease<T>(
  read: (key: StyleProperty) => T,
  write: (key: StyleProperty, value: MotionData | T) => void,
): StyleLease {
  const owned = new Map<StyleProperty, { base: T; applied: unknown }>()
  function comparable(value: unknown): unknown {
    if (value && typeof value === 'object' && 'unit' in value && 'value' in value) {
      return `${value.unit}:${value.value}`
    }
    return value
  }
  return {
    write(values) {
      for (const key of Object.keys(values) as StyleProperty[]) {
        const current = read(key)
        const entry = owned.get(key) ?? { base: current, applied: undefined }
        if (owned.has(key) && comparable(current) !== entry.applied) {
          entry.base = current
        }
        const next = values[key]
        if (next === undefined) {
          continue
        }
        write(key, next)
        entry.applied = comparable(read(key))
        owned.set(key, entry)
      }
    },
    release(key) {
      for (const [property, entry] of owned) {
        if (key !== undefined && key !== property) {
          continue
        }
        if (comparable(read(property)) === entry.applied) {
          write(property, entry.base)
        }
        owned.delete(property)
      }
    },
  }
}
