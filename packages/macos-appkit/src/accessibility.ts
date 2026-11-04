import type { AccessibleHost } from './accessible-host'
import type { AccessibilityState, AccessibilityLease, AccessibilityProps } from './accessibility-state'
import type { ElementNode } from './model'
import { NSAccessibilityPostNotification } from '@octane-xplat/platform/macos'
import { syncHeadingAccessibility } from './heading-accessibility.ts'

interface Dependencies {
  accessibleHost: Pick<AccessibleHost, 'AccessibleHostView'>
  state: AccessibilityState
}

export type Accessibility = ReturnType<typeof createAccessibility>

export function createAccessibility(deps: Dependencies) {
  const leases = new WeakMap<ElementNode, { view: object; lease: AccessibilityLease }>()
  function accessibilityLease(node: ElementNode) {
    const prior = leases.get(node)
    if (prior?.view === node.view && prior.lease.current()) { return prior.lease }
    prior?.lease.release()
    const lease = deps.state.acquire(node.view!)
    leases.set(node, { view: node.view!, lease })
    return lease
  }
  function disposeAccessibility(node: ElementNode) {
    const prior = leases.get(node)
    leases.delete(node)
    prior?.lease.release()
  }
  function applyAccessibility(node: ElementNode, name: string, value: any) {
    // Every mason-backed container hosts AccessibleHostView, so AX props apply
    // to any interactive container — not just the old stack/flex hosts.
    if (
      node.view instanceof deps.accessibleHost.AccessibleHostView
    ) {
      const lease = accessibilityLease(node)
      const props = deps.state.get(node.view!) ?? {}
      if (name === 'onAccessibilityIncrement' || name === 'onAccessibilityDecrement') {
        const handler = value
        value =
          typeof handler === 'function'
            ? () => {
                if (!lease.current() || node.lifecycle === 'disposing' || node.lifecycle === 'disposed' || node.props.disabled || node.props.isEnabled === false || node.props.enabled === false ||
                    node.props.accessibilityState?.disabled || node.props.accessibilityState?.readonly || !node.container.root) {
                  return false
                }
                try {
                  node.container.root.eventScope('discrete', handler)
                  return true
                } catch (error) {
                  console.error('[macos-event] accessibility adjustment failed', error)
                  return false
                }
              }
            : undefined
      }

      // Native props are normalized by the owning prop handlers; only semantic
      // fields enter this typed view record, never action IDs or handlers.
      const patch: Partial<AccessibilityProps> = {}
      switch (name) {
        case 'accessible': patch.accessible = value; break
        case 'accessibilityLabel': patch.accessibilityLabel = String(value ?? ''); break
        case 'accessibilityRole': patch.accessibilityRole = String(value ?? ''); break
        case 'accessibilityHint': patch.accessibilityHint = value; break
        case 'accessibilityValue': patch.accessibilityValue = value; break
        case 'accessibilityMinValue': patch.accessibilityMinValue = value; break
        case 'accessibilityMaxValue': patch.accessibilityMaxValue = value; break
        case 'accessibilityValueDescription': patch.accessibilityValueDescription = value; break
        case 'accessibilityOrientation': patch.accessibilityOrientation = value; break
        case 'accessibilityState': patch.accessibilityState = value; break
        case 'onAccessibilityIncrement': patch.onAccessibilityIncrement = value; break
        case 'onAccessibilityDecrement': patch.onAccessibilityDecrement = value; break
      }
      lease.update(patch)
      const changed =
        name === 'accessibilityValue'
          ? !Object.is(props.accessibilityValue, value)
          : name === 'accessibilityState' &&
            (props[name]?.checked !== value?.checked ||
              props[name]?.selected !== value?.selected ||
              props[name]?.pressed !== value?.pressed)

      if (
        changed &&
        Object.hasOwn(props, name) &&
        typeof NSAccessibilityPostNotification === 'function'
      ) {
        NSAccessibilityPostNotification(node.view!, 'AXValueChanged')
      }


    }

    if (
      node.type === 'label' &&
      (name === 'accessibilityRole' || name === 'accessibilityHeadingLevel')
    ) {
      syncHeadingAccessibility(node.view!, { ...node.props, [name]: value })
    }

    if (['label', 'htmlview', 'scrollview'].includes(node.type)) {
      if (name === 'accessibilityLabel') {
        node.view!.setAccessibilityLabel?.(String(value ?? ''))
      } else if (name === 'accessibilityHint') {
        node.view!.accessibilityHelp = (value == null ? null : String(value)) as string
      } else if (name === 'accessibilityValue') {
        // Keep the native content/value intact; portable value text
        // describes the host without changing its text or scroll position.
        node.view!.accessibilityValueDescription = (value == null ? null : String(value)) as string
      } else if (name === 'accessible') {
        node.view!.accessibilityElement = value !== false
      }
    }

    if (['textfield', 'textview', 'searchbar'].includes(node.type)) {
      if (name === 'accessibilityLabel') {
        node.view!.setAccessibilityLabel?.(String(value ?? ''))
      } else if (name === 'accessibilityRole') {
        const view = node.view!
        if (node.nativeTextRole && node.nativeTextRole.view !== view) {
          node.nativeTextRole.view.accessibilityRole = node.nativeTextRole.original
          node.nativeTextRole = undefined
        }

        if (value === 'combobox') {
          node.nativeTextRole ??= { view, original: view.accessibilityRole }
          view.accessibilityRole = 'AXComboBox'
        } else if (node.nativeTextRole) {
          view.accessibilityRole = node.nativeTextRole.original
          node.nativeTextRole = undefined
        }
      } else if (name === 'accessibilityState') {
        const view = node.view!
        if (node.type === 'textview') {
          view.setAccessibilityEnabled?.(value?.disabled !== true)
        }

        if (node.nativeTextExpanded && node.nativeTextExpanded.view !== view) {
          node.nativeTextExpanded.view.accessibilityExpanded = node.nativeTextExpanded.original
          node.nativeTextExpanded = undefined
        }

        if (typeof value?.expanded === 'boolean') {
          node.nativeTextExpanded ??= { view, original: view.accessibilityExpanded }
          view.accessibilityExpanded = value.expanded
        } else if (node.nativeTextExpanded) {
          view.accessibilityExpanded = node.nativeTextExpanded.original
          node.nativeTextExpanded = undefined
        }
      } else if (name === 'accessibilityHint') {
        node.view!.setAccessibilityHint?.(String(value ?? ''))
      } else if (name === 'accessible') {
        node.view!.setAccessibilityElement?.(value !== false)
      }
    }
  }
  return {
    applyAccessibility,
    disposeAccessibility,
  }
}
