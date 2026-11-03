import type { createAccessibleHost } from './accessible-host'
import type { ElementNode } from './model'
import { NSAccessibilityPostNotification } from '@octane-xplat/platform/macos'
import { syncHeadingAccessibility } from './heading-accessibility.ts'

interface Dependencies {
  accessibleHost: Pick<
    ReturnType<typeof createAccessibleHost>,
    | 'AccessibleHostView'
    | 'stackAccessibilityPropsByView'
    | 'accessibilityLabels'
    | 'accessibilityRoles'
  >
}

export function createAccessibility(deps: Dependencies) {
  function applyAccessibility(node: ElementNode, name: string, value: any) {
    // Every mason-backed container hosts AccessibleHostView, so AX props apply
    // to any interactive container — not just the old stack/flex hosts.
    if (
      node.actionId !== undefined &&
      node.view instanceof deps.accessibleHost.AccessibleHostView
    ) {
      const props = deps.accessibleHost.stackAccessibilityPropsByView.get(node.view!) ?? {}
      if (name === 'onAccessibilityIncrement' || name === 'onAccessibilityDecrement') {
        const handler = value
        value =
          typeof handler === 'function'
            ? () => {
                if (node.props.disabled || !node.container.root) {
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

      deps.accessibleHost.stackAccessibilityPropsByView.set(node.view!, { ...props, [name]: value })
      const changed =
        name === 'accessibilityValue'
          ? !Object.is(props[name], value)
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

      if (name === 'accessibilityLabel') {
        deps.accessibleHost.accessibilityLabels.set(node.actionId!, String(value ?? ''))
      }

      if (name === 'accessibilityRole') {
        deps.accessibleHost.accessibilityRoles.set(node.actionId!, String(value ?? ''))
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
  }
}
