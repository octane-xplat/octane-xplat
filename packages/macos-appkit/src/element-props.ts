import type { PropBag, ElementNode } from './model'
import { normalizeHostStyleProps } from './inline-style.ts'
import { syncTabView, syncTabItem } from './tab-view'
import { setImageGeometryHandler } from './image-geometry.ts'
import { NSImageView, NSTextField, NSTextView } from '@octane-xplat/platform/macos'
import { setPressGesture } from './gestures'
import { configureScrollAxes } from './scroll-view'
import { rememberTextLimitValue } from './text-limit.ts'
import { updateImage } from './image'
import { updateWebView } from './webview'
import { updateListView } from './list-view'
import { updatePagerView } from './pager'
import { updateVideoView } from './video'

import type { createNodes } from './nodes'
import type { createContainerElements } from './container-elements'
import type { createActions } from './actions'
import type { createTextElements } from './text-elements'
import type { createCssCascade } from './css-cascade'
import type { createControls } from './controls'
import type { createLayout } from './layout'
import type { createSubscriptions } from './subscriptions'
import type { createRegistry } from './registry'
import type { createAccessibleHost } from './accessible-host'
import type { createAccessibility } from './accessibility'
import type { createNativeStyle } from './native-style'
import type { createInputElements } from './input-elements'

