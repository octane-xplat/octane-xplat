import type { PropBag, AppKitView, ElementNode, RootContainer } from './model'
import { normalizeHostStyleProps } from './inline-style.ts'
import {
  NSAutoresizingMaskOptions,
  NSBorderType,
  NSColor,
  NSImageView,
  NSNotificationCenter,
  NSScrollView,
  NSTextField,
  NSTextView,
  NSView,
  WKWebView,
  AVPlayerView,
} from '@octane-xplat/platform/macos'
import { validateListProps } from './list-template'
import { nativeColor } from './native-colors'
import {
  makeTabView,
  makeTabItem,
  validateTabProps,
  releaseTabView,
  releaseTabItem,
} from './tab-view'
import { validateHtmlProps } from './html-text'
import { validateTextStyle } from './formatted-text'
import { makeListView, disposeListView } from './list-view'
import { makeWebView, disposeWebView } from './webview'
import { makePagerView, disposePagerView } from './pager'
import { makeVideoView, disposeVideoView } from './video'
import { resolveFont as fontForFamilyStyle } from './fonts'
import { observeTextViewLayout, retireTextViewLayout } from './text-view-layout.ts'
import { disposePressGestures, setVisualStateTracking } from './gestures'
import { disposeTextValue } from './text-value.ts'
import { setImageGeometryHandler } from './image-geometry.ts'
import { disposeImage } from './image'

import type { createRegistry } from './registry'
import type { createTree } from './tree'
import type { createControls } from './controls'
import type { createCssCascade } from './css-cascade'
import type { createContainerElements } from './container-elements'
import type { createRoots } from './roots'
import type { createInputElements } from './input-elements'
import type { createImageElements } from './image-elements'
import type { createActions } from './actions'
import type { createElementProps } from './element-props'
import type { createCssPseudoState } from './css-pseudo-state'
import type { createSubscriptions } from './subscriptions'
import type { createLayout } from './layout'
import type { createBackgroundPaint } from './background-paint'
import type { createBorderPaint } from './border-paint'
import type { createAccessibleHost } from './accessible-host'

interface Dependencies {
  registry: Pick<
    ReturnType<typeof createRegistry>,
    'elementBehaviors' | 'behaviorOf' | 'nodeContainersByView' | 'cssNodesByView'
  >
  tree: Pick<ReturnType<typeof createTree>, 'validateTextNesting' | 'detach'>
  controls: Pick<
    ReturnType<typeof createControls>,
    | 'timeOfDay'
    | 'calendarDate'
    | 'makeSegmentedBar'
    | 'makeListPicker'
    | 'makeTimePicker'
    | 'makeDatePicker'
    | 'makeProgress'
    | 'makeActivityIndicator'
    | 'makeLabel'
    | 'makeButton'
    | 'makeScrollView'
    | 'makeSwitch'
    | 'makeSlider'
    | 'scrollHandlers'
  >
  cssCascade: Pick<ReturnType<typeof createCssCascade>, 'cssChildren' | 'cancelKeyframeAnimations'>
  containerElements: Pick<
    ReturnType<typeof createContainerElements>,
    | 'makeRootLayout'
    | 'makeActionBar'
    | 'makeContentView'
    | 'contentViewNodesByView'
    | 'observeContentGeometry'
    | 'makeLiquidGlass'
    | 'makePlaceholder'
    | 'gridLayoutNodesByView'
    | 'rootLayoutNodesByView'
    | 'placeholderContentOwners'
    | 'placeholderNodesByView'
  >
  roots: Pick<ReturnType<typeof createRoots>, 'createMacOSRoot' | 'ownedRoots'>
  inputElements: Pick<
    ReturnType<typeof createInputElements>,
    | 'makeSearchBar'
    | 'makeTextField'
    | 'textNodesByView'
    | 'fitTextView'
    | 'DEFAULT_TEXT_LINE_HEIGHT_RATIO'
  >
  imageElements: Pick<
    ReturnType<typeof createImageElements>,
    'makeImageView' | 'makeAnimatedImageView'
  >
  actions: Pick<
    ReturnType<typeof createActions>,
    | 'nextActionId'
    | 'actionIdsByView'
    | 'actionHandlers'
    | 'buttonActionTarget'
    | 'panHandlersByView'
  >
  elementProps: Pick<ReturnType<typeof createElementProps>, 'applyProps'>
  cssPseudoState: Pick<ReturnType<typeof createCssPseudoState>, 'syncPseudoTracking'>
  subscriptions: Pick<
    ReturnType<typeof createSubscriptions>,
    'focusWithinDispatcher' | 'keyboardDispatcher'
  >
  layout: Pick<ReturnType<typeof createLayout>, 'releasePlacementPins' | 'layoutHandlers'>
  backgroundPaint: Pick<ReturnType<typeof createBackgroundPaint>, 'clearBackgrounds'>
  borderPaint: Pick<ReturnType<typeof createBorderPaint>, 'clearBoxFrameObserver'>
  accessibleHost: Pick<
    ReturnType<typeof createAccessibleHost>,
    'accessibilityLabels' | 'accessibilityRoles'
  >
}

