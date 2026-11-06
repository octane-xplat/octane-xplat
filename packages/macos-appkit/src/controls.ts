import type { Actions } from './actions'
import type { CssCascade } from './css-cascade'
import type { Accessibility } from './accessibility'
import type { PropBag, ElementNode } from './model'
import {
  NSBorderType,
  NSNotificationCenter,
  NSScrollView,
  NSBezelStyle,
  NSButton,
  NSButtonType,
  NSControlSize,
  NSProgressIndicator,
  NSProgressIndicatorStyle,
  NSSlider,
  NSViewBoundsDidChangeNotification,
} from '@octane-xplat/platform/macos'

import { configureScrollAxes } from './scroll-view'
import { makeMasonHostView } from './mason'

interface Dependencies {
  actions: Pick<
    Actions,
    'acquireAction' | 'setNodeHandler' | 'buttonActionTarget' | 'setControlAction'
  >
  cssCascade: Pick<CssCascade, 'setNodeInlineStyle' | 'applyClassName'>
  accessibility: Pick<Accessibility, 'applyAccessibility'>
}

export type Controls = ReturnType<typeof createControls>

export function createControls(deps: Dependencies) {
  const scrollHandlers = new WeakMap<object, () => void>()

  function makeButton(node: ElementNode, props: PropBag) {
    const button = NSButton.buttonWithTitleTargetAction(
      String(props.title ?? 'Button'),
      deps.actions.buttonActionTarget,
      'buttonPressed:',
    )

    button.bezelStyle = NSBezelStyle.Rounded
    button.setButtonType(NSButtonType.MomentaryLight)
    button.translatesAutoresizingMaskIntoConstraints = false
    const actionId = deps.actions.acquireAction(node, button)
    button.tag = actionId
    return { view: button, actionId }
  }

  function makeScrollView(node: ElementNode) {
    const scroll = NSScrollView.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 480, height: 320 },
    })

    node.view = scroll
    // The document view is a mason host — the engine sizes it to content and
    // pins scroll children inside it.
    const content = makeMasonHostView(node)
    node.childHost = content
    scroll.hasVerticalScroller = true
    scroll.drawsBackground = false
    scroll.borderType = NSBorderType.No
    scroll.translatesAutoresizingMaskIntoConstraints = false
    scroll.documentView = content
    return { view: scroll, childHost: content }
  }

  function setScrollAction(node: ElementNode, handler: ((event: any) => void) | undefined) {
    const clipView = (node.view! as NSScrollView).contentView
    if (typeof handler !== 'function') {
      scrollHandlers.delete(clipView)
      return
    }

    if (!node.scrollObserverInstalled) {
      clipView.postsBoundsChangedNotifications = true
      node.scrollObserver =
        NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
          NSViewBoundsDidChangeNotification,
          clipView,
          null,
          () => scrollHandlers.get(clipView)?.(),
        )

      node.scrollObserverInstalled = true
    }

    scrollHandlers.set(clipView, () => {
      const startedAt = performance.now()
      const bounds = clipView.bounds
      const contentHeight = Number(
        (node.view! as NSScrollView).documentView?.frame?.size?.height ?? 0,
      )

      const event = {
        verticalOffset: Number(bounds.origin.y ?? 0),
        viewportHeight: Number(bounds.size.height ?? 0),
        contentHeight,
      }

      try {
        node.container.root!.eventScope('discrete', () => handler(event))
      } catch (error) {
        console.error('[macos-event] scroll handler failed', error)
      }

      if ((process.env as { [key: string]: string | undefined }).OCTANE_MACOS_AUTOMATION === '1') {
        node.scrollMetrics ??= { events: [] }
        const sample = {
          verticalOffset: event.verticalOffset,
          callbackMs: performance.now() - startedAt,
          mountedRows: null as number | null,
          afterEventMs: null as number | null,
        }

        node.scrollMetrics.events.push(sample)
        if (node.scrollMetrics.events.length > 2000) {
          node.scrollMetrics.events.shift()
        }

        setTimeout(() => {
          sample.afterEventMs = performance.now() - startedAt
          sample.mountedRows = [...node.container.nodes.values()].filter(
            (candidate) =>
              /^(?:row-r|bench-row-)\d+$/.test(String(candidate.props.id ?? '')) &&
              candidate.parent !== null &&
              candidate.view?.superview != null,
          ).length
        }, 0)
      }
    })
  }

  function makeSwitch(node: ElementNode, props: PropBag) {
    const button = NSButton.buttonWithTitleTargetAction(
      '',
      deps.actions.buttonActionTarget,
      'controlChanged:',
    )
    button.setButtonType(NSButtonType.Switch)
    button.state = props.checked ? 1 : 0
    button.translatesAutoresizingMaskIntoConstraints = false
    const actionId = deps.actions.acquireAction(node, button)
    button.tag = actionId
    return { view: button, actionId }
  }

  function makeProgress() {
    const view = NSProgressIndicator.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 140, height: 16 },
    })

    view.style = NSProgressIndicatorStyle.Bar
    view.controlSize = NSControlSize.Regular
    view.indeterminate = false
    view.displayedWhenStopped = true
    view.minValue = 0
    view.maxValue = 100
    view.doubleValue = 0
    view.sizeToFit()
    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }

  function syncProgress(node: ElementNode) {
    const view = node.view! as NSProgressIndicator
    const maximum = node.props.maxValue ?? 100
    // A positive native range keeps the degenerate shared case at 0%,
    // without asking AppKit to divide by zero or accept a negative range.
    view.maxValue = maximum > 0 ? maximum : 100
    view.doubleValue = maximum > 0 ? Math.min(Math.max(node.props.value ?? 0, 0), maximum) : 0
  }

  function makeActivityIndicator() {
    const view = NSProgressIndicator.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 16, height: 16 },
    })

    view.style = NSProgressIndicatorStyle.Spinning
    view.controlSize = NSControlSize.Regular
    view.indeterminate = true
    view.displayedWhenStopped = false
    view.sizeToFit()
    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }

  function syncActivityIndicator(node: ElementNode) {
    const view = node.view! as NSProgressIndicator
    if (node.props.busy === true) {
      view.startAnimation(null)
    } else {
      view.stopAnimation(null)
    }

    // NSStackView detaches hidden arranged views. Suppress drawing instead
    // so a stopped spinner retains its NativeScript-style layout slot.
    view.alphaValue = node.props.busy === true ? Number(node.appliedStyle?.opacity ?? 1) : 0
  }

  function makeSlider(node: ElementNode, props: PropBag) {
    const slider = NSSlider.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 140, height: 24 },
    })

    slider.minValue = Number(props.minValue ?? 0)
    slider.maxValue = Number(props.maxValue ?? 1)
    slider.doubleValue = Number(props.value ?? 0)
    slider.target = deps.actions.buttonActionTarget
    slider.action = 'controlChanged:'
    slider.translatesAutoresizingMaskIntoConstraints = false
    const actionId = deps.actions.acquireAction(node, slider)
    slider.tag = actionId
    return { view: slider, actionId }
  }
  function applyBuiltinProgressProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (['value', 'maxValue', 'id'].includes(name)) {
      return
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'accessible' || name.startsWith('accessibility')) {
      deps.accessibility.applyAccessibility(node, name, value)
    } else if (name.startsWith('on') && value == null) {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored progress prop ' + name)
    }
  }

  function applyBuiltinActivityIndicatorProp(
    node: ElementNode,
    name: string,
    value: PropBag[string],
  ) {
    if (name === 'busy' || name === 'id') {
      return
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'accessible' || name.startsWith('accessibility')) {
      deps.accessibility.applyAccessibility(node, name, value)
    } else if (name.startsWith('on') && value == null) {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored activityindicator prop ' + name)
    }
  }

  function applyBuiltinButtonProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (name === 'title' || name === 'text') {
      node.view!.title = String(value ?? '')
    } else if (name === 'accessibilityLabel') {
      node.view!.setAccessibilityLabel?.(String(value ?? ''))
    } else if (name === 'isEnabled' || name === 'enabled') {
      node.view!.enabled = node.props.isEnabled !== false && node.props.enabled !== false
    } else if (name === 'onPress' || name === 'onTap') {
      deps.actions.setNodeHandler(
        node,
        typeof value === 'function'
          ? () => {
              if (
                !node.container.root ||
                node.props.isEnabled === false ||
                node.props.enabled === false
              ) {
                return
              }
              try {
                node.container.root.eventScope('discrete', value)
              } catch (error) {
                console.error('[macos-event] button handler failed', error)
              }
            }
          : undefined,
      )
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'id') {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored button prop ' + name)
    }
  }

  function applyBuiltinScrollViewProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'accessible' || name.startsWith('accessibility')) {
      deps.accessibility.applyAccessibility(node, name, value)
    } else if (name === 'scrollBarIndicatorVisible') {
      configureScrollAxes(node)
    } else if (
      name === 'id' ||
      name === 'horizontal' ||
      name === 'orientation' ||
      name === 'showsVerticalScrollIndicator'
    ) {
      return
    } else if (name === 'onScroll') {
      setScrollAction(node, value)
    } else if (name.startsWith('on')) {
      if (typeof value === 'function') {
        console.warn('[macos-host] ' + name + ' is unsupported on ScrollView')
      }
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored scrollview prop ' + name)
    }
  }

  function applyBuiltinSwitchProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (name === 'checked') {
      node.view!.state = value ? 1 : 0
    } else if (name === 'onCheckedChange') {
      deps.actions.setControlAction(node, value, () => node.view!.state === 1)
    } else if (name === 'disabled') {
      node.view!.enabled = value !== true
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'id') {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored switch prop ' + name)
    }
  }

  function applyBuiltinSliderProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (name === 'value') {
      node.view!.doubleValue = Number(value ?? 0)
    } else if (name === 'minValue') {
      node.view!.minValue = Number(value ?? 0)
    } else if (name === 'maxValue') {
      node.view!.maxValue = Number(value ?? 1)
    } else if (name === 'onValueChange') {
      deps.actions.setControlAction(node, value, () => Number(node.view!.doubleValue))
    } else if (name === 'disabled') {
      node.view!.enabled = value !== true
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'id') {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored slider prop ' + name)
    }
  }

  function disposeBuiltinActivityIndicator(node: ElementNode) {
    if (node.type === 'activityindicator' && node.view) {
      node.view.stopAnimation(null)
      node.view.alphaValue = 0
      node.view.hidden = true
    }
  }

  function disposeBuiltinScrollView(node: ElementNode) {
    if (node.type === 'scrollview' && node.scrollObserverInstalled && node.view) {
      const clipView = node.view.contentView
      scrollHandlers.delete(clipView)
      const observer = node.scrollObserver
      node.scrollObserver = null
      node.scrollObserverInstalled = false
      NSNotificationCenter.defaultCenter.removeObserver(observer)
    }
  }

  return {
    scrollHandlers,
    makeButton,
    makeScrollView,
    setScrollAction,
    makeSwitch,
    makeProgress,
    syncProgress,
    makeActivityIndicator,
    syncActivityIndicator,
    makeSlider,
    applyBuiltinProgressProp,
    applyBuiltinActivityIndicatorProp,
    applyBuiltinButtonProp,
    applyBuiltinScrollViewProp,
    applyBuiltinSwitchProp,
    applyBuiltinSliderProp,
    disposeBuiltinActivityIndicator,
    disposeBuiltinScrollView,
  }
}
