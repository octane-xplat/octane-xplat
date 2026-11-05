import type { Nodes } from './nodes'
import type { ContainerElements } from './container-elements'
import type { Actions } from './actions'
import type { TextElements } from './text-elements'
import type { CssCascade } from './css-cascade'
import type { PickerElements } from './picker-elements'
import type { Layout } from './layout'
import type { Subscriptions } from './subscriptions'
import type { Registry } from './registry'
import type { AccessibleHost } from './accessible-host'
import type { Accessibility } from './accessibility'
import type { HostedElements } from './hosted-elements'
import type { Controls } from './controls'
import type { InputElements } from './input-elements'
import type { ImageElements } from './image-elements'
import type { NativeStyle } from './native-style'
import type { PropBag, ElementNode } from './model'
import { normalizeHostStyleProps } from './inline-style.ts'
import { syncTabView, syncTabItem } from './tab-view'
import { setImageGeometryHandler } from './image-geometry.ts'
import { NSImageView, NSTextField } from '@octane-xplat/platform/macos'
import { setPressGesture } from './gestures'
import { configureScrollAxes } from './scroll-view'
import { updateWebView } from './webview'
import { updateListView } from './list-view'
import { updatePagerView } from './pager'
import { updateVideoView } from './video'

interface Dependencies {
  nodes: Pick<Nodes, 'validateNodeProps'>
  containerElements: Pick<
    ContainerElements,
    | 'setActionBarTitleView'
    | 'applyBuiltinContentHostProp'
    | 'applyBuiltinLiquidGlassProp'
    | 'applyBuiltinPlaceholderProp'
  >
  actions: Pick<Actions, 'hasHandler' | 'setPanAction'>
  textElements: Pick<
    TextElements,
    | 'syncTextLinks'
    | 'syncText'
    | 'applyBuiltinHtmlViewProp'
    | 'applyBuiltinLabelProp'
    | 'syncLabelOverflow'
    | 'syncHtmlView'
  >
  cssCascade: Pick<
    CssCascade,
    'setNodeId' | 'setPseudoClass' | 'syncNormalState' | 'setNodeInlineStyle' | 'applyClassName'
  >
  pickerElements: Pick<
    PickerElements,
    | 'syncSegmentedBar'
    | 'applyBuiltinSegmentedBarProp'
    | 'applyBuiltinListPickerProp'
    | 'applyBuiltinTimePickerProp'
    | 'applyBuiltinDatePickerProp'
    | 'syncListPicker'
    | 'syncDatePicker'
    | 'syncTimePicker'
  >
  layout: Pick<Layout, 'queueLayoutReconcile' | 'setLayoutAction'>
  subscriptions: Pick<Subscriptions, 'setKeyActions' | 'setFocusActions' | 'setImageActions'>
  registry: Pick<Registry, 'behaviorOf'>
  accessibleHost: Pick<AccessibleHost, 'AccessibleHostView'>
  accessibility: Pick<Accessibility, 'applyAccessibility'>
  hostedElements: Pick<
    HostedElements,
    'applyBuiltinTabViewProp' | 'applyBuiltinListViewProp' | 'applyBuiltinWebViewProp'
  >
  controls: Pick<
    Controls,
    | 'applyBuiltinProgressProp'
    | 'applyBuiltinActivityIndicatorProp'
    | 'applyBuiltinScrollViewProp'
    | 'applyBuiltinSwitchProp'
    | 'applyBuiltinSliderProp'
    | 'syncActivityIndicator'
    | 'syncProgress'
  >
  inputElements: Pick<
    InputElements,
    | 'applyBuiltinSearchBarProp'
    | 'applyBuiltinTextInputProp'
    | 'syncSecureTextField'
    | 'setTextFieldPlaceholder'
    | 'syncSearchBar'
    | 'fitTextView'
  >
  imageElements: Pick<ImageElements, 'applyBuiltinImageProp'>
  nativeStyle: Pick<NativeStyle, 'setSizeConstraint'>
}

export type ElementProps = ReturnType<typeof createElementProps>