export function createNodes(deps: Dependencies) {
  /** Types whose views arrange child views; mirrors the check in insert(). */
  const VIEW_PARENT_TYPES = new Set([
    'rootlayout',
    'contentview',
    'actionbar',
    'proxyviewcontainer',
    'masonview',
    'scrollview',
    'liquidglass',
  ])

  /** Every type the factory switch below can build. */
  const SUPPORTED_TYPES = new Set([
    ...VIEW_PARENT_TYPES,
    'label',
    'htmlview',
    '#text',
    'button',
    'textfield',
    'textview',
    'searchbar',
    'switch',
    'slider',
    'activityindicator',
    'progress',
    'datepicker',
    'timepicker',
    'listpicker',
    'listview',
    'segmentedbar',
    'tabview',
    'tabviewitem',
    'segmentedbaritem',
    'webview',
    'image',
    'animatedimage',
    'pager',
    'xplatvideo',
    'placeholder',
    'span',
    'formattedstring',
  ])

  function typeHasView(type: string) {
    return (
      type !== 'tabviewitem' &&
      type !== 'segmentedbaritem' &&
      type !== '#text' &&
      type !== 'span' &&
      type !== 'formattedstring' &&
      type !== 'proxyviewcontainer'
    )
  }

  function assertSupportedType(type: string) {
    if (!SUPPORTED_TYPES.has(type) && !deps.registry.elementBehaviors.has(type)) {
      throw new Error('AppKit spike does not support <' + type + '>')
    }
  }

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
              assertSupportedType(tag)
              validateNodeProps(tag, values)
            } catch (error) {
              throw new TypeError('[macos-host] listview itemTemplate: ' + String(error))
            }
          },
          (parent, child) => {
            deps.tree.validateTextNesting(parent, child)
            if (
              parent &&
              (typeHasView(child) || child === 'proxyviewcontainer') &&
              !(
                VIEW_PARENT_TYPES.has(parent) ||
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
        deps.controls.timeOfDay(props.time)
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

          deps.controls.calendarDate(props[name])
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
    assertSupportedType(type)
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
            const control = deps.controls.makeSegmentedBar(node)
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
            const control = deps.controls.makeListPicker(node)
            node.view = control.view
            node.actionId = control.actionId
            break
          }
          case 'timepicker': {
            const control = deps.controls.makeTimePicker(node)
            node.view = control.view
            node.actionId = control.actionId
            break
          }
          case 'datepicker': {
            const control = deps.controls.makeDatePicker(node)
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
            node.view = deps.controls.makeLabel()
            // @ts-ignore selectable is writable on NSTextView; generated decl marks it readonly.
            node.view.selectable = true
            break
          case 'label':
            node.view = deps.controls.makeLabel()
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
        const textView = node.view! as NSTextView
        const viewport = NSScrollView.alloc().initWithFrame(textView.frame)
        viewport.translatesAutoresizingMaskIntoConstraints = false
        viewport.drawsBackground = false
        viewport.borderType = NSBorderType.No
        viewport.hasVerticalScroller = true
        viewport.autohidesScrollers = true
        textView.translatesAutoresizingMaskIntoConstraints = true
        textView.autoresizingMask = NSAutoresizingMaskOptions.WidthSizable
        textView.verticallyResizable = true
        textView.horizontallyResizable = false
        textView.maxSize = { width: Number.MAX_SAFE_INTEGER, height: Number.MAX_SAFE_INTEGER }
        textView.textContainer.widthTracksTextView = true
        viewport.documentView = textView
        node.textViewport = viewport
        observeTextViewLayout(node, () => deps.inputElements.fitTextView(node))

        const placeholder = deps.controls.makeLabel()
        placeholder.font = fontForFamilyStyle(14, 400, node.appliedFontFamily)
        placeholder.textColor = NSColor.placeholderTextColor
        placeholder.stringValue = String(props.placeholder ?? '')
        placeholder.translatesAutoresizingMaskIntoConstraints = false
        node.placeholderHeight = placeholder.heightAnchor.constraintEqualToConstant(
          Math.ceil(14 * deps.inputElements.DEFAULT_TEXT_LINE_HEIGHT_RATIO),
        )

        node.placeholderHeight.active = true

        placeholder.hidden = String(props.value ?? '').length > 0
        node.view!.addSubview(placeholder)
        node.placeholderLeading = placeholder.leadingAnchor.constraintEqualToAnchorConstant(
          node.view!.leadingAnchor,
          0,
        )

        node.placeholderLeading.active = true

        node.placeholderTop = placeholder.topAnchor.constraintEqualToAnchor(node.view!.topAnchor)
        node.placeholderTop.active = true
        node.placeholderView = placeholder
        deps.inputElements.textNodesByView.set(node.view!, node)
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
    if (node.type === 'textview') {
      retireTextViewLayout(node)
    }
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
    deps.cssCascade.cancelKeyframeAnimations(node)
    for (const hook of node.destroyHooks ?? []) {
      hook()
    }
    deps.registry.behaviorOf(node.type)?.destroy?.(node)

    if (node.type === 'listview' && node.view) {
      disposeListView(node.view)
    }

    if (node.type === 'pager' && node.view) {
      disposePagerView(node.view)
    }

    if (node.type === 'xplatvideo' && node.view) {
      disposeVideoView(node.view as AVPlayerView)
    }

    if (node.type === 'tabview') {
      releaseTabView(node)
    }

    if (node.type === 'tabviewitem') {
      deps.tree.detach(node.container, node)
      releaseTabItem(node)
    }

    if (node.type === 'segmentedbaritem') {
      deps.tree.detach(node.container, node)
      node.props.title = undefined
    }

    if (node.type === 'segmentedbar') {
      for (const child of node.children.slice()) {
        deps.tree.detach(node.container, child)
      }
    }

    if (node.type === 'formattedstring' || node.type === 'span') {
      deps.tree.detach(node.container, node)
      for (const child of node.children.slice()) {
        deps.tree.detach(node.container, child)
      }
    }

    if (node.type === 'proxyviewcontainer') {
      deps.tree.detach(node.container, node)
      for (const child of node.children.slice()) {
        deps.tree.detach(node.container, child)
      }
    }

    if (node.type === 'rootlayout') {
      if (node.rootGeometryObserver) {
        NSNotificationCenter.defaultCenter.removeObserver(node.rootGeometryObserver)
        node.rootGeometryObserver = null
      }

      if (node.view) {
        deps.containerElements.rootLayoutNodesByView.delete(node.view)
      }

      for (const child of node.children.slice()) {
        deps.tree.detach(node.container, child)
      }
    }

    if (node.type === 'liquidglass') {
      if (node.glassGeometryObserver) {
        NSNotificationCenter.defaultCenter.removeObserver(node.glassGeometryObserver)
        node.glassGeometryObserver = null
      }

      // The material backdrop is not a node view, so nothing else detaches it.
      node.glassBackdrop?.removeFromSuperview()
      node.glassBackdrop = null
    }

    // Removing an ancestor does not detach its native descendants. Every
    // destroyed view releases its own edge, including retained ContentView refs.
    if (['contentview', 'actionbar'].includes(node.type ?? '')) {
      if (node.contentGeometryObserver) {
        NSNotificationCenter.defaultCenter.removeObserver(node.contentGeometryObserver)
        node.contentGeometryObserver = null
      }

      if (node.type === 'actionbar') {
        if (node.actionBarDisplay) {
          deps.layout.releasePlacementPins(node.actionBarDisplay)
          node.actionBarDisplay.view.removeFromSuperview()
        }

        node.actionBarExternal = null
        node.actionBarDisplay = null
        node.actionBarTitle = null
      }

      // Detaching mutates children; iterate a snapshot.
      for (const child of node.children.slice()) {
        deps.tree.detach(node.container, child)
      }

      if (node.view) {
        deps.containerElements.contentViewNodesByView.delete(node.view)
      }
    }

    if (node.type === 'placeholder') {
      if (node.placeholderContent) {
        deps.containerElements.placeholderContentOwners.delete(node.placeholderContent)
        if (deps.registry.nodeContainersByView.get(node.placeholderContent) === node.container) {
          deps.registry.nodeContainersByView.delete(node.placeholderContent)
        }

        node.placeholderContent.removeFromSuperview()
        node.placeholderContent = null
      }

      if (node.view) {
        deps.containerElements.placeholderNodesByView.delete(node.view)
      }
    }

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

    if (['textfield', 'textview', 'searchbar'].includes(node.type) && node.view) {
      disposeTextValue(node.view)
      deps.inputElements.textNodesByView.delete(node.view)
      deps.actions.actionIdsByView.delete(node.view)
      node.view.delegate = null
      if (node.type === 'searchbar') {
        node.view.target = null
        node.view.action = null
        node.submitHandler = null
      }
    }

    // Nodes destroyed by a failed makeNode may have a null view — every
    // branch below must tolerate partial construction.
    if (node.type === 'webview' && node.view) {
      disposeWebView(node.view as WKWebView)
    }

    if (node.type === 'segmentedbar' && node.view) {
      node.view.target = null
      node.view.action = null
      node.view.segmentCount = 0
      node.segmentedBarTitles = null
      node.props.items = undefined
      node.props.onSelectedIndexChange = undefined
    }

    if (node.type === 'listpicker' && node.view) {
      node.view.target = null
      node.view.action = null
      node.view.removeAllItems()
      node.listPickerTitles = null
      node.props.onSelectedIndexChange = undefined
    }

    if (node.type === 'timepicker' && node.view) {
      node.view.target = null
      node.view.action = null
      node.props.onTimeChange = undefined
      node.timePickerInputs = undefined
    }

    if (node.type === 'datepicker' && node.view) {
      node.view.target = null
      node.view.action = null
      node.props.onDateChange = undefined
    }

    if (node.type === 'activityindicator' && node.view) {
      node.view.stopAnimation(null)
      node.view.alphaValue = 0
      node.view.hidden = true
    }

    if ((node.type === 'image' || node.type === 'animatedimage') && node.view) {
      if (node.type === 'image') {
        setImageGeometryHandler(node.view as NSImageView, undefined)
      }

      disposeImage(node.view as NSImageView)
    }

    if (node.type === 'scrollview' && node.scrollObserverInstalled && node.view) {
      const clipView = node.view.contentView
      deps.controls.scrollHandlers.delete(clipView)
      NSNotificationCenter.defaultCenter.removeObserver(node.scrollObserver)
      node.scrollObserver = null
      node.scrollObserverInstalled = false
    }

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
    VIEW_PARENT_TYPES,
    typeHasView,
    assertSupportedType,
    validateNodeProps,
    makeNode,
    destroy,
  }
}
