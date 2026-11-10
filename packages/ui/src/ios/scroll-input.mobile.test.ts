import { describe, expect, it } from 'vitest'
import { suspendScrollInput } from './scroll-input.ios'

function host(enabled = true, children: object[] = []) {
  const writes: boolean[] = []
  let current = enabled

  return {
    _styleHelper: {},
    nativeViewProtected: {
      get userScrollEnabled() {
        return current
      },
      set userScrollEnabled(value: boolean) {
        writes.push(value)
        current = value
      },
      scrollLeft: -12.25,
      scrollTop: 617.125,
      scrollTo(value: { left: number; top: number }) {
        this.scrollLeft = value.left
        this.scrollTop = value.top
      },
    },
    eachChildView(visit: (child: object) => boolean) {
      children.forEach(visit)
    },
    writes,
  }
}

describe('iOS scroll input ownership', () => {
  it('synchronously locks both axes in descendants, preserves offsets and seeks, and excludes ancestors', () => {
    const child = host(),
      root = host(true, [child]),
      ancestor = host(true, [root])

    const release = suspendScrollInput(root)

    expect(root.nativeViewProtected.userScrollEnabled).toBe(false)
    expect(child.nativeViewProtected.userScrollEnabled).toBe(false)
    expect(ancestor.writes).toEqual([])
    expect(child.nativeViewProtected.scrollLeft).toBe(-12.25)
    expect(child.nativeViewProtected.scrollTop).toBe(617.125)
    child.nativeViewProtected.scrollTo({ left: 23.5, top: 800.25 })
    release()
    release()
    expect(child.writes).toEqual([false, true])
    expect(child.nativeViewProtected.scrollTop).toBe(800.25)
  })

  it('restores only after the last overlapping owner and retains originally disabled flags', () => {
    const child = host(false),
      root = host(true, [child])

    const outer = suspendScrollInput(root),
      inner = suspendScrollInput(child)

    outer()
    expect(child.writes).toEqual([false])
    inner()
    expect(child.writes).toEqual([false, false])
    expect(root.writes).toEqual([false, true])
  })

  it('keeps enabled descendants suspended until the last overlapping owner releases', () => {
    const child = host(),
      root = host(true, [child])

    const inner = suspendScrollInput(child)
    const outer = suspendScrollInput(root)

    inner()
    expect(child.nativeViewProtected.userScrollEnabled).toBe(false)
    outer()
    expect(child.writes).toEqual([false, true])
  })

  it('leaves foreign recognizers and newly mounted descendants outside the snapshot', () => {
    const recognizer = { enabled: true }
    const foreign = { nativeViewProtected: { gestureRecognizers: [recognizer] } }
    const children: object[] = [foreign]
    const root = host(true, children)
    const release = suspendScrollInput(root)
    const late = host()

    children.push(late)
    expect(late.writes).toEqual([])
    expect(recognizer.enabled).toBe(true)
    release()
    expect(late.writes).toEqual([])
  })

  it('preflights old and unloaded native hosts before taking any lock', () => {
    for (const nativeViewProtected of [{}, undefined]) {
      const child = { _styleHelper: {}, nativeViewProtected }
      const root = host(true, [child])

      expect(() => suspendScrollInput(root)).toThrow('Mason core 1.0.0-beta.8 or later')
      expect(root.writes).toEqual([])
    }

    expect(() => suspendScrollInput({})).toThrow('loaded Mason scroll subtree')

    const root = host(true, [{ isLoaded: false }])

    expect(() => suspendScrollInput(root)).toThrow('Mason core 1.0.0-beta.8 or later')
    expect(root.writes).toEqual([])
  })

  it('rolls back acquired locks when a later native setter rejects the write', () => {
    const child = host()
    const broken = {
      nativeViewProtected: {
        get userScrollEnabled() {
          return true
        },
        set userScrollEnabled(_value: boolean) {
          throw new Error('native rejection')
        },
      },
    }

    const root = host(true, [child, broken])

    expect(() => suspendScrollInput(root)).toThrow('native rejection')
    expect(root.writes).toEqual([false, true])
    expect(child.writes).toEqual([false, true])
  })
})
