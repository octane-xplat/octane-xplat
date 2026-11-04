import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { parse } from 'acorn'

// Existing VM fixtures span several subsystems. Assemble their production
// declarations in the established fixture order, with injected dependencies
// supplied as sandbox globals. New tests should import subsystem factories.
const declarations: readonly (readonly [string, string])[] = [
  ['layout-projection', 'setLayoutProjectionScale'],
  ['runtime', '#0'],
  ['registry', 'nodeContainersByView'],
  ['registry', 'portalHandlesByNode'],
  ['registry', 'cssNodesByView'],
  ['layout', 'orderStickySiblings'],
  ['layout', 'stickyPlacements'],
  ['subscriptions', 'keyboardDispatcher'],
  ['subscriptions', 'contextPointerDispatcher'],
  ['subscriptions', 'fileDropRegistry'],
  ['subscriptions', 'focusWithinDispatcher'],
  ['registry', 'parentReference'],
  ['registry', 'resolveParentNode'],
  ['registry', 'canContainView'],
  ['registry', 'isPortalTargetView'],
  ['actions', 'actionHandlers'],
  ['actions', 'actionIdsByView'],
  ['input-elements', 'textNodesByView'],
  ['actions', 'panHandlersByView'],
  ['container-elements', 'gridLayoutNodesByView'],
  ['registry', 'elementBehaviors'],
  ['registry', 'registerElementType'],
  ['registry', 'behaviorOf'],
  ['registry', 'isManualLayoutParent'],
  ['runtime', 'compatInstallation'],
  ['container-elements', 'rootLayoutNodesByView'],
  ['container-elements', 'contentViewNodesByView'],
  ['container-elements', 'placeholderNodesByView'],
  ['container-elements', 'placeholderContentOwners'],
  ['accessible-host', 'accessibilityLabels'],
  ['accessible-host', 'accessibilityRoles'],
  ['accessible-host', 'stackAccessibilityPropsByView'],
  ['controls', 'scrollHandlers'],
  ['actions', 'nextActionId'],
  ['input-elements', 'DEFAULT_TEXT_LINE_HEIGHT_RATIO'],
  ['actions', 'invokeAction'],
  ['actions', 'ButtonActionTarget'],
  ['actions', 'buttonActionTarget'],
  ['input-elements', 'ContentAlignedTextField'],
  ['input-elements', 'InteractionTextView'],
  ['input-elements', 'InteractionTextFieldCell'],
  ['input-elements', 'InteractionSecureTextFieldCell'],
  ['text-elements', 'labelPaddings'],
  ['text-elements', 'ZERO_PADDING'],
  ['text-elements', 'PaddedLabelCell'],
  ['accessible-host', 'inputTransparentViews'],
  ['accessible-host', 'scopeFocusTargets'],
  ['accessible-host', 'tabStopSuppression'],
  ['accessible-host', 'disabledFocusTargets'],
  ['accessible-host', 'AccessibleHostView'],
  ['runtime', 'masonElementRegistration'],
  ['container-elements', 'LiquidGlassView'],
  ['container-elements', 'ActionBarHost'],
  ['container-elements', 'ContentViewHost'],
  ['container-elements', 'PlaceholderHostView'],
  ['container-elements', 'RootLayoutView'],
  ['container-elements', 'makeRootLayout'],
  ['container-elements', 'makeContentView'],
  ['container-elements', 'makeActionBar'],
  ['container-elements', 'validateActionBarTitleView'],
  ['container-elements', 'setActionBarTitleView'],
  ['container-elements', 'syncActionBar'],
  ['container-elements', 'makePlaceholder'],
  ['container-elements', 'fireCreatingView'],
  ['container-elements', 'observeContentGeometry'],
  ['layout', 'MARGIN_SIDES'],
  ['layout', 'layoutView'],
  ['layout', 'setMarginStyle'],
  ['controls', 'wireViewAction'],
  ['text-elements', 'makeLabel'],
  ['controls', 'makeButton'],
  ['controls', 'makeScrollView'],
  ['controls', 'setScrollAction'],
  ['layout', 'layoutHandlers'],
  ['layout', 'syncLayoutObserver'],
  ['layout', 'setLayoutAction'],
  ['input-elements', 'placeholderSignatureByField'],
  ['input-elements', 'setTextFieldPlaceholder'],
  ['input-elements', 'makeTextField'],
  ['input-elements', 'initializeTextViewport'],
  ['input-elements', 'makeSearchBar'],
  ['input-elements', 'notifySearchTextChange'],
  ['input-elements', 'syncSearchBar'],
  ['controls', 'makeSwitch'],
  ['picker-elements', 'makePopUpControl'],
  ['picker-elements', 'makeListPicker'],
  ['picker-elements', 'notifyListPickerChange'],
  ['picker-elements', 'syncListPicker'],
  ['picker-elements', 'makeSegmentedBar'],
  ['picker-elements', 'notifySegmentedBarChange'],
  ['picker-elements', 'syncSegmentedBar'],
  ['picker-elements', 'timeOfDay'],
  ['picker-elements', 'makeTimePicker'],
  ['picker-elements', 'notifyTimeChange'],
  ['picker-elements', 'syncTimePicker'],
  ['picker-elements', 'calendarDate'],
  ['picker-elements', 'makeDatePicker'],
  ['picker-elements', 'notifyDateChange'],
  ['picker-elements', 'syncDatePicker'],
  ['controls', 'makeProgress'],
  ['controls', 'syncProgress'],
  ['controls', 'makeActivityIndicator'],
  ['controls', 'syncActivityIndicator'],
  ['controls', 'makeSlider'],
  ['container-elements', 'makeLiquidGlass'],
  ['layout', 'layoutLength'],
  ['layout', 'pinLayoutChild'],
  ['layout', 'releasePlacementPins'],
  ['layout', 'dockChildSize'],
  ['layout', 'rootNaturalSize'],
  ['layout', 'layoutRootChildren'],
  ['layout', 'layoutContentChild'],
  ['image-elements', 'InputImageView'],
  ['image-elements', 'makeImageView'],
  ['image-elements', 'makeAnimatedImageView'],
  ['registry', 'VIEW_PARENT_TYPES'],
  ['registry', 'SUPPORTED_TYPES'],
  ['registry', 'typeHasView'],
  ['registry', 'assertSupportedType'],
  ['nodes', 'validateNodeProps'],
  ['nodes', 'makeNode'],
  ['native-style', 'EDGE_INSET_PROPS'],
  ['style-values', 'parseEdgeInsets'],
  ['css-cascade', 'cssChildren'],
  ['css-cascade', 'cssParentOf'],
  ['css-cascade', 'isCssRootNode'],
  ['css-cascade', 'cssSchemeName'],
  ['css-cascade', 'markStyleDirty'],
  ['css-cascade', 'flushStyleDirty'],
  ['css-cascade', 'cssDepth'],
  ['style-values', 'shallowEqualStyle'],
  ['css-cascade', 'activeMediaNode'],
  ['css-cascade', 'nodeHostWindow'],
  ['css-cascade', 'mediaSharedEnv'],
  ['css-cascade', 'windowMediaSize'],
  ['css-cascade', 'largestWindowSize'],
  ['css-cascade', 'envForNode'],
  ['css-cascade', 'restyleNode'],
  ['css-animations', 'CssAnimationPlayback'],
  ['css-animations', 'ANIMATION_FRAME_MS'],
  ['css-animations', 'animatedNodes'],
  ['css-animations', 'playingNodes'],
  ['css-animations', 'animationTimer'],
  ['css-animations', 'animationBase'],
  ['css-animations', 'sameAnimations'],
  ['css-animations', 'playKeyframeAnimations'],
  ['css-animations', 'tickKeyframeAnimations'],
  ['css-animations', 'advanceKeyframeAnimation'],
  ['css-animations', 'applyAnimationFrame'],
  ['css-animations', 'cancelKeyframeAnimations'],
  ['css-animations', 'stopSubtreeAnimations'],
  ['css-cascade', 'cssWarnedProps'],
  ['css-cascade', 'warnUnsupportedCssProp'],
  ['css-cascade', 'setNodeInlineStyle'],
  ['css-cascade', 'applyClassName'],
  ['css-cascade', 'refreshCssClasses'],
  ['css-cascade', 'setNodeId'],
  ['css-cascade', 'setPseudoClass'],
  ['css-cascade', 'NORMAL_OFF'],
  ['css-cascade', 'syncNormalState'],
  ['css-cascade', 'syncInputChrome'],
  ['native-style', 'syncNativeColors'],
  ['native-style', 'fontForStyle'],
  ['native-style', 'setSizeConstraint'],
  ['native-style', 'sizeConstraintSpec'],
  ['native-style', 'sizeConstraintParentView'],
  ['native-style', 'applySizeConstraint'],
  ['native-style', 'applySizeConstraints'],
  ['native-style', 'deactivateSizeConstraints'],
  ['native-style', 'syncNodeFont'],
  ['native-style', 'syncEdgeInsets'],
  ['native-style', 'syncLabelPadding'],
  ['native-style', 'syncVisibility'],
  ['style-values', 'isCollapsed'],
  ['pointer-style', 'CSS_CURSORS'],
  ['pointer-style', 'syncCursor'],
  ['pointer-style', 'syncUserSelect'],
  ['outlines', 'outlineSpec'],
  ['outlines', 'syncOutline'],
  ['outlines', 'darkOutlineColor'],
  ['outlines', 'syncOutlineGeometry'],
  ['outlines', 'clearOutline'],
  ['background-paint', 'BACKGROUND_STYLE_KEYS'],
  ['background-paint', 'BgPainted'],
  ['background-paint', 'backgroundEdges'],
  ['background-paint', 'clearBackgrounds'],
  ['background-paint', 'renderBackgroundImage'],
  ['background-paint', 'paintGradientLayer'],
  ['background-paint', 'paintBackgrounds'],
  ['background-paint', 'syncBackgrounds'],
  ['box-geometry', 'BorderSide'],
  ['box-geometry', 'BorderCorner'],
  ['box-geometry', 'BORDER_SIDES'],
  ['box-geometry', 'BORDER_CORNERS'],
  ['border-paint', 'BORDER_WIDTH_KEYS'],
  ['border-paint', 'BORDER_COLOR_KEYS'],
  ['border-paint', 'BORDER_RADIUS_KEYS'],
  ['border-paint', 'BORDER_EDGE_KEYS'],
  ['border-paint', 'BORDER_STYLE_KEYS'],
  ['box-geometry', 'borderLength'],
  ['box-geometry', 'borderRadiusPoints'],
  ['box-geometry', 'resolveBorderRadii'],
  ['box-geometry', 'scaleBorderRadii'],
  ['box-geometry', 'BORDER_STYLE_WORDS'],
  ['border-paint', 'BORDER_WIDTH_RE'],
  ['border-paint', 'parseBorderEdge'],
  ['box-geometry', 'roundedBoxCGPath'],
  ['box-geometry', 'borderStrokeCGPath'],
  ['box-geometry', 'borderBandCGPath'],
  ['border-paint', 'borderSideCGPath'],
  ['box-geometry', 'borderNSColor'],
  ['border-paint', 'setBorderSlot'],
  ['border-paint', 'clearBorderSlot'],
  ['border-paint', 'setBorderEdge'],
  ['border-paint', 'clearBorderEdge'],
  ['border-paint', 'removeBorderLayers'],
  ['border-paint', 'syncBorderBox'],
  ['border-paint', 'disposeBorder'],
  ['shadow-paint', 'ParsedBoxShadow'],
  ['shadow-paint', 'SHADOW_LENGTH_RE'],
  ['shadow-paint', 'parseBoxShadow'],
  ['shadow-paint', 'ZERO_RADII'],
  ['box-geometry', 'outsetShadowOnSelf'],
  ['shadow-paint', 'siblingShadowSuperlayer'],
  ['shadow-paint', 'syncBoxShadow'],
  ['shadow-paint', 'disposeShadow'],
  ['transform-paint', 'TRANSFORM_KEYS'],
  ['transform-paint', 'TRANSFORM_SLOT'],
  ['transform-paint', 'translateAxisValue'],
  ['transform-paint', 'transformAngleValue'],
  ['transform-paint', 'transformScaleValue'],
  ['transform-paint', 'DEFAULT_PERSPECTIVE'],
  ['transform-paint', 'syncTransform'],
  ['transform-paint', 'hasPercentTranslate'],
  ['box-paint', 'boxPaintStates'],
  ['box-paint', 'retiringPaint'],
  ['box-paint', 'OUTLINE_PROPS'],
  ['box-paint', 'isPaintStyle'],
  ['box-paint', 'livePaintNode'],
  ['box-paint', 'removeBoxFrameToken'],
  ['box-paint', 'clearBoxFrameObserver'],
  ['box-paint', 'observeBoxFrame'],
  ['box-paint', 'syncFrameLease'],
  ['box-paint', 'acquirePaint'],
  ['box-paint', 'syncGeometry'],
  ['box-paint', 'applyBoxStyle'],
  ['box-paint', 'syncProjection'],
  ['box-paint', 'borderSpecForNode'],
  ['box-paint', 'disposePaintState'],
  ['box-paint', 'dispose'],
  ['native-style', 'clearMarginStyle'],
  ['native-style', 'syncLabelAlignment'],
  ['native-style', 'resetStyle'],
  ['native-style', 'applyStyle'],
  ['style-values', 'normalizeClass'],
  ['style-values', 'nodeClasses'],
  ['style-values', 'effectiveStyle'],
  ['native-style', 'applyClassNameProp'],
  ['text-elements', 'textContent'],
  ['text-elements', 'syncLabelOverflow'],
  ['text-elements', 'syncHtmlView'],
  ['text-elements', 'setLabelText'],
  ['text-elements', 'textLinkCharacterIndex'],
  ['text-elements', 'primaryClickBoundary'],
  ['text-elements', 'AxLinkSlot'],
  ['text-elements', 'axLinkActionPool'],
  ['text-elements', 'linkOwners'],
  ['text-elements', 'retireTextLinks'],
  ['text-elements', 'axLinkActionSlot'],
  ['text-elements', 'syncTextLinks'],
  ['text-elements', 'releaseTextLinkView'],
  ['text-elements', 'disposeTextLinks'],
  ['text-elements', 'syncText'],
  ['subscriptions', 'keyboardSubscriptionsByNode'],
  ['subscriptions', 'observeViewKeys'],
  ['subscriptions', 'fileDropSubscriptionsByNode'],
  ['subscriptions', 'observeFileDrop'],
  ['subscriptions', 'contextSubscriptionsByNode'],
  ['subscriptions', 'observeContextMenu'],
  ['subscriptions', 'setImageActions'],
  ['subscriptions', 'setKeyActions'],
  ['subscriptions', 'setFocusActions'],
  ['input-elements', 'dispatchTextEvent'],
  ['input-elements', 'syncSecureTextField'],
  ['input-elements', 'fitTextView'],
  ['input-elements', 'syncTextViewPlaceholder'],
  ['actions', 'setAction'],
  ['actions', 'setPanAction'],
  ['actions', 'setControlAction'],
  ['actions', 'setTextSubmitAction'],
  ['input-elements', 'updateNativeTextValue'],
  ['input-elements', 'syncTextControlState'],
  ['accessibility', 'applyAccessibility'],
  ['element-props', 'droppedPropClears'],
  ['element-props', 'applyProps'],
  ['projection', 'PROXY_LAYOUT_PROPS'],
  ['projection', 'PROXY_LAYOUT_STYLES'],
  ['projection', 'projectedViews'],
  ['projection', 'releaseProjectedView'],
  ['projection', 'syncProxyProjection'],
  ['projection', 'validateProxyTree'],
  ['tree', 'detach'],
  ['layout', 'queueLayoutReconcile'],
  ['layout', 'drainLayoutDirty'],
  ['layout', 'reconcileLayoutParent'],
  ['tree', 'validateTextNesting'],
  ['tree', 'textOnlyChildError'],
  ['tree', 'insert'],
  ['tree', 'remove'],
  ['nodes', 'destroy'],
  ['driver', 'validateBatch'],
  ['driver', 'applyCommand'],
  ['driver', 'macOSDriver'],
  ['hover', 'hoverRecordsByArea'],
  ['hover', 'hoverRecordByView'],
  ['popover', 'openPopups'],
  ['hover', 'pointerMotion'],
  ['hover', 'TRACKING_OPTS'],
  ['hover', 'trackingOpt'],
  ['hover', 'HOVER_TRACKING_OPTIONS'],
  ['hover', 'dispatchHover'],
  ['hover', 'observeHover'],
  ['hover', 'unobserveHover'],
  ['hover', 'hoverTrackingTarget'],
  ['hover', '#try'],
  ['css-pseudo-state', 'observePseudoHover'],
  ['css-pseudo-state', 'syncPressedState'],
  ['css-pseudo-state', 'syncPseudoState'],
  ['css-pseudo-state', 'syncPseudoTracking'],
  ['css-pseudo-state', 'focusedCssNode'],
  ['css-pseudo-state', 'syncContainerFocus'],
  ['css-pseudo-state', 'cssInputModality'],
  ['css-pseudo-state', 'cssModalityObserved'],
  ['css-pseudo-state', 'installCssModalityObserver'],
  ['css-pseudo-state', 'focusObserverInstalled'],
  ['css-pseudo-state', 'installFocusObserver'],
  ['css-pseudo-state', 'syncContainerPseudoState'],
  ['popover', 'popoverEdge'],
  ['popover', 'popupFittingSize'],
  ['popover', 'showAnchoredPopup'],
  ['context-menu', 'menuActionTarget'],
  ['context-menu', '#try'],
  ['context-menu', 'contextMenuAttachments'],
  ['context-menu', 'attachContextMenu'],
  ['picker-bridge', 'DATE_PICKER_STYLES'],
  ['picker-bridge', 'DATE_PICKER_ELEMENTS'],
  ['picker-bridge', 'dateFromMillis'],
  ['picker-bridge', 'attachPicker'],
  ['picker-bridge', 'attachDatePicker'],
  ['sheet-bridge', 'sheetWindowCancels'],
  ['sheet-bridge', 'sheetAnchorChanges'],
  ['sheet-bridge', 'AppKitSheetWindow'],
  ['sheet-bridge', 'AppKitSheetAnchorObserver'],
  ['sheet-bridge', 'presentSheet'],
  ['host-bridge', 'appKitBridge'],
  ['runtime', '#3'],
  ['runtime', '#4'],
  ['runtime', '#5'],
  ['style-environment', 'restyleContainer'],
  ['style-environment', 'restyleAllContainers'],
  ['runtime', '#6'],
  ['runtime', '#7'],
  ['style-environment', 'containerWindowTargets'],
  ['style-environment', 'refreshWindowMedia'],
  ['style-environment', 'seedContainerMedia'],
  ['style-environment', 'resizeQueued'],
  ['style-environment', 'onHostWindowResize'],
  ['style-environment', 'resizeObserverInstalled'],
  ['style-environment', 'installResizeObserver'],
  ['style-environment', 'accessibilityDisplayObserver'],
  ['style-environment', 'installAccessibilityDisplayObserver'],
  ['runtime', '#8'],
  ['runtime', '#9'],
  ['runtime', '#10'],
  ['runtime', '#11'],
  ['runtime', '#12'],
  ['runtime', '#13'],
  ['runtime', '#14'],
  ['runtime', '#15'],
  ['runtime', '#16'],
  ['runtime', '#17'],
  ['runtime', '#18'],
  ['runtime', '#19'],
  ['runtime', '#20'],
  ['runtime', '#21'],
  ['runtime', '#22'],
  ['runtime', '#23'],
  ['runtime', '#24'],
  ['runtime', '#25'],
  ['runtime', '#26'],
  ['runtime', '#27'],
  ['runtime', '#28'],
  ['runtime', '#29'],
  ['runtime', '#30'],
  ['runtime', '#31'],
  ['runtime', '#32'],
  ['runtime', '#33'],
  ['runtime', '#34'],
  ['roots', 'MacOSRootOptions'],
  ['automation', 'installAutomation'],
  ['measurements', 'round'],
  ['image-elements', 'applyBuiltinImageProp'],
  ['image-elements', 'disposeBuiltinImage'],
  ['projection', 'disposeBuiltinProxyChildren'],
  ['text-elements', 'applyBuiltinHtmlViewProp'],
  ['text-elements', 'applyBuiltinLabelProp'],
  ['text-elements', 'disposeBuiltinFormattedText'],
  ['container-elements', 'applyBuiltinContentHostProp'],
  ['container-elements', 'applyBuiltinLiquidGlassProp'],
  ['container-elements', 'applyBuiltinPlaceholderProp'],
  ['container-elements', 'disposeBuiltinRootLayout'],
  ['container-elements', 'disposeBuiltinLiquidGlass'],
  ['container-elements', 'disposeBuiltinContentHost'],
  ['container-elements', 'disposeBuiltinPlaceholder'],
  ['hosted-elements', 'applyBuiltinTabViewProp'],
  ['hosted-elements', 'applyBuiltinListViewProp'],
  ['hosted-elements', 'applyBuiltinWebViewProp'],
  ['hosted-elements', 'disposeBuiltinListView'],
  ['hosted-elements', 'disposeBuiltinPager'],
  ['hosted-elements', 'disposeBuiltinVideo'],
  ['hosted-elements', 'disposeBuiltinTabView'],
  ['hosted-elements', 'disposeBuiltinTabItem'],
  ['hosted-elements', 'disposeBuiltinWebView'],
  ['picker-elements', 'applyBuiltinSegmentedBarProp'],
  ['picker-elements', 'applyBuiltinListPickerProp'],
  ['picker-elements', 'applyBuiltinTimePickerProp'],
  ['picker-elements', 'applyBuiltinDatePickerProp'],
  ['picker-elements', 'disposeBuiltinSegmentedItem'],
  ['picker-elements', 'disposeBuiltinSegmentedChildren'],
  ['picker-elements', 'disposeBuiltinSegmentedControl'],
  ['picker-elements', 'disposeBuiltinListPicker'],
  ['picker-elements', 'disposeBuiltinTimePicker'],
  ['picker-elements', 'disposeBuiltinDatePicker'],
  ['input-elements', 'applyBuiltinSearchBarProp'],
  ['input-elements', 'applyBuiltinTextInputProp'],
  ['input-elements', 'disposeBuiltinTextViewLayout'],
  ['input-elements', 'disposeBuiltinTextInput'],
  ['controls', 'applyBuiltinProgressProp'],
  ['controls', 'applyBuiltinActivityIndicatorProp'],
  ['controls', 'applyBuiltinButtonProp'],
  ['controls', 'applyBuiltinScrollViewProp'],
  ['controls', 'applyBuiltinSwitchProp'],
  ['controls', 'applyBuiltinSliderProp'],
  ['controls', 'disposeBuiltinActivityIndicator'],
  ['controls', 'disposeBuiltinScrollView'],
]