interface Dependencies {
  nodes: Pick<ReturnType<typeof createNodes>, 'validateNodeProps'>
  containerElements: Pick<ReturnType<typeof createContainerElements>, 'setActionBarTitleView'>
  actions: Pick<
    ReturnType<typeof createActions>,
    'actionHandlers' | 'setPanAction' | 'setTextSubmitAction' | 'setControlAction'
  >
  textElements: Pick<
    ReturnType<typeof createTextElements>,
    'syncTextLinks' | 'syncText' | 'setLabelText' | 'syncLabelOverflow' | 'syncHtmlView'
  >
  cssCascade: Pick<
    ReturnType<typeof createCssCascade>,
    'setNodeId' | 'setPseudoClass' | 'syncNormalState' | 'setNodeInlineStyle' | 'applyClassName'
  >
  controls: Pick<
    ReturnType<typeof createControls>,
    | 'syncSegmentedBar'
    | 'setScrollAction'
    | 'syncListPicker'
    | 'syncDatePicker'
    | 'syncTimePicker'
    | 'syncActivityIndicator'
    | 'syncProgress'
  >
  layout: Pick<ReturnType<typeof createLayout>, 'queueLayoutReconcile' | 'setLayoutAction'>
  subscriptions: Pick<
    ReturnType<typeof createSubscriptions>,
    'setKeyActions' | 'setFocusActions' | 'setImageActions'
  >
  registry: Pick<ReturnType<typeof createRegistry>, 'behaviorOf'>
  accessibleHost: Pick<
    ReturnType<typeof createAccessibleHost>,
    'AccessibleHostView' | 'accessibilityLabels'
  >
  accessibility: Pick<ReturnType<typeof createAccessibility>, 'applyAccessibility'>
  nativeStyle: Pick<ReturnType<typeof createNativeStyle>, 'syncNodeFont' | 'setSizeConstraint'>
  inputElements: Pick<
    ReturnType<typeof createInputElements>,
    | 'updateNativeTextValue'
    | 'syncTextViewPlaceholder'
    | 'syncTextControlState'
    | 'syncSecureTextField'
    | 'setTextFieldPlaceholder'
    | 'syncSearchBar'
    | 'fitTextView'
  >
}

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
        typeof deps.actions.actionHandlers.get(node.actionId!) === 'function'
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
        deps.controls.syncSegmentedBar(node.parent)
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

      // Registered behaviors first — mason-backed containers consume style/
      // className/layout props; unhandled names fall through to the builtin
      // per-type cases (scrollview's own props, stack taps, etc.).
      if (deps.registry.behaviorOf(node.type)?.applyProp?.(node, name, value)) {
        continue
      }

      switch (node.type) {
        // Common styling uses the same reconciliation as ContentView.
        case 'rootlayout':
        case 'actionbar':
        case 'contentview':
          if (node.type === 'actionbar' && ['title', 'titleView', 'flat'].includes(name)) {
            continue
          }

          if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name !== 'id' && value !== undefined) {
            console.warn('[macos-host] ignored ' + node.type + ' prop ' + name)
          }

          break
        case 'liquidglass':
          if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'id') {
            continue
          } else if (name === 'overlayChildren') {
            continue
          } else if (name === 'disabled') {
            continue
          } else if (name === 'onPan') {
            deps.actions.setPanAction(node, value)
          } else if (name === 'onAccessibilityIncrement' || name === 'onAccessibilityDecrement') {
            continue
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored ' + node.type + ' prop ' + name)
          }

          break
        case 'tabview':
          if (
            [
              'items',
              'selectedIndex',
              'onSelectedIndexChange',
              'onSelectedIndexChanged',
              'id',
            ].includes(name)
          ) {
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored tabview prop ' + name)
          }

          break
        case 'segmentedbar':
          if (['items', 'selectedIndex', 'onSelectedIndexChange', 'id'].includes(name)) {
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored segmentedbar prop ' + name)
          }

          break
        case 'listview':
          if (
            [
              'items',
              'renderItem',
              'itemTemplate',
              'itemTemplates',
              'separatorColor',
              'onItemTap',
              'onItemLoading',
              'onLoadMoreItems',
              'id',
            ].includes(name)
          ) {
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored listview prop ' + name)
          }

          break
        case 'listpicker':
          if (['items', 'selectedIndex', 'onSelectedIndexChange', 'id'].includes(name)) {
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored listpicker prop ' + name)
          }

          break
        case 'timepicker':
          if (
            [
              'time',
              'hour',
              'minute',
              'minHour',
              'minMinute',
              'maxHour',
              'maxMinute',
              'isEnabled',
              'onTimeChange',
              'id',
            ].includes(name)
          ) {
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored timepicker prop ' + name)
          }

          break
        case 'datepicker':
          if (
            [
              'date',
              'minDate',
              'maxDate',
              'year',
              'month',
              'day',
              'isEnabled',
              'onDateChange',
              'id',
            ].includes(name)
          ) {
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored datepicker prop ' + name)
          }

          break
        case 'progress':
          if (['value', 'maxValue', 'id'].includes(name)) {
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored progress prop ' + name)
          }

          break
        case 'activityindicator':
          if (name === 'busy' || name === 'id') {
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored activityindicator prop ' + name)
          }

          break
        case 'htmlview':
          if (name === 'html' || name === 'id') {
            continue // parse once after all font/color sources reconcile
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored htmlview prop ' + name)
          }

          break
        case 'label':
          if (name === 'text') {
            deps.textElements.setLabelText(node, String(value ?? ''))
          } else if (name === 'fontSize') {
            node.propFontSize = Number(value ?? 16)
            deps.nativeStyle.syncNodeFont(node)
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
            deps.textElements.syncText(node)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'id') {
            continue
          } else if (['maxLines', 'whiteSpace', 'textOverflow'].includes(name)) {
            continue
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored label prop ' + name)
          }

          break
        case 'button':
          if (name === 'title' || name === 'text') {
            node.view!.title = String(value ?? '')
          } else if (name === 'accessibilityLabel') {
            deps.accessibleHost.accessibilityLabels.set(node.actionId!, String(value ?? ''))
            node.view!.setAccessibilityLabel?.(String(value ?? ''))
          } else if (name === 'isEnabled' || name === 'enabled') {
            node.view!.enabled = node.props.isEnabled !== false && node.props.enabled !== false
          } else if (name === 'onPress' || name === 'onTap') {
            deps.actions.actionHandlers.set(
              node.actionId!,
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
                : null,
            )
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'id') {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored button prop ' + name)
          }

          break
        case 'scrollview':
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
            continue
          } else if (name === 'onScroll') {
            deps.controls.setScrollAction(node, value)
          } else if (name.startsWith('on')) {
            if (typeof value === 'function') {
              console.warn('[macos-host] ' + name + ' is unsupported on ScrollView')
            }
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored scrollview prop ' + name)
          }

          break
        case 'searchbar':
          if (name === 'text' || name === 'hint' || name === 'onTextChange') {
            continue // reconciled after binding the entire next prop bag
          } else if (name === 'onSubmit') {
            deps.actions.setTextSubmitAction(
              node,
              typeof value === 'function'
                ? () => value({ eventName: 'submit', object: node.view })
                : null,
            )
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'id') {
            continue
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored searchbar prop ' + name)
          }

          break
        case 'textfield':
        case 'textview':
          if (name === 'value') {
            deps.inputElements.updateNativeTextValue(
              node,
              value === undefined ? undefined : String(value ?? ''),
            )
          } else if (name === 'placeholder') {
            if (node.type === 'textfield') {
              continue
            } else if (node.placeholderView) {
              node.placeholderView.stringValue = String(value ?? '')
              deps.inputElements.syncTextViewPlaceholder(node)
            }
          } else if (name === 'placeholderTextColor' && node.type === 'textfield') {
            continue
          } else if (name === 'onTextChange') {
            deps.actions.setControlAction(node, value, () =>
              String(node.type === 'textview' ? node.view!.string : (node.view!.stringValue ?? '')),
            )
          } else if (name === 'onSubmit') {
            if (node.type === 'textfield') {
              deps.actions.setTextSubmitAction(node, value)
            }
          } else if (name === 'editable' || name === 'isEnabled' || name === 'enabled') {
            deps.inputElements.syncTextControlState(node)
          } else if (name === 'secure') {
            if (node.type !== 'textfield' && value) {
              console.warn(
                '[macos-host] secure is unsupported on <' + node.type + '>; rendering plain text',
              )
            }
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'id') {
            continue
          } else if (['onFocus', 'onBlur', 'onSubmit'].includes(name)) {
            continue
          } else if (name === 'maxLength' && node.type === 'textview') {
            rememberTextLimitValue(node.view as NSTextView, true)
          } else if (name === 'rows' && node.type === 'textview') {
            continue
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (['keyboardType', 'returnKeyType', 'autoGrow', 'maxRows'].includes(name)) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored text control prop ' + name)
          }

          break
        case 'switch':
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
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored switch prop ' + name)
          }

          break
        case 'slider':
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
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored slider prop ' + name)
          }

          break
        case 'webview':
          if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessibilityLabel') {
            node.view!.accessibilityLabel = String(value ?? '')
          } else if (name === 'accessible') {
            node.view!.accessibilityElement = value !== false
          } else if (name === 'accessibilityHint') {
            node.view!.accessibilityHelp = String(value ?? '')
          }

          break
        case 'image':
        case 'animatedimage':
          if (name === 'src' || name === 'placeholder' || name === 'imageCachePolicy') {
            updateImage(
              node.view as NSImageView,
              node.props.src,
              node.props.placeholder,
              node.props.imageCachePolicy,
            )
          } else if (name === 'stretch' && node.type === 'animatedimage') {
            // NSImageScaling — same constants as the objectFit writer.
            // 'aspectFill' degrades to scale-down: AppKit has no crop
            // mode (documented on the shared 'cover' mapping too).
            const scaling: Record<string, number> = {
              aspectFit: 3,
              aspectFill: 0,
              fill: 1,
              none: 2,
            }

            node.view!.imageScaling = scaling[String(value)] ?? 0
          } else if (name === 'autoPlayAnimations' && node.type === 'animatedimage') {
            node.view!.animates = value !== false
          } else if (name === 'animatedImageView' && node.type === 'animatedimage') {
            // The AppKit host is always the animated view.
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'id' || name === 'alt') {
            continue
          } else if (name === 'accessibilityLabel') {
            node.view!.accessibilityLabel = String(value ?? '')
            node.view!.accessibilityElement = !!value
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored ' + node.type + ' prop ' + name)
          }

          break
        case 'placeholder':
          // creatingView fires once on attach (insert); the prop only
          // registers the handler — re-applying it never refires.
          if (name === 'onCreatingView' || name === 'id') {
            continue
          } else if (name === 'style') {
            deps.cssCascade.setNodeInlineStyle(node, value)
          } else if (name === 'className') {
            deps.cssCascade.applyClassName(node, value)
          } else if (name === 'accessible' || name.startsWith('accessibility')) {
            deps.accessibility.applyAccessibility(node, name, value)
          } else if (name.startsWith('on') && value == null) {
            continue
          } else if (value !== undefined) {
            console.warn('[macos-host] ignored placeholder prop ' + name)
          }

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
      deps.controls.syncSegmentedBar(node)
    }

    if (node.type === 'listpicker') {
      deps.controls.syncListPicker(node)
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
      deps.controls.syncDatePicker(node, props)
    }

    if (node.type === 'timepicker') {
      deps.controls.syncTimePicker(node, props)
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
      ['liquidglass', 'contentview', 'actionbar', 'rootlayout'].includes(node.type) ||
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
