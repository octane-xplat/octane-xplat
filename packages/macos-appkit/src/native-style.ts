import type { PropBag, ElementNode } from './model'
import { nativeColor } from './native-colors'
import {
  NSColor,
  NSFontManager,
  NSFontTraitMask,
  NSImageView,
  NSTextAlignment,
  NSTextField,
  interop,
} from '@octane-xplat/platform/macos'
import { resolveFont as fontForFamilyStyle } from './fonts'
import { setImageDrawingStyle } from './image-drawing'
import { INHERITED_CSS_PROPERTIES } from '@octane-xplat/css-engine'

import type { createTextElements } from './text-elements'
import type { createInputElements } from './input-elements'
import type { createRegistry } from './registry'
import type { createLayout } from './layout'
import type { createCssCascade } from './css-cascade'
import type { createMeasurements } from './measurements'
import type { createBackgroundPaint } from './background-paint'
import type { createAccessibleHost } from './accessible-host'
import type { createPointerStyle } from './pointer-style'
import type { createOutlines } from './outlines'
import type { createBorderPaint } from './border-paint'
import type { createTransformPaint } from './transform-paint'
import type { createShadowPaint } from './shadow-paint'

interface Dependencies {
  textElements: Pick<
    ReturnType<typeof createTextElements>,
    'setLabelText' | 'labelPaddings' | 'syncLabelOverflow' | 'syncText'
  >
  inputElements: Pick<ReturnType<typeof createInputElements>, 'setTextFieldPlaceholder'>
  registry: Pick<ReturnType<typeof createRegistry>, 'isManualLayoutParent' | 'behaviorOf'>
  layout: Pick<
    ReturnType<typeof createLayout>,
    'queueLayoutReconcile' | 'layoutView' | 'MARGIN_SIDES' | 'setMarginStyle'
  >
  cssCascade: Pick<ReturnType<typeof createCssCascade>, 'warnUnsupportedCssProp' | 'applyClassName'>
  measurements: Pick<ReturnType<typeof createMeasurements>, 'nodeClasses'>
  backgroundPaint: Pick<
    ReturnType<typeof createBackgroundPaint>,
    'BACKGROUND_STYLE_KEYS' | 'syncBackgrounds'
  >
  accessibleHost: Pick<ReturnType<typeof createAccessibleHost>, 'inputTransparentViews'>
  pointerStyle: Pick<ReturnType<typeof createPointerStyle>, 'syncCursor' | 'syncUserSelect'>
  outlines: Pick<ReturnType<typeof createOutlines>, 'syncOutline'>
  borderPaint: Pick<
    ReturnType<typeof createBorderPaint>,
    | 'BORDER_RADIUS_KEYS'
    | 'clearBorderSlot'
    | 'BORDER_WIDTH_KEYS'
    | 'BORDER_COLOR_KEYS'
    | 'BORDER_EDGE_KEYS'
    | 'clearBorderEdge'
    | 'BORDER_STYLE_KEYS'
    | 'syncBorderBox'
    | 'setBorderSlot'
    | 'setBorderEdge'
  >
  transformPaint: Pick<
    ReturnType<typeof createTransformPaint>,
    'syncBoxGeometry' | 'TRANSFORM_KEYS' | 'TRANSFORM_SLOT' | 'translateAxisValue'
  >
  shadowPaint: Pick<ReturnType<typeof createShadowPaint>, 'parseBoxShadow'>
}