export function createElementProps(deps: Dependencies) {
  /** Host updates carry the complete next prop bag, but applyProps merges — a
   *  key that vanishes would keep its last value forever. Every dropped key
   *  with a recorded value gets an explicit `undefined` clear: node.props then
   *  reads it as removed and each handler resets the native state the prop
   *  installed (sync readers consult the merged bag; writers map `?? default`).
   *  A prior `undefined`/`null` applied nothing, so it needs no clear. */
  function droppedPropClears(node: ElementNode, next: PropBag): PropBag {
    const clears: PropBag = {}
    for (const name of Object.keys(node.props)) {
      if (node.props[name] != null && !(name in next)) {
        clears[name] = undefined
      }
    }

    const authored = node.authoredProps
    if (authored !== undefined) {
      for (const name of Object.keys(authored)) {
        if (authored[name] != null && !(name in next) && !(name in clears)) {
          clears[name] = undefined
        }
      }
    }

    return clears
  }

  function applyProps(node: ElementNode, props: PropBag) {
    props = normalizeHostStyleProps(props)
    if (node.lifecycle !== 'constructing') { node.adapter?.validate?.(props, node.props) }
    if (node.type === 'timepicker') {
      deps.nodes.validateNodeProps(node.type, props)
    }

    if (
      node.type === 'actionbar' &&
      'titleView' in props &&
      node.actionBarTitleViewProp !== props.titleView
    ) {
      deps.containerElements.setActionBarTitleView(node, props.titleView)
    }

    node.props = { ...node.props, ...props }
    if ('testID' in props && node.view) {
      node.view.accessibilityIdentifier = String(props.testID ?? '')
    }
    if ('disabled' in props && node.clickGestureRecognizer) {
      node.clickGestureRecognizer.enabled =
        !node.props.disabled &&
        deps.actions.hasHandler(node.view!)
    }
    if (
      ('disabled' in props || 'isEnabled' in props || 'enabled' in props) &&
      node.linkClickRecognizer
    ) {
      deps.textElements.syncTextLinks(node)
    }
    if ('id' in props) {
      deps.cssCascade.setNodeId(node, props.id)
    }
    if ('disabled' in props || 'isEnabled' in props || 'enabled' in props) {
      deps.cssCascade.setPseudoClass(
        node,
        'disabled',
        node.props.disabled === true ||
          node.props.isEnabled === false ||
          node.props.enabled === false,
      )

      deps.cssCascade.syncNormalState(node)
    }
    if (
      node.authoredProps ||
      node.parent?.type === 'proxyviewcontainer' ||
      node.type === 'proxyviewcontainer'
    ) {
      node.authoredProps = { ...node.authoredProps, ...props }
    }

    if (node.type === 'tabviewitem') {
      syncTabItem(node)
      return
    }

    if (node.type === 'segmentedbaritem') {
      if (node.parent) {
        deps.pickerElements.syncSegmentedBar(node.parent)
      }

      return
    }

    if (node.type === 'proxyviewcontainer') {
      // Projection forwards the proxy's computed style (PROXY_LAYOUT_STYLES),
      // so style inputs must reach the cascade even though the props loop
      // below never runs for a viewless node.
      if ('style' in props) {
        deps.cssCascade.setNodeInlineStyle(node, props.style)
      }

      if ('className' in props) {
        deps.cssCascade.applyClassName(node, props.className)
      }

      deps.layout.queueLayoutReconcile(node.container, node)
      return
    }

    if (node.type === '#text') {
      if ('value' in props) {
        node.text = String(props.value ?? '')
      }

      deps.textElements.syncText(node.parent)
      return
    }

    if (node.type === 'span' || node.type === 'formattedstring') {
      deps.textElements.syncText(node.parent)
      return
    }
    if ('onKeyDown' in props || 'onKeyUp' in props) {
      deps.subscriptions.setKeyActions(node)
    }
    if ('onFocus' in props || 'onBlur' in props) {
      deps.subscriptions.setFocusActions(node)
    }

    const layoutChildProps: Record<string, readonly string[]> = {
      rootlayout: ['row', 'col', 'rowSpan', 'colSpan', 'horizontalAlignment', 'verticalAlignment'],
      contentview: ['horizontalAlignment', 'verticalAlignment'],
      actionbar: ['horizontalAlignment', 'verticalAlignment'],
      masonview: [
        'row',
        'col',
        'rowSpan',
        'colSpan',
        'dock',
        'left',
        'top',
        'right',
        'bottom',
        'horizontalAlignment',
        'verticalAlignment',
      ],
      liquidglass: ['row', 'col', 'rowSpan', 'colSpan', 'horizontalAlignment', 'verticalAlignment'],
      scrollview: ['horizontalAlignment', 'verticalAlignment'],
    }

    for (const [name, value] of Object.entries(props)) {
      if (name === 'data-grid-cell') {
        continue
      } // Retained in props for native useGridFocus discovery.

      if (name === 'testID') {
        continue
      } // Applied once to every concrete native host above.

      if (name === 'onKeyDown' || name === 'onKeyUp' || name === 'onFocus' || name === 'onBlur') {
        continue
      }

      if (
        (node.layoutParent ?? node.parent) &&
        layoutChildProps[(node.layoutParent ?? node.parent)!.type]?.includes(name)
      ) {
        continue
      }

      // Attached alignment metadata is retained before the batch inserts
      // the child; its parent consumes it during layout reconciliation.
      if (
        !node.parent &&
        [
          'dock',
          'horizontalAlignment',
          'verticalAlignment',
          'row',
          'col',
          'rowSpan',
          'colSpan',
          'left',
          'top',
          'right',
          'bottom',
        ].includes(name)
      ) {
        continue
      }

      if (node.type === 'image' && (name === 'onImageLoad' || name === 'onImageError')) {
        deps.subscriptions.setImageActions(node)
        continue
      }

      if (node.type === 'image' && name === 'onImageGeometryChanged') {
        setImageGeometryHandler(
          node.view as NSImageView,
          typeof value === 'function'
            ? (geometry) => node.container.root!.eventScope('discrete', () => value(geometry))
            : undefined,
        )

        continue
      }

      if (name === 'onLayoutChanged') {
        deps.layout.setLayoutAction(node, value)
        continue
      }

      if (
        ['masonview', 'liquidglass'].includes(node.type) ||
        deps.registry.behaviorOf(node.type)?.containerStyles
      ) {
        if (['onTouch', 'onLongPress', 'onDoubleTap'].includes(name)) {
          setPressGesture(node, name)
          continue
        }

        if (name === 'onSwipe') {
          deps.actions.setPanAction(node, value)
          continue
        }

        if (name === 'disabled') {
          deps.actions.setPanAction(node, node.props.onPan)
          for (const event of ['onTouch', 'onLongPress', 'onDoubleTap']) {
            setPressGesture(node, event)
          }

          continue
        }
      }

      if (
        (name === 'onAccessibilityIncrement' || name === 'onAccessibilityDecrement') &&
        node.view instanceof deps.accessibleHost.AccessibleHostView
      ) {
        deps.accessibility.applyAccessibility(node, name, value)
        continue
      }

      if (node.adapter) {
        node.adapter.applyProp?.(node, name, value)
        continue
      }

      // Registered behaviors first — mason-backed containers consume style/
      // className/layout props; unhandled names fall through to the builtin
      // per-type cases (scrollview's own props, stack taps, etc.).
      if (deps.registry.behaviorOf(node.type)?.applyProp?.(node, name, value)) {
        continue
      }

      switch (node.type) {
        case 'rootlayout':
        case 'actionbar':
          deps.containerElements.applyBuiltinContentHostProp(node, name, value)
          break
        case 'liquidglass':
          deps.containerElements.applyBuiltinLiquidGlassProp(node, name, value)
          break
        case 'tabview':
          deps.hostedElements.applyBuiltinTabViewProp(node, name, value)
          break
        case 'segmentedbar':
          deps.pickerElements.applyBuiltinSegmentedBarProp(node, name, value)
          break
        case 'listview':
          deps.hostedElements.applyBuiltinListViewProp(node, name, value)
          break
        case 'listpicker':
          deps.pickerElements.applyBuiltinListPickerProp(node, name, value)
          break
        case 'timepicker':
          deps.pickerElements.applyBuiltinTimePickerProp(node, name, value)
          break
        case 'datepicker':
          deps.pickerElements.applyBuiltinDatePickerProp(node, name, value)
          break
        case 'progress':
          deps.controls.applyBuiltinProgressProp(node, name, value)
          break
        case 'activityindicator':
          deps.controls.applyBuiltinActivityIndicatorProp(node, name, value)
          break
        case 'htmlview':
          deps.textElements.applyBuiltinHtmlViewProp(node, name, value)
          break
        case 'label':
          deps.textElements.applyBuiltinLabelProp(node, name, value)
          break
        case 'scrollview':
          deps.controls.applyBuiltinScrollViewProp(node, name, value)
          break
        case 'searchbar':
          deps.inputElements.applyBuiltinSearchBarProp(node, name, value)
          break
        case 'textfield':
        case 'textview':
          deps.inputElements.applyBuiltinTextInputProp(node, name, value)
          break
        case 'switch':
          deps.controls.applyBuiltinSwitchProp(node, name, value)
          break
        case 'slider':
          deps.controls.applyBuiltinSliderProp(node, name, value)
          break
        case 'webview':
          deps.hostedElements.applyBuiltinWebViewProp(node, name, value)
          break
        case 'image':
        case 'animatedimage':
          deps.imageElements.applyBuiltinImageProp(node, name, value)
          break
        case 'placeholder':
          deps.containerElements.applyBuiltinPlaceholderProp(node, name, value)
          break
        default: {
          const behavior = deps.registry.behaviorOf(node.type)
          if (behavior && !behavior.applyProp?.(node, name, value)) {
            console.warn('[macos-host] ignored ' + node.type + ' prop ' + name)
          }

          break
        }
      }
    }

    node.adapter?.afterProps?.(node, props)

    if (node.type === 'webview') {
      updateWebView(node, props, (height) => {
        deps.cssCascade.setNodeInlineStyle(node, { ...node.props.style, height })
        deps.nativeStyle.setSizeConstraint(node, 'height', height)
      })
    }

    if (node.type === 'textfield') {
      deps.inputElements.syncSecureTextField(node)
      node.view!.enabled = node.props.isEnabled !== false && node.props.enabled !== false
      node.view!.editable = node.view!.enabled && node.props.editable !== false
      deps.inputElements.setTextFieldPlaceholder(
        node.view as NSTextField,
        node.props,
        node.stylePlaceholderColor,
      )
    }

    if (node.type === 'label') {
      deps.textElements.syncLabelOverflow(node)
      deps.textElements.syncText(node)
    }

    if (node.type === 'tabview') {
      syncTabView(node)
    }

    if (node.type === 'segmentedbar') {
      deps.pickerElements.syncSegmentedBar(node)
    }

    if (node.type === 'listpicker') {
      deps.pickerElements.syncListPicker(node)
    }

    if (node.type === 'listview') {
      updateListView(node.view!, node.props)
    }

    if (node.type === 'pager') {
      updatePagerView(node.view!, node.props)
    }

    if (node.type === 'xplatvideo') {
      updateVideoView(node, node.props)
    }

    if (node.type === 'datepicker') {
      deps.pickerElements.syncDatePicker(node, props)
    }

    if (node.type === 'timepicker') {
      deps.pickerElements.syncTimePicker(node, props)
    }

    if (node.type === 'activityindicator') {
      deps.controls.syncActivityIndicator(node)
    }

    if (node.type === 'progress') {
      deps.controls.syncProgress(node)
    }

    if (node.type === 'htmlview') {
      deps.textElements.syncHtmlView(node)
    }

    if (node.type === 'searchbar') {
      deps.inputElements.syncSearchBar(node, props)
    }

    if (node.type === 'textview') {
      node.view!.editable = node.props.isEnabled !== false && node.props.editable !== false
      deps.inputElements.fitTextView(node)
    }

    if (
      node.type === 'scrollview' &&
      (!node.scrollAxisConstraints || 'orientation' in props || 'horizontal' in props)
    ) {
      configureScrollAxes(node)
      deps.layout.queueLayoutReconcile(node.container, node)
    }

    // A container queues its own subtree; a child of a layout parent also
    // queues the parent — the two are not exclusive (a masonview nested in a
    // masonview needs both passes).
    if (
      ['liquidglass', 'actionbar', 'rootlayout'].includes(node.type) ||
      deps.registry.behaviorOf(node.type)?.layout != null
    ) {
      deps.layout.queueLayoutReconcile(node.container, node)
    }
    if (
      node.parent?.type === 'liquidglass' ||
      node.parent?.type === 'rootlayout' ||
      ['contentview', 'actionbar'].includes(node.parent?.type ?? '') ||
      deps.registry.behaviorOf(node.parent?.type)?.layout != null
    ) {
      deps.layout.queueLayoutReconcile(node.container, node.parent)
    }

    if (node.parent?.type === 'proxyviewcontainer') {
      deps.layout.queueLayoutReconcile(node.container, node.parent)
    }

    // Container children also reconcile their own subtree. Their size updates
    // must still notify the outer layout parent.
    if (node.parent?.type === 'rootlayout') {
      deps.layout.queueLayoutReconcile(node.container, node.parent)
    }

    if (node.children?.some((child) => child.type === 'formattedstring' || child.type === 'span')) {
      deps.textElements.syncText(node)
    }
  }
  return {
    droppedPropClears,
    applyProps,
  }
}
