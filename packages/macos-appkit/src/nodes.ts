import type { CssAnimations } from './css-animations'
import type { Registry } from './registry'
import type { Tree } from './tree'
import type { PickerElements } from './picker-elements'
import type { CssCascade } from './css-cascade'
import type { ContainerElements } from './container-elements'
import type { Roots } from './roots'
import type { Controls } from './controls'
import type { TextElements } from './text-elements'
import type { InputElements } from './input-elements'
import type { ImageElements } from './image-elements'
import type { Actions } from './actions'
import type { ElementProps } from './element-props'
import type { CssPseudoState } from './css-pseudo-state'
import type { Subscriptions } from './subscriptions'
import type { HostedElements } from './hosted-elements'
import type { Projection } from './projection'
import type { BackgroundPaint } from './background-paint'
import type { BorderPaint } from './border-paint'
import type { Layout } from './layout'
import type { AccessibleHost } from './accessible-host'
import type { PropBag, AppKitView, ElementNode, RootContainer } from './model'
import { normalizeHostStyleProps } from './inline-style.ts'
import { NSNotificationCenter, NSTextField, NSTextView, NSView } from '@octane-xplat/platform/macos'
import { validateListProps } from './list-template'
import { nativeColor } from './native-colors'
import { makeTabView, makeTabItem, validateTabProps } from './tab-view'
import { validateHtmlProps } from './html-text'
import { validateTextStyle } from './formatted-text'
import { makeListView } from './list-view'
import { makeWebView } from './webview'
import { makePagerView } from './pager'
import { makeVideoView } from './video'
import { resolveFont as fontForFamilyStyle } from './fonts'

import { disposePressGestures, setVisualStateTracking } from './gestures'

interface Dependencies {
  cssAnimations: Pick<CssAnimations, 'cancelKeyframeAnimations'>
  registry: Pick<
    Registry,
    | 'VIEW_PARENT_TYPES'
    | 'typeHasView'
    | 'assertSupportedType'
    | 'behaviorOf'
    | 'nodeContainersByView'
    | 'cssNodesByView'
  >
  tree: Pick<Tree, 'validateTextNesting' | 'detach'>
  pickerElements: Pick<
    PickerElements,
    | 'timeOfDay'
    | 'calendarDate'
    | 'makeSegmentedBar'
    | 'makeListPicker'
    | 'makeTimePicker'
    | 'makeDatePicker'
    | 'disposeBuiltinSegmentedItem'
    | 'disposeBuiltinSegmentedChildren'
    | 'disposeBuiltinSegmentedControl'
    | 'disposeBuiltinListPicker'
    | 'disposeBuiltinTimePicker'
    | 'disposeBuiltinDatePicker'
  >
  cssCascade: Pick<CssCascade, 'cssChildren'>
  containerElements: Pick<
    ContainerElements,
    | 'makeRootLayout'
    | 'makeActionBar'
    | 'makeContentView'
    | 'contentViewNodesByView'
    | 'observeContentGeometry'
    | 'makeLiquidGlass'
    | 'makePlaceholder'
    | 'gridLayoutNodesByView'
    | 'disposeBuiltinRootLayout'
    | 'disposeBuiltinLiquidGlass'
    | 'disposeBuiltinContentHost'
    | 'disposeBuiltinPlaceholder'
  >
  roots: Pick<Roots, 'createMacOSRoot' | 'ownedRoots'>
  controls: Pick<
    Controls,
    | 'makeProgress'
    | 'makeActivityIndicator'
    | 'makeButton'
    | 'makeScrollView'
    | 'makeSwitch'
    | 'makeSlider'
    | 'disposeBuiltinActivityIndicator'
    | 'disposeBuiltinScrollView'
  >
  textElements: Pick<TextElements, 'makeLabel' | 'disposeBuiltinFormattedText'>
  inputElements: Pick<
    InputElements,
    | 'makeSearchBar'
    | 'makeTextField'
    | 'textNodesByView'
    | 'initializeTextViewport'
    | 'disposeBuiltinTextViewLayout'
    | 'disposeBuiltinTextInput'
  >
  imageElements: Pick<ImageElements, 'makeImageView' | 'makeAnimatedImageView' | 'disposeBuiltinImage'>
  actions: Pick<
    Actions,
    | 'nextActionId'
    | 'actionIdsByView'
    | 'actionHandlers'
    | 'buttonActionTarget'
    | 'panHandlersByView'
  >
  elementProps: Pick<ElementProps, 'applyProps'>
  cssPseudoState: Pick<CssPseudoState, 'syncPseudoTracking'>
  subscriptions: Pick<Subscriptions, 'focusWithinDispatcher' | 'keyboardDispatcher'>
  hostedElements: Pick<
    HostedElements,
    | 'disposeBuiltinListView'
    | 'disposeBuiltinPager'
    | 'disposeBuiltinVideo'
    | 'disposeBuiltinTabView'
    | 'disposeBuiltinTabItem'
    | 'disposeBuiltinWebView'
  >
  projection: Pick<Projection, 'disposeBuiltinProxyChildren'>
  backgroundPaint: Pick<BackgroundPaint, 'clearBackgrounds'>
  borderPaint: Pick<BorderPaint, 'clearBoxFrameObserver'>
  layout: Pick<Layout, 'layoutHandlers'>
  accessibleHost: Pick<AccessibleHost, 'accessibilityLabels' | 'accessibilityRoles'>
}