export function createNativeStyle(deps: Dependencies) {
  const EDGE_INSET_PROPS = new Map([
    ['paddingTop', ['top']],
    ['paddingRight', ['right']],
    ['paddingBottom', ['bottom']],
    ['paddingLeft', ['left']],
    ['paddingVertical', ['top', 'bottom']],
    ['paddingHorizontal', ['left', 'right']],
  ])

  const OUTLINE_PROPS = new Set([
    'outline',
    'outlineWidth',
    'outlineStyle',
    'outlineColor',
    'outlineOffset',
  ])

  // number | 'N' | 'V H' | 'T R B L' → NSEdgeInsets (top/left/bottom/right).
  function parseEdgeInsets(value: any) {
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const n = Number(value)
      return { top: n, left: n, bottom: n, right: n }
    }

    const parts = String(value)
      .split(/\s+/)
      .map((p) => parseFloat(p) || 0)

    const top = parts[0] ?? 0
    const right = parts.length > 1 ? parts[1] : top
    const bottom = parts.length > 2 ? parts[2] : top
    const left = parts.length > 3 ? parts[3] : right
    return { top, left, bottom, right }
  }

  // CSS owns the theme palette. Unstyled controls use AppKit semantic colors,
  // which follow the application's appearance without a second class cascade.
  function syncNativeColors(node: ElementNode) {
    const view = node.view
    if (!view) {
      return
    }

    if (['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)) {
      view.textColor = node.styleColor != null ? nativeColor(node.styleColor) : NSColor.labelColor
      if (node.type === 'label') {
        deps.textElements.setLabelText(node, String(view.stringValue ?? ''))
      }
    }

    if (node.type === 'textfield') {
      deps.inputElements.setTextFieldPlaceholder(
        view as NSTextField,
        node.props,
        node.stylePlaceholderColor,
      )
    }

    if (node.type === 'textview' && node.placeholderView) {
      node.placeholderView.textColor =
        node.stylePlaceholderColor != null
          ? nativeColor(node.stylePlaceholderColor)
          : NSColor.placeholderTextColor
    }

    if (node.styleBg != null) {
      node.bgApplied = true
      view.wantsLayer = true
      view.layer.backgroundColor = nativeColor(node.styleBg).CGColor
    } else if (node.bgApplied) {
      node.bgApplied = false
      view.layer.backgroundColor = null
    }
  }

  function fontForStyle(size: number, weight: number | string = 400) {
    return fontForFamilyStyle(size, weight)
  }

  function setSizeConstraint(node: ElementNode, name: string, value: any) {
    const spec = sizeConstraintSpec(value)
    const specs = (node.sizeConstraintSpecs ??= {})
    if (!spec) {
      delete specs[name]
      // null/undefined is an intentional clear — only malformed values warn.
      if (value != null) {
        console.warn(
          '[macos-style] ignored unsupported style.' + name + ' value ' + JSON.stringify(value),
        )
      }
    } else {
      specs[name] = spec
    }

    if (deps.registry.isManualLayoutParent((node.layoutParent ?? node.parent)?.type)) {
      deactivateSizeConstraints(node)
      deps.layout.queueLayoutReconcile(node.container, node.parent)
      return
    }

    applySizeConstraint(node, name)
    if (node.parent) {
      deps.layout.queueLayoutReconcile(node.container, node.parent)
    }
  }

  function sizeConstraintSpec(value: any) {
    if (typeof value === 'string') {
      const text = value.trim()
      const percent = text.match(/^([+-]?(?:\d+\.?\d*|\.\d+))%$/)
      if (percent) {
        const multiplier = Number(percent[1]) / 100
        return Number.isFinite(multiplier) && multiplier >= 0
          ? { kind: 'percent', multiplier }
          : null
      }

      const px = text.match(/^([+-]?(?:\d+\.?\d*|\.\d+))px$/i)
      if (px) {
        const points = Number(px[1])
        return Number.isFinite(points) && points >= 0 ? { kind: 'points', points } : null
      }
    }

    const points = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(points) && points >= 0 ? { kind: 'points', points } : null
  }

  function sizeConstraintParentView(node: ElementNode) {
    if (node.parent) {
      return (node.layoutParent ?? node.parent).childHost ?? (node.layoutParent ?? node.parent).view
    }

    return node.container.children.includes(node) ? node.container.hostView : null
  }

  function applySizeConstraint(node: ElementNode, name: string) {
    const constraints = (node.sizeConstraints ??= {})
    if (constraints[name]) {
      constraints[name].active = false
      delete constraints[name]
    }

    const spec = node.sizeConstraintSpecs?.[name]
    if (
      !spec ||
      !node.view ||
      deps.registry.isManualLayoutParent((node.layoutParent ?? node.parent)?.type)
    ) {
      return
    }

    let constraint
    if (spec.kind === 'percent') {
      const parentView = sizeConstraintParentView(node)
      if (!parentView) {
        return
      }

      const anchor =
        name === 'width'
          ? deps.layout.layoutView(node).widthAnchor
          : deps.layout.layoutView(node).heightAnchor
      const parentAnchor = name === 'width' ? parentView.widthAnchor : parentView.heightAnchor
      constraint = anchor.constraintEqualToAnchorMultiplier(parentAnchor, spec.multiplier)
    } else {
      constraint =
        name === 'width'
          ? deps.layout.layoutView(node).widthAnchor.constraintEqualToConstant(spec.points)
          : deps.layout.layoutView(node).heightAnchor.constraintEqualToConstant(spec.points)
    }

    constraints[name] = constraint
    constraint.active = true
  }

  function applySizeConstraints(node: ElementNode) {
    for (const name of ['width', 'height']) {
      applySizeConstraint(node, name)
    }
  }

  function deactivateSizeConstraints(node: ElementNode) {
    for (const name of ['width', 'height']) {
      const constraint = node.sizeConstraints?.[name]
      if (constraint) {
        constraint.active = false
        delete node.sizeConstraints[name]
      }
    }
  }

  // Style and (for labels) prop sources all write one native font. Each source
  // is tracked on the node so removing one re-resolves the rest — explicit
  // style wins over element defaults.
  function syncNodeFont(node: ElementNode) {
    const size =
      node.styleFontSize ??
      node.propFontSize ??
      (['label', 'htmlview'].includes(node.type) ? 16 : 14)

    const weight = node.styleFontWeight ?? 400
    node.appliedFontWeight = String(weight)
    node.appliedFontFamily = node.styleFontFamily ?? node.container.fontFamily
    let font = fontForFamilyStyle(size, weight, node.appliedFontFamily)
    const fontStyle = String(effectiveStyle(node).fontStyle ?? 'normal')
    if (font && (fontStyle === 'italic' || fontStyle === 'oblique')) {
      font =
        NSFontManager.sharedFontManager.convertFontToHaveTrait(font, NSFontTraitMask.Italic) ?? font
    }
    node.view!.font = font
  }

  // NSStackView edgeInsets apply the resolved padding styles.
  function syncEdgeInsets(node: ElementNode) {
    const view = node.view
    if (!view) {
      return
    }

    const edges = node.stylePaddingEdges
    const box = node.stylePaddingBox
    if (!edges && !box && !node.insetsApplied) {
      return
    }

    node.insetsApplied = true
    const insets = {
      top: edges?.top ?? box?.top ?? 0,
      right: edges?.right ?? box?.right ?? 0,
      bottom: edges?.bottom ?? box?.bottom ?? 0,
      left: edges?.left ?? box?.left ?? 0,
    }

    if (node.type === 'rootlayout' || deps.registry.behaviorOf(node.type)?.containerStyles) {
      node.dockInsets = insets
      deps.layout.queueLayoutReconcile(node.container, node)
    } else {
      view.edgeInsets = insets
    }
  }

  // Labels consume the same padding vocabulary — the cell insets drawing and
  // grows the measured size so the box model holds without a container.
  function syncLabelPadding(node: ElementNode) {
    const view = node.view
    const cell = view?.cell
    if (!view || typeof cell?.cellSizeForBounds !== 'function') {
      return
    }

    const edges = node.stylePaddingEdges
    const box = node.stylePaddingBox
    const insets = {
      top: edges?.top ?? box?.top ?? 0,
      right: edges?.right ?? box?.right ?? 0,
      bottom: edges?.bottom ?? box?.bottom ?? 0,
      left: edges?.left ?? box?.left ?? 0,
    }
    // Register on both wrappers — the cell reads through its own reference or
    // back through controlView, and bridged object identity is not guaranteed
    // to round-trip.
    deps.textElements.labelPaddings.set(view, insets)
    deps.textElements.labelPaddings.set(cell, insets)
    view.invalidateIntrinsicContentSize()
    deps.layout.queueLayoutReconcile(node.container, node.parent)
  }

  // `hidden` keeps the layout slot while suppressing paint and hit-testing;
  // `collapse` additionally drops the node from layout flows — mason consumes
  // it as display:none, manual hosts skip it like the visibility prop.
  function syncVisibility(node: ElementNode) {
    node.view!.hidden = node.styleVisibility === 'hidden' || node.styleVisibility === 'collapse'
    deps.layout.queueLayoutReconcile(node.container, node.parent)
  }

  function isCollapsed(node: any) {
    return node?.props?.visibility === 'collapse' || node?.styleVisibility === 'collapse'
  }

  // Zero the margin sides a removed style owned and re-queue the mason pass.
  function clearMarginStyle(node: ElementNode, name: string) {
    const insets = node.marginInsets
    if (!insets) {
      return
    }

    if (name === 'margin') {
      insets.top = insets.right = insets.bottom = insets.left = 0
    } else {
      insets[deps.layout.MARGIN_SIDES[name]] = 0
    }

    const marginParent = node.layoutParent ?? node.parent
    if (deps.registry.isManualLayoutParent(marginParent?.type)) {
      deps.layout.queueLayoutReconcile(node.container, marginParent)
    }
  }

  function syncLabelAlignment(node: ElementNode, style: PropBag) {
    const view = node.view
    if (!view) {
      return
    }
    const rtl = style.direction === 'rtl'
    if (style.direction != null && style.direction !== 'ltr' && !rtl) {
      deps.cssCascade.warnUnsupportedCssProp(node, 'direction')
    }
    const start = rtl ? NSTextAlignment.Right : NSTextAlignment.Left
    const end = rtl ? NSTextAlignment.Left : NSTextAlignment.Right
    let alignment: interop.Enum<typeof NSTextAlignment> = deps.measurements
      .nodeClasses(node)
      .includes('vx-sheet-grabber')
      ? NSTextAlignment.Center
      : start
    switch (style.textAlign) {
      case null:
      case undefined:
        break
      case 'start':
        alignment = start
        break
      case 'end':
        alignment = end
        break
      case 'left':
        alignment = NSTextAlignment.Left
        break
      case 'right':
        alignment = NSTextAlignment.Right
        break
      case 'center':
        alignment = NSTextAlignment.Center
        break
      case 'justify':
        alignment = NSTextAlignment.Justified
        break
      default:
        deps.cssCascade.warnUnsupportedCssProp(node, 'textAlign')
    }
    // Alignment writes can affect native text editing/selection. Leave an
    // unchanged value alone; attributed values are recomposed by the caller.
    if (view.alignment !== alignment) {
      view.alignment = alignment
    }
  }

  // A style key present in the last bag but absent or nulled in the new one must
  // put back the native state it installed: constraints deactivate, hit-testing
  // reverts, and shared properties resolve their class/default source again.
  function resetStyle(node: ElementNode, name: string) {
    const view = node.view
    if (!view) {
      return
    }

    const textControl = ['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(
      node.type,
    )

    if (deps.backgroundPaint.BACKGROUND_STYLE_KEYS.has(name)) {
      deps.backgroundPaint.syncBackgrounds(node)
    } else if (name === 'selectedBackgroundColor' && node.type === 'segmentedbar') {
      view.selectedSegmentBezelColor = nativeColor('#0000ff')
    } else if (name === 'pointerEvents') {
      deps.accessibleHost.inputTransparentViews.delete(view)
    } else if ((name === 'objectFit' || name === 'objectPosition') && node.type === 'image') {
      setImageDrawingStyle(view as NSImageView, name, undefined)
    } else if (name === 'fontSize' && textControl) {
      node.styleFontSize = undefined
      syncNodeFont(node)
    } else if (name === 'fontFamily' && textControl) {
      node.styleFontFamily = undefined
      syncNodeFont(node)
    } else if (name === 'fontWeight' && textControl) {
      node.styleFontWeight = undefined
      syncNodeFont(node)
    } else if (name === 'fontStyle' && textControl) {
      syncNodeFont(node)
    } else if (name === 'letterSpacing' && node.type === 'label') {
      deps.textElements.setLabelText(node, String(view.stringValue ?? ''))
    } else if (name === 'color' && textControl) {
      node.styleColor = undefined
      syncNativeColors(node)
    } else if (name === 'visibility') {
      node.styleVisibility = undefined
      syncVisibility(node)
    } else if (name === 'cursor') {
      node.styleCursor = undefined
      deps.pointerStyle.syncCursor(node)
    } else if (name === 'userSelect') {
      node.styleUserSelect = undefined
      if (['label', 'htmlview'].includes(node.type)) {
        deps.pointerStyle.syncUserSelect(node)
      }
    } else if (OUTLINE_PROPS.has(name)) {
      deps.outlines.syncOutline(node)
    } else if (name === 'padding' && node.type === 'label') {
      node.stylePaddingBox = undefined
      node.stylePaddingEdges = undefined
      syncLabelPadding(node)
    } else if (EDGE_INSET_PROPS.has(name) && node.type === 'label') {
      for (const edge of EDGE_INSET_PROPS.get(name)!) {
        delete node.stylePaddingEdges?.[edge]
      }

      syncLabelPadding(node)
    } else if (
      name === 'padding' &&
      (node.type === 'rootlayout' || deps.registry.behaviorOf(node.type)?.containerStyles)
    ) {
      node.stylePaddingBox = undefined
      node.stylePaddingEdges = undefined
      syncEdgeInsets(node)
    } else if (
      EDGE_INSET_PROPS.has(name) &&
      (node.type === 'rootlayout' || deps.registry.behaviorOf(node.type)?.containerStyles)
    ) {
      for (const edge of EDGE_INSET_PROPS.get(name)!) {
        delete node.stylePaddingEdges?.[edge]
      }

      syncEdgeInsets(node)
    } else if (name === 'backgroundColor') {
      node.styleBg = undefined
      syncNativeColors(node)
    } else if (deps.borderPaint.BORDER_RADIUS_KEYS[name] != null) {
      deps.borderPaint.clearBorderSlot(node, 'radii', deps.borderPaint.BORDER_RADIUS_KEYS[name])
    } else if (deps.borderPaint.BORDER_WIDTH_KEYS[name] != null) {
      deps.borderPaint.clearBorderSlot(node, 'widths', deps.borderPaint.BORDER_WIDTH_KEYS[name])
    } else if (deps.borderPaint.BORDER_COLOR_KEYS[name] != null) {
      deps.borderPaint.clearBorderSlot(node, 'colors', deps.borderPaint.BORDER_COLOR_KEYS[name])
    } else if (deps.borderPaint.BORDER_EDGE_KEYS[name] != null) {
      deps.borderPaint.clearBorderEdge(node, deps.borderPaint.BORDER_EDGE_KEYS[name])
    } else if (deps.borderPaint.BORDER_STYLE_KEYS.has(name)) {
      deps.borderPaint.syncBorderBox(node)
    } else if (name === 'boxShadow') {
      node.boxShadowSpec = undefined
      deps.transformPaint.syncBoxGeometry(node)
    } else if (name === 'cornerShape') {
      if (view.layer) {
        view.layer.cornerCurve = 'circular'
      }
    } else if (name === 'textDecoration' && node.type === 'label') {
      deps.textElements.setLabelText(node, String(view.stringValue ?? ''))
    } else if (name === 'placeholderColor') {
      node.stylePlaceholderColor = undefined
      if (node.type === 'textfield') {
        deps.inputElements.setTextFieldPlaceholder(view as NSTextField, node.props)
      } else if (node.type === 'textview' && node.placeholderView) {
        node.placeholderView.textColor = NSColor.placeholderTextColor
      }
    } else if (name === 'width' || name === 'height') {
      setSizeConstraint(node, name, undefined)
    } else if (name === 'left' || name === 'top' || name === 'right' || name === 'bottom') {
      const resetParent = node.layoutParent ?? node.parent
      if (deps.registry.isManualLayoutParent(resetParent?.type)) {
        deps.layout.queueLayoutReconcile(node.container, resetParent)
      }
    } else if (deps.transformPaint.TRANSFORM_KEYS.has(name)) {
      if (node.transformSpec) {
        delete node.transformSpec[deps.transformPaint.TRANSFORM_SLOT[name] ?? name]
      }

      deps.transformPaint.syncBoxGeometry(node)
    } else if (name === 'zIndex') {
      if (view.layer) {
        view.layer.zPosition = 0
      }
    } else if (name === 'opacity') {
      view.alphaValue = 1
    } else if (deps.layout.MARGIN_SIDES[name] || name === 'margin') {
      clearMarginStyle(node, name)
    }
    // lineHeight folds into setLabelText from props.style — no native reset.
  }

  function applyStyle(node: ElementNode, style: PropBag) {
    // cssOriginKeys: declared on this node via CSS -> warn once per prop.
    // inheritedOnlyKeys: inherited only -> never warn.
    if (style != null && typeof style !== 'object') {
      throw new Error('AppKit spike expects style to be an object')
    }

    // The style prop replaces wholesale, so keys dropped or nulled since the
    // last apply must reset the native state they installed before the current
    // values go on — otherwise removed styles linger on the view. The keyframe
    // overlay sits above the computed style (NS `keyframe:` layer semantics).
    const next: PropBag = node.animatedStyle ? { ...style, ...node.animatedStyle } : (style ?? {})

    const prev: PropBag = node.appliedStyle ?? {}
    for (const name of Object.keys(prev)) {
      if (prev[name] != null && next[name] == null) {
        resetStyle(node, name)
      }
    }

    for (const [name, value] of Object.entries(next)) {
      if (value == null) {
        continue
      }

      if (deps.backgroundPaint.BACKGROUND_STYLE_KEYS.has(name)) {
        deps.backgroundPaint.syncBackgrounds(node)
      } else if (name === 'overflow' || name === 'overflowX' || name === 'overflowY') {
        // Resolve both axes together after the complete style is applied.
        continue
      } else if (name === 'pointerEvents') {
        if (value === 'none') {
          deps.accessibleHost.inputTransparentViews.add(node.view!)
        } else {
          deps.accessibleHost.inputTransparentViews.delete(node.view!)
        }
      } else if (name === 'selectedBackgroundColor' && node.type === 'segmentedbar') {
        node.view!.selectedSegmentBezelColor = nativeColor(value)
      } else if ((name === 'objectFit' || name === 'objectPosition') && node.type === 'image') {
        setImageDrawingStyle(node.view as NSImageView, name, value)
      } else if (
        name === 'fontSize' &&
        ['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)
      ) {
        node.styleFontSize = value
        syncNodeFont(node)
      } else if (
        name === 'fontFamily' &&
        ['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)
      ) {
        node.styleFontFamily = String(value)
        syncNodeFont(node)
      } else if (
        name === 'color' &&
        ['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)
      ) {
        node.styleColor = String(value)
        node.view!.textColor = nativeColor(value)
      } else if (name === 'lineHeight' && ['label', 'textfield', 'textview'].includes(node.type)) {
        // syncText applies this to each paragraph; it is not the label's fixed height.
        continue
      } else if (name === 'padding' && node.type === 'label') {
        const box = parseEdgeInsets(value)
        node.stylePaddingBox = box
        node.stylePaddingEdges = {
          top: box.top,
          right: box.right,
          bottom: box.bottom,
          left: box.left,
        }

        syncLabelPadding(node)
      } else if (EDGE_INSET_PROPS.has(name) && node.type === 'label') {
        const edges = (node.stylePaddingEdges ??= {})
        for (const edge of EDGE_INSET_PROPS.get(name)!) {
          edges[edge] = Number(value) || 0
        }

        syncLabelPadding(node)
      } else if (
        name === 'padding' &&
        (node.type === 'rootlayout' || deps.registry.behaviorOf(node.type)?.containerStyles)
      ) {
        const box = parseEdgeInsets(value)
        node.stylePaddingBox = box
        node.stylePaddingEdges = {
          top: box.top,
          right: box.right,
          bottom: box.bottom,
          left: box.left,
        }

        syncEdgeInsets(node)
      } else if (
        EDGE_INSET_PROPS.has(name) &&
        (node.type === 'rootlayout' || deps.registry.behaviorOf(node.type)?.containerStyles)
      ) {
        const edges = (node.stylePaddingEdges ??= {})
        for (const edge of EDGE_INSET_PROPS.get(name)!) {
          edges[edge] = Number(value) || 0
        }

        syncEdgeInsets(node)
      } else if (name === 'backgroundColor' && node.view) {
        node.styleBg = String(value)
        node.bgApplied = true
        node.view.wantsLayer = true
        node.view.layer.backgroundColor = nativeColor(value).CGColor
      } else if (deps.borderPaint.BORDER_RADIUS_KEYS[name] != null && node.view) {
        deps.borderPaint.setBorderSlot(
          node,
          'radii',
          deps.borderPaint.BORDER_RADIUS_KEYS[name],
          value,
        )
      } else if (name === 'cornerShape' && node.view) {
        node.view.wantsLayer = true
        node.view.layer.cornerCurve = value === 'squircle' ? 'continuous' : 'circular'
      } else if (name === 'placeholderColor' && node.view) {
        node.stylePlaceholderColor = String(value)
        if (node.type === 'textfield') {
          deps.inputElements.setTextFieldPlaceholder(
            node.view as NSTextField,
            node.props,
            node.stylePlaceholderColor,
          )
        } else if (node.type === 'textview' && node.placeholderView) {
          node.placeholderView.textColor = nativeColor(node.stylePlaceholderColor)
        }
      } else if ((name === 'width' || name === 'height') && node.view) {
        setSizeConstraint(node, name, value)
      } else if (
        name === 'left' &&
        node.view &&
        deps.registry.isManualLayoutParent((node.layoutParent ?? node.parent)?.type)
      ) {
        deps.layout.queueLayoutReconcile(node.container, node.parent)
      } else if (deps.transformPaint.TRANSFORM_KEYS.has(name) && node.view) {
        const spec = (node.transformSpec ??= {})
        spec[deps.transformPaint.TRANSFORM_SLOT[name] ?? name] =
          name === 'translateX' || name === 'translateY'
            ? deps.transformPaint.translateAxisValue(value)
            : value

        deps.transformPaint.syncBoxGeometry(node)
      } else if (name === 'zIndex' && node.view) {
        node.view.wantsLayer = true
        node.view.layer.zPosition = Number(value) || 0
      } else if (name === 'opacity' && node.view) {
        node.view.alphaValue = Number(value)
      } else if (
        name === 'fontWeight' &&
        ['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)
      ) {
        node.styleFontWeight = String(value)
        syncNodeFont(node)
      } else if (
        name === 'fontStyle' &&
        ['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)
      ) {
        syncNodeFont(node)
      } else if (name === 'letterSpacing' && node.type === 'label' && node.view) {
        deps.textElements.setLabelText(node, String(node.view.stringValue ?? ''))
      } else if (name === 'visibility' && node.view) {
        node.styleVisibility = String(value)
        syncVisibility(node)
      } else if (name === 'cursor' && node.view) {
        node.styleCursor = String(value)
        deps.pointerStyle.syncCursor(node)
      } else if (name === 'userSelect' && node.view) {
        node.styleUserSelect = String(value)
        if (['label', 'htmlview'].includes(node.type)) {
          deps.pointerStyle.syncUserSelect(node)
        }
      } else if (OUTLINE_PROPS.has(name) && node.view) {
        deps.outlines.syncOutline(node)
      } else if (name === 'textDecoration' && node.type === 'label' && node.view) {
        deps.textElements.setLabelText(node, String(node.view.stringValue ?? ''))
      } else if (
        ['textAlign', 'direction', 'whiteSpace', 'textOverflow'].includes(name) &&
        node.type === 'label'
      ) {
        // Apply paragraph settings after all declarations settle.
        continue
      } else if (deps.borderPaint.BORDER_WIDTH_KEYS[name] != null && node.view) {
        deps.borderPaint.setBorderSlot(
          node,
          'widths',
          deps.borderPaint.BORDER_WIDTH_KEYS[name],
          value,
        )
      } else if (deps.borderPaint.BORDER_COLOR_KEYS[name] != null && node.view) {
        deps.borderPaint.setBorderSlot(
          node,
          'colors',
          deps.borderPaint.BORDER_COLOR_KEYS[name],
          value,
        )
      } else if (deps.borderPaint.BORDER_EDGE_KEYS[name] != null && node.view) {
        deps.borderPaint.setBorderEdge(node, deps.borderPaint.BORDER_EDGE_KEYS[name], value)
      } else if (name === 'boxShadow' && node.view) {
        node.boxShadowSpec = deps.shadowPaint.parseBoxShadow(value)
        deps.transformPaint.syncBoxGeometry(node)
      } else if (deps.borderPaint.BORDER_STYLE_KEYS.has(name) && node.view) {
        deps.borderPaint.syncBorderBox(node)
      } else if (deps.layout.MARGIN_SIDES[name] || name === 'margin') {
        deps.layout.setMarginStyle(node, name, value)
      } else if (
        !(
          deps.registry.behaviorOf(node.type)?.styleKeys?.has(name) ||
          deps.registry.behaviorOf((node.layoutParent ?? node.parent)?.type)?.styleKeys?.has(name)
        )
      ) {
        // Inherited values, and inheritable properties a stylesheet declares on
        // a container for its descendants, are not unsupported here.
        if (
          node.inheritedOnlyKeys?.has(name) ||
          (node.cssOriginKeys?.has(name) &&
            INHERITED_CSS_PROPERTIES.has(name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())))
        ) {
          continue
        }

        if (node.cssOriginKeys?.has(name) || node.animatedStyle?.[name] != null) {
          deps.cssCascade.warnUnsupportedCssProp(node, name)
        } else {
          console.warn(
            '[macos-style] ignored unsupported style.' + name + ' on <' + node.type + '>',
          )
        }
      }
    }

    // Registered layouts consume style through their own sync; a style apply on
    // the container or a direct child re-queues its pass.
    const layoutHost =
      deps.registry.behaviorOf(node.type)?.layout != null
        ? node
        : deps.registry.behaviorOf((node.layoutParent ?? node.parent)?.type)?.layout != null
          ? (node.layoutParent ?? node.parent)
          : null
    if (layoutHost) {
      deps.layout.queueLayoutReconcile(node.container, layoutHost)
    }

    // Mason's overflow enum controls layout sizing; AppKit drawing needs its
    // own clip. Keep the original value: NSView defaults changed in macOS 14,
    // and specialized native views can supply a different default entirely.
    if (node.overflowClipping && node.overflowClipping.view !== node.view) {
      node.overflowClipping.view.clipsToBounds = node.overflowClipping.original
      node.overflowClipping = undefined
    }
    if (node.view) {
      const keys = ['overflow', 'overflowX', 'overflowY'].filter((key) => next[key] != null)
      const x = next.overflowX ?? next.overflow ?? 'visible'
      const y = next.overflowY ?? next.overflow ?? 'visible'
      const clipped = (x === 'hidden' || x === 'clip') && (y === 'hidden' || y === 'clip')
      const visible = x === 'visible' && y === 'visible'
      if (keys.length && (clipped || visible)) {
        node.overflowClipping ??= { view: node.view, original: node.view.clipsToBounds }
        node.view.clipsToBounds = clipped
      } else {
        if (node.overflowClipping) {
          node.view.clipsToBounds = node.overflowClipping.original
          node.overflowClipping = undefined
        }

        // A boolean NSView clip cannot represent mixed axes or create a
        // scroll container. Preserve the native baseline and expose the gap.
        for (const key of keys) {
          deps.cssCascade.warnUnsupportedCssProp(node, key)
        }
      }
    }

    node.appliedStyle = next
    if (node.type === 'label') {
      const needsAlignment = ['textAlign', 'direction'].some(
        (key) => prev[key] != null || next[key] != null,
      )

      const needsOverflow = ['whiteSpace', 'textOverflow'].some(
        (key) => prev[key] != null || next[key] != null,
      )

      if (needsAlignment) {
        syncLabelAlignment(node, next)
      }

      if (needsOverflow) {
        deps.textElements.syncLabelOverflow(node, next)
      }

      // Attributed paragraphs capture the cell's mode/alignment when composed.
      if (needsAlignment || needsOverflow) {
        deps.textElements.syncText(node)
      }
    }
    if (deps.registry.behaviorOf(node.type)?.layout) {
      deps.layout.queueLayoutReconcile(node.container, node)
    }
  }

  // `className` composes clsx-style on the DOM renderer and the NativeScript
  // driver; this mirrors octane's `normalizeClass` (native dist must not import
  // bare `octane`, and peers older than 0.11 predate the export) so a
  // declarative array or object reaches the tokenizer instead of String(value)'s
  // comma-join.
  function normalizeClass(value: any): string {
    if (typeof value === 'string') {
      return value
    }

    if (typeof value !== 'object') {
      return typeof value === 'number' && value ? '' + value : ''
    }

    if (value === null) {
      return ''
    }

    let str = ''
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) {
          const inner = normalizeClass(item)
          if (inner) {
            str = str ? str + ' ' + inner : inner
          }
        }
      }
    } else {
      for (const key in value) {
        if (value[key]) {
          str = str ? str + ' ' + key : key
        }
      }
    }

    return str
  }

  // className now only feeds the selector engine (cssClasses) and marks the
  // subtree for restyle — the hardcoded token tables are gone.
  /** Effective style for readers that used to consult props.style. */
  function effectiveStyle(node: ElementNode | null | undefined): PropBag {
    return node?.computedStyle ?? node?.props?.style ?? {}
  }

  function applyClassNameProp(node: ElementNode, value: any) {
    deps.cssCascade.applyClassName(node, value)
  }
  return {
    parseEdgeInsets,
    fontForStyle,
    setSizeConstraint,
    applySizeConstraints,
    deactivateSizeConstraints,
    syncNodeFont,
    isCollapsed,
    applyStyle,
    normalizeClass,
    effectiveStyle,
  }
}