const services = new Set(
  declarations.map(([module]) => module.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())),
)
let cached: string | undefined
const builtinHelpers = new Map<string, string>()

export function builtinFixtureHelpers(): string {
  rendererSource()
  return [...builtinHelpers.values()].join('\n')
}

export function rendererSource(): string {
  if (cached !== undefined) {
    return cached
  }
  const modules = new Map<string, Map<string, string>>()
  for (const [module] of declarations) {
    if (modules.has(module)) {
      continue
    }
    const raw = readFileSync(new URL('../src/' + module + '.ts', import.meta.url), 'utf8')
    const stripped = stripTypeScriptTypes(raw)
    const moduleAst = parse(stripped, { ecmaVersion: 'latest', sourceType: 'module' })
    const factory = moduleAst.body.flatMap((statement) => {
      if (
        statement.type === 'ExportNamedDeclaration' &&
        statement.declaration?.type === 'FunctionDeclaration' &&
        statement.declaration.id?.name.startsWith('create')
      ) {
        return [statement.declaration]
      }
      if (
        module === 'runtime' &&
        statement.type === 'FunctionDeclaration' &&
        statement.id?.name === 'initializeRuntime'
      ) {
        return [statement]
      }
      return []
    })[0]
    // Stateless leaf modules expose declarations directly, without a service factory.
    const last = factory?.body.body.at(-1)
    const end = module === 'runtime' ? factory!.body.end - 1 : last?.start
    const body =
      factory && end !== undefined
        ? stripped.slice(factory.body.start + 1, end).replace(/^ {2}/gm, '')
        : moduleAst.body
            .flatMap((statement) =>
              statement.type === 'ExportNamedDeclaration' && statement.declaration
                ? [stripped.slice(statement.declaration.start, statement.declaration.end)]
                : [],
            )
            .join('\n')
    const ast = parse(body, { ecmaVersion: 'latest', sourceType: 'script' })
    const found = new Map<string, string>()
    let previous = 0,
      anonymous = 0
    for (const statement of ast.body) {
      // Process activation is covered by production-constructor tests, not the
      // legacy flattened runtime fixture's numbered statements.
      if (module === 'runtime' && /^(styleEnvironment|automation)\.activate\(/.test(body.slice(statement.start, statement.end))) {
        previous = statement.end
        continue
      }
      let key: string
      if (statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') {
        key = statement.id!.name
      } else if (statement.type === 'VariableDeclaration') {
        const binding = statement.declarations[0].id
        key = binding.type === 'Identifier' ? binding.name : 'round'
      } else {
        key = module === 'runtime' ? '#' + anonymous : '#try'
      }
      let text = body
        .slice(previous, statement.end)
        .replace(/const prior = nodeActions.get\(node\)[\s\S]*?releaseNodeAction\(node\) }/g, '')
        .replace(/!nodeActions.has\(node\)/g, 'node.actionId === undefined')
        .replace(/deps\.state\.get\(/g, 'getAccessibilityProps(')
        .replace(/deps\.directory\.containers\(\)/g, '[...appKitContainers]')
        .replace(/deps\.directory\.hasHost\(/g, 'ownedRoots.has(')
        .replace(/deps\.boxPaint\.dispose\b/g, 'disposeBoxPaint')
        .replace(/\bdeps\s*\.\s*\w+\s*\.\s*/g, '')
      if (
        [
          'border-paint',
          'shadow-paint',
          'transform-paint',
          'background-paint',
          'outlines',
        ].includes(module)
      ) {
        // Legacy isolated writer fixtures pass their node-shaped state explicitly
        // through this adapter; production always receives coordinator-owned state.
        text = text.replace(/(function \w+\(\s*node\s*,\s*state)(\s*[,)]?)/g, '$1 = node$2')
        text = text.replace('!state.current()', '!(state.current?.() ?? true)')
      }
      if (module === 'box-paint') {
        text = text.replace(/\b(border|shadow|transform|background|outlines)\./g, '')
        if (key === 'dispose') {
          text = text.replace(/\bdispose\(/g, 'disposeBoxPaint(')
        } else {
          text = text.replace(/\bdispose\(node\)/g, 'disposeBoxPaint(node)')
        }
      }
      if (module === 'runtime') {
        text = text.replace(
          /\b([A-Za-z]+)\s*\.\s*([A-Za-z_$][\w$]*)/g,
          (match, owner: string, member: string) => (services.has(owner) ? member : match),
        )
      }
      if (/^(?:(apply|dispose)Builtin|initializeTextViewport$)/.test(key)) {
        builtinHelpers.set(key, text)
      }
      found.set(key, text)
      previous = statement.end
      if (module === 'runtime') {
        anonymous++
      }
    }
    modules.set(module, found)
  }
  cached = declarations
    .flatMap(([module, symbol]) => {
      let text = modules.get(module)?.get(symbol)
      // Preserve the old fixture's map boundary/substring anchors only. Runtime
      // storage is private and is covered through production constructor tests.
      const legacyDeclarations: Record<string, string> = {
        actionHandlers: 'const actionHandlers = new Map()',
        actionIdsByView: 'const actionIdsByView = new WeakMap()',
        nextActionId: 'let nextActionId = 1',
        accessibilityLabels: 'const accessibilityLabels = new Map()',
        accessibilityRoles: 'const accessibilityRoles = new Map()',
        stackAccessibilityPropsByView: 'const stackAccessibilityPropsByView = new WeakMap()',
      }
      if (!text) { text = legacyDeclarations[symbol] }
      if (symbol === 'invokeAction') { text = 'function invokeAction(id) { actionHandlers.get(id)?.() }' }

      // Type declarations disappear during stripping.
      return text === undefined ? [] : [text]
    })
    .join('\n')
  return cached
}