export type Nodes = ReturnType<typeof createNodes>

export function createNodes(deps: Dependencies) {
  /** Deterministic prop failures that would otherwise throw after views and
   *  registrations exist. `baseProps` supplies already-applied props for
   *  update commands so merged-prop rules (e.g. placeholder color) stay exact. */
  function validateNodeProps(type: string, props: PropBag | undefined, baseProps?: PropBag) {
    props = normalizeHostStyleProps(props)
    if (type === 'actionbar' && props?.titleView != null && !(props.titleView instanceof NSView)) {
      throw new TypeError('AppKit actionbar titleView must be an AppKit NSView')
    }

    if (type === 'listview') {
      validateListProps(props ?? {}, (template) =>
        template.validate(
          (tag, values) => {
            try {
              deps.registry.assertSupportedType(tag)
              validateNodeProps(tag, values)
            } catch (error) {
              throw new TypeError('[macos-host] listview itemTemplate: ' + String(error))
            }
          },
          (parent, child) => {
            deps.tree.validateTextNesting(parent, child)
            if (
              parent &&
              (deps.registry.typeHasView(child) || child === 'proxyviewcontainer') &&
              !(
                deps.registry.VIEW_PARENT_TYPES.has(parent) ||
                deps.registry.behaviorOf(parent)?.container === true
              )
            ) {
              throw new TypeError(
                '[macos-host] listview itemTemplate: <' + parent + '> cannot contain child views',
              )
            }
          },
        ),
      )

      if (props?.separatorColor != null) {
        nativeColor(props.separatorColor)
      }
    }

    if (type === 'tabview' || type === 'tabviewitem') {
      validateTabProps(type, props ?? {})
    }

    if (type === 'segmentedbaritem' && props?.title != null && typeof props.title !== 'string') {
      throw new Error('AppKit segmentedbaritem title must be a string')
    }

    if (type === 'segmentedbar') {
      if (props?.items != null && !Array.isArray(props.items)) {
        throw new Error('AppKit segmentedbar items must be an array')
      }

      for (const item of props?.items ?? []) {
        if (!item || typeof item !== 'object') {
          throw new Error('AppKit segmentedbar items must be objects with optional titles')
        }

        if (item.title != null && typeof item.title !== 'string') {
          throw new Error('AppKit segmentedbar item title must be a string')
        }
      }

      if (props?.selectedIndex != null && !Number.isInteger(props.selectedIndex)) {
        throw new Error('AppKit segmentedbar selectedIndex must be an integer')
      }

      if (props?.style?.selectedBackgroundColor != null) {
        nativeColor(props.style.selectedBackgroundColor)
      }
    }

    if (type === 'listpicker') {
      if (props?.items != null && !Array.isArray(props.items)) {
        throw new Error('AppKit listpicker items must be an array')
      }

      if (props?.selectedIndex != null && !Number.isInteger(props.selectedIndex)) {
        throw new Error('AppKit listpicker selectedIndex must be an integer')
      }

      // Validate item conversion before allocating a view or registration.
      for (const item of props?.items ?? []) {
        if (item != null) {
          void (item + '')
        }
      }
    }

    if (type === 'timepicker') {
      if (props?.time != null) {
        deps.pickerElements.timeOfDay(props.time)
      }

      for (const name of ['hour', 'minute', 'minHour', 'minMinute', 'maxHour', 'maxMinute']) {
        const value = props?.[name]
        const maximum = name.toLowerCase().includes('hour') ? 23 : 59
        if (value != null && (!Number.isInteger(value) || value < 0 || value > maximum)) {
          throw new TypeError(
            'AppKit timepicker ' + name + ' must be an integer from 0 through ' + maximum,
          )
        }
      }
    }

    if (type === 'datepicker') {
      for (const name of ['date', 'minDate', 'maxDate']) {
        if (props?.[name] != null) {
          if (!(props[name] instanceof Date) && typeof props[name] !== 'string') {
            throw new Error('AppKit datepicker ' + name + ' must be Date or string')
          }

          deps.pickerElements.calendarDate(props[name])
        }
      }

      for (const name of ['year', 'month', 'day']) {
        if (props?.[name] != null && !Number.isInteger(props[name])) {
          throw new Error('AppKit datepicker ' + name + ' must be an integer')
        }
      }
    }

    if (type === 'progress') {
      for (const name of ['value', 'maxValue']) {
        if (
          props?.[name] != null &&
          (typeof props[name] !== 'number' || !Number.isFinite(props[name]))
        ) {
          throw new Error('AppKit progress ' + name + ' must be a finite number')
        }
      }
    }

    if (type === 'activityindicator' && props?.busy != null && typeof props.busy !== 'boolean') {
      throw new Error('AppKit activityindicator busy must be boolean')
    }

    if (
      type === 'placeholder' &&
      props?.onCreatingView != null &&
      typeof props.onCreatingView !== 'function'
    ) {
      throw new Error('AppKit placeholder onCreatingView must be a function')
    }

    if (type === 'htmlview') {
      validateHtmlProps(props ?? {})
    }

    if (type === 'span' || type === 'formattedstring') {
      validateTextStyle(props ?? {}, nativeColor)
      return
    }

    if (type === '#text') {
      return
    }

    const style = props?.style
    if (style != null) {
      if (typeof style !== 'object') {
        throw new Error('AppKit spike expects style to be an object')
      }

      // applyStyle feeds these straight into nativeColor.
      if (style.backgroundColor != null) {
        nativeColor(style.backgroundColor)
      }

      if (style.borderColor != null) {
        nativeColor(style.borderColor)
      }

      if (
        ['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(type) &&
        style.color != null
      ) {
        nativeColor(style.color)
      }
    }

    if (
      type === 'scrollview' &&
      props?.orientation != null &&
      !['horizontal', 'vertical', 'both'].includes(props.orientation)
    ) {
      throw new Error('[macos-host] ' + type + ' orientation must be horizontal, vertical or both')
    }

    if (props?.dock != null && !['left', 'top', 'right', 'bottom'].includes(props.dock)) {
      throw new Error('[macos-host] dock must be left, top, right or bottom')
    }

    if (type === 'textfield' && props?.placeholderTextColor != null) {
      // setTextFieldPlaceholder only reaches the color when text exists.
      const placeholder = props.placeholder ?? baseProps?.placeholder
      if (String(placeholder ?? '') !== '') {
        nativeColor(props.placeholderTextColor)
      }
    }

    if (type === 'label') {
      // syncLabelOverflow and syncNodeFont throw the same deterministic
      // errors inside applyProps — validate here so pre-flight honors its
      // contract and the batch aborts before earlier commands mutate state.
      const merged = { ...baseProps, ...props }
      if (merged.whiteSpace != null && !['normal', 'nowrap'].includes(merged.whiteSpace)) {
        throw new Error('[macos-host] label whiteSpace supports only normal and nowrap')
      }

      if (merged.textOverflow != null && !['clip', 'ellipsis'].includes(merged.textOverflow)) {
        throw new Error('[macos-host] label textOverflow supports only clip and ellipsis')
      }

      if (merged.maxLines != null && (!Number.isInteger(merged.maxLines) || merged.maxLines < 0)) {
        throw new Error('[macos-host] label maxLines must be a non-negative integer')
      }

      if (props?.fontSize !== undefined && !Number.isFinite(Number(props.fontSize))) {
        throw new Error('[macos-host] label fontSize must be a finite number')
      }
    }
  }

  function makeNode(container: RootContainer, id: number, type: string, props: PropBag) {
    props = normalizeHostStyleProps(props)
    // Reject malformed props before factories allocate views or register
    // actions — the node only reaches container.nodes after this returns, so
    // a throwing prop below must unwind whatever was already acquired.
    deps.registry.assertSupportedType(type)
    validateNodeProps(type, props)

    const node: ElementNode = {
      id,
      type,
      view: null,
      props: {},
      parent: null,
      children: [],
      container,
      appliedFontFamily: container.fontFamily,
      scrollObserverInstalled: false,
      text: '',
      cssType: type,
      cssClasses: new Set(),
      cssPseudoClasses: new Set(),
      computedStyle: undefined,
      computedCustomProps: new Map(),
    }
    node.getChildIndex = (child: ElementNode) => deps.cssCascade.cssChildren(node).indexOf(child)
    node.getChildAt = (i: number) => deps.cssCascade.cssChildren(node)[i]
    node.getChildrenCount = () => deps.cssCascade.cssChildren(node).length

    try {
      const makeBehavior = deps.registry.behaviorOf(type)?.make
      if (makeBehavior) {
        // Registered element behaviors own their factory (mason-backed
        // containers, plugin elements).
        makeBehavior(node, props)
      } else {
        switch (type) {
          case 'rootlayout':
            node.view = deps.containerElements.makeRootLayout(node)
            break
          case 'actionbar':
          case 'contentview':
            node.view =
              type === 'actionbar'
                ? deps.containerElements.makeActionBar(node)
                : deps.containerElements.makeContentView()
            deps.containerElements.contentViewNodesByView.set(node.view!, node)
            deps.containerElements.observeContentGeometry(node)
            break
          case 'liquidglass':
            node.view = deps.containerElements.makeLiquidGlass(node)
            break
          case 'tabview':
            node.view = makeTabView(node)
            break
          case 'tabviewitem':
            makeTabItem(node)
            break
          case 'segmentedbar': {
            const control = deps.pickerElements.makeSegmentedBar(node)
            node.view = control.view
            node.actionId = control.actionId
            break
          }
          case 'listview':
            node.view = makeListView({
              createRoot: (host) =>
                deps.roots.createMacOSRoot(host, { fontFamily: container.fontFamily }),
              releaseOwnedRoot: (host) => deps.roots.ownedRoots.get(host)?.unmount(),
              color: nativeColor,
            }) as AppKitView

            break
          case 'listpicker': {
            const control = deps.pickerElements.makeListPicker(node)
            node.view = control.view
            node.actionId = control.actionId
            break
          }
          case 'timepicker': {
            const control = deps.pickerElements.makeTimePicker(node)
            node.view = control.view
            node.actionId = control.actionId
            break
          }
          case 'datepicker': {
            const control = deps.pickerElements.makeDatePicker(node)
            node.view = control.view
            node.actionId = control.actionId
            break
          }
          case 'progress':
            node.view = deps.controls.makeProgress()
            break
          case 'activityindicator':
            node.view = deps.controls.makeActivityIndicator()
            break
          case 'htmlview':
            node.view = deps.textElements.makeLabel()
            // @ts-ignore selectable is writable on NSTextView; generated decl marks it readonly.
            node.view.selectable = true
            break
          case 'label':
            node.view = deps.textElements.makeLabel()
            break
          case '#text':
            break
          case 'button': {
            const button = deps.controls.makeButton(props)
            node.view = button.view
            node.actionId = button.actionId
            break
          }
          case 'scrollview': {
            const scroll = deps.controls.makeScrollView(node)
            node.view = scroll.view
            node.childHost = scroll.childHost
            break
          }
          case 'searchbar':
            node.view = deps.inputElements.makeSearchBar()
            break
          case 'textfield':
            node.view = deps.inputElements.makeTextField(props) as unknown as NSView
            break
          case 'textview':
            node.view = deps.inputElements.makeTextField(props, true) as unknown as NSView
            break
          case 'switch': {
            const control = deps.controls.makeSwitch(props)
            node.view = control.view
            node.actionId = control.actionId
            break
          }
          case 'slider': {
            const control = deps.controls.makeSlider(props)
            node.view = control.view
            node.actionId = control.actionId
            break
          }
          case 'webview':
            node.view = makeWebView()
            break
          case 'image':
            node.view = deps.imageElements.makeImageView(props)
            break
          case 'animatedimage':
            node.view = deps.imageElements.makeAnimatedImageView(props)
            break
          case 'pager':
            node.view = makePagerView()
            break
          case 'xplatvideo':
            node.view = makeVideoView()
            break
          case 'placeholder':
            node.view = deps.containerElements.makePlaceholder(node)
            break
          case 'proxyviewcontainer':
          case 'formattedstring':
          case 'segmentedbaritem':
          case 'span':
            break
          default: {
            const behavior = deps.registry.behaviorOf(type)
            if (!behavior?.make) {
              throw new Error('AppKit spike does not support <' + type + '>')
            }

            behavior.make(node, props)
            break
          }
        }
      }

      if (type === 'textfield' || type === 'textview' || type === 'searchbar') {
        node.actionId = deps.actions.nextActionId++
        deps.actions.actionIdsByView.set(node.view!, node.actionId)
        deps.actions.actionHandlers.set(node.actionId, null)
        if (type !== 'textview') {
          // Per-edit events arrive through controlTextDidChange (delegate);
          // the target/action is reserved for submission on Return.
          const textField = node.view! as NSTextField
          textField.delegate = deps.actions.buttonActionTarget
          textField.target = deps.actions.buttonActionTarget
          if (type === 'searchbar') {
            // @ts-ignore clearing the action needs null; generated decl types it non-null.
            textField.action = null
          } else {
            textField.action = 'textFieldSubmitted:'
          }
        } else {
          ;(node.view! as NSTextView).delegate = deps.actions.buttonActionTarget
        }
      }

      if (['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(type)) {
        const textControl = node.view! as NSTextField | NSTextView
        if (textControl.font) {
          textControl.font = fontForFamilyStyle(
            textControl.font.pointSize,
            400,
            container.fontFamily,
          )
        }
      }

      if (type === 'liquidglass') {
        deps.containerElements.gridLayoutNodesByView.set(node.view!, node)
      }

      if (type === 'textfield' || type === 'searchbar') {
        deps.inputElements.textNodesByView.set(node.view!, node)
      }

      if (type === 'textview') {
        deps.inputElements.initializeTextViewport(node, props)
      }

      deps.elementProps.applyProps(node, props)
      if (node.view) {
        const owner = deps.registry.nodeContainersByView.get(node.view)
        if (owner && owner !== container) {
          throw new Error('AppKit node view is already owned by another Octane root.')
        }

        deps.registry.nodeContainersByView.set(node.view, container)
        deps.registry.cssNodesByView.set(node.view, node)
        deps.cssPseudoState.syncPseudoTracking(node)
      }

      return node
    } catch (error) {
      // Release whatever the failed creation registered — action slots,
      // observers, WebView delegates — since no caller can destroy it.
      destroy(node)
      throw error
    }
  }

  function destroy(node: ElementNode) {
    deps.inputElements.disposeBuiltinTextViewLayout(node)

    if (
      node.view &&
      (typeof node.props.onFocus === 'function' || typeof node.props.onBlur === 'function')
    ) {
      deps.subscriptions.focusWithinDispatcher.set(node.view)
    }
    if (
      node.view &&
      (typeof node.props.onKeyDown === 'function' || typeof node.props.onKeyUp === 'function')
    ) {
      deps.subscriptions.keyboardDispatcher.set(node.view)
    }
    node.container?.cssDirty?.delete(node)
    deps.cssAnimations.cancelKeyframeAnimations(node)
    for (const hook of node.destroyHooks ?? []) {
      hook()
    }
    deps.registry.behaviorOf(node.type)?.destroy?.(node)
    deps.hostedElements.disposeBuiltinListView(node)

    deps.hostedElements.disposeBuiltinPager(node)

    deps.hostedElements.disposeBuiltinVideo(node)

    deps.hostedElements.disposeBuiltinTabView(node)

    deps.hostedElements.disposeBuiltinTabItem(node)

    deps.pickerElements.disposeBuiltinSegmentedItem(node)

    deps.pickerElements.disposeBuiltinSegmentedChildren(node)

    deps.textElements.disposeBuiltinFormattedText(node)

    deps.projection.disposeBuiltinProxyChildren(node)

    deps.containerElements.disposeBuiltinRootLayout(node)

    deps.containerElements.disposeBuiltinLiquidGlass(node)

    deps.containerElements.disposeBuiltinContentHost(node)

    deps.containerElements.disposeBuiltinPlaceholder(node)

    if (node.view) {
      deps.tree.detach(node.container, node)
    }

    disposePressGestures(node)
    if (node.clickGestureRecognizer) {
      node.clickGestureRecognizer.enabled = false
      node.view?.removeGestureRecognizer(node.clickGestureRecognizer)
      node.clickGestureRecognizer = undefined
    }
    if (node.linkClickRecognizer) {
      node.linkClickRecognizer.enabled = false
      node.view?.removeGestureRecognizer(node.linkClickRecognizer)
      node.linkClickRecognizer = undefined
    }
    node.textLinks = undefined
    node.cssHoverDispose?.()
    node.cssHoverDispose = undefined
    setVisualStateTracking(node, null)
    if (node.view) {
      deps.actions.panHandlersByView.delete(node.view)
    }

    if (node.panGestureRecognizer) {
      node.panGestureRecognizer.enabled = false
    }
    deps.inputElements.disposeBuiltinTextInput(node)

    deps.hostedElements.disposeBuiltinWebView(node)

    deps.pickerElements.disposeBuiltinSegmentedControl(node)

    deps.pickerElements.disposeBuiltinListPicker(node)

    deps.pickerElements.disposeBuiltinTimePicker(node)

    deps.pickerElements.disposeBuiltinDatePicker(node)

    deps.controls.disposeBuiltinActivityIndicator(node)

    deps.imageElements.disposeBuiltinImage(node)

    deps.controls.disposeBuiltinScrollView(node)

    const detachScrollGeometry = node.scrollGeometryDetach
    node.scrollGeometryDetach = null
    detachScrollGeometry?.()
    for (const constraint of node.scrollAxisConstraints ?? []) {
      constraint.active = false
    }

    if (node.layoutObserver) {
      NSNotificationCenter.defaultCenter.removeObserver(node.layoutObserver)
      node.layoutObserver = null
    }

    deps.backgroundPaint.clearBackgrounds(node)
    if (node.outlineObserver) {
      NSNotificationCenter.defaultCenter.removeObserver(node.outlineObserver)
      node.outlineObserver = null
    }
    if (node.boxFrameOwner) {
      deps.borderPaint.clearBoxFrameObserver(node)
    }
    node.borderLayer = null
    node.borderSides = undefined
    node.borderOutline = undefined
    node.borderStroke = undefined
    node.borderSideMasks = undefined
    node.borderBandShapes = undefined
    node.cornerMask = undefined
    for (const host of node.outsetShadowHosts ?? []) {
      host.removeFromSuperlayer()
    }
    node.outsetShadowHosts = undefined
    node.insetShadowHost?.removeFromSuperlayer()
    node.insetShadowHost = null
    node.insetShadowShapes = undefined
    node.insetShadowLayer = null

    deps.layout.layoutHandlers.delete(node.layoutObservedView)
    node.layoutObservedView = null

    if (node.actionId !== undefined) {
      deps.actions.actionHandlers.delete(node.actionId)
      deps.accessibleHost.accessibilityLabels.delete(node.actionId)
      deps.accessibleHost.accessibilityRoles.delete(node.actionId)
    }

    if (
      node.view &&
      typeof deps.registry.nodeContainersByView !== 'undefined' &&
      deps.registry.nodeContainersByView.get(node.view) === node.container
    ) {
      deps.registry.nodeContainersByView.delete(node.view)
    }

    if (node.view) {
      deps.registry.cssNodesByView.delete(node.view)
    }
  }
  return {
    validateNodeProps,
    makeNode,
    destroy,
  }
}
