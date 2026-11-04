/** Semantic identity belongs to a view, independently of click registration. */
export interface AccessibilityProps {
  accessible?: boolean
  accessibilityLabel?: string
  accessibilityRole?: string
  accessibilityHint?: string
  accessibilityValue?: string | number
  accessibilityMinValue?: number
  accessibilityMaxValue?: number
  accessibilityValueDescription?: string
  accessibilityOrientation?: string
  accessibilityState?: Readonly<{
    disabled?: boolean
    readonly?: boolean
    checked?: boolean | 'mixed'
    selected?: boolean
    pressed?: boolean
    expanded?: boolean
  }>
  onAccessibilityIncrement?: () => boolean
  onAccessibilityDecrement?: () => boolean
}

export interface AccessibilityLease {
  current(): boolean
  update(patch: Partial<AccessibilityProps>): void
  release(): void
}

export type AccessibilityState = ReturnType<typeof createAccessibilityState>

export function createAccessibilityState() {
  const views = new WeakMap<
    object,
    { lease: AccessibilityLease; props: Readonly<AccessibilityProps> }
  >()
  function acquire(view: object): AccessibilityLease {
    let active = true
    const current = () => active && views.get(view)?.lease === lease
    const lease: AccessibilityLease = {
      current,
      update(patch) {
        if (!current()) {
          return
        }
        const props = { ...views.get(view)!.props, ...patch }
        if (props.accessibilityState) {
          props.accessibilityState = Object.freeze({ ...props.accessibilityState })
        }
        views.set(view, { lease, props: Object.freeze(props) })
      },
      release() {
        if (!active) {
          return
        }
        active = false
        if (views.get(view)?.lease === lease) {
          views.delete(view)
        }
      },
    }
    views.set(view, { lease, props: Object.freeze({}) })
    return lease
  }
  function get(view: object): Readonly<AccessibilityProps> | undefined {
    return views.get(view)?.props
  }
  return { acquire, get }
}
