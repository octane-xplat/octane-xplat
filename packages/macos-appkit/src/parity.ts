import { nodeClasses, effectiveStyle } from './style-values.ts'
import type { ElementNode, RootContainer, PropBag } from './model'
import { NSColor, NSAttributedString, NSFontAttributeName, NSForegroundColorAttributeName } from '@octane-xplat/platform/macos'
import { srgbComponents, withDrawingAppearance } from './color-components'

interface ParityDependencies {
  labelPaddings: WeakMap<object, { top: number; left: number; bottom: number; right: number }>
  borderLength(value: unknown): number
  borderRadiusPoints(value: unknown, width: number, height: number): number
  borderNSColor(node: ElementNode, value: unknown): NSColor | null
  appKitContainers: Set<RootContainer>
}

/** Read renderer state through its owner; measurements retain no roots of their own. */
export function createParityMeasurements({ labelPaddings, borderLength, borderRadiusPoints, borderNSColor, appKitContainers }: ParityDependencies) {
  const round = (value: number) => Math.round(value * 100) / 100

  function descendants(node: ElementNode, out: ElementNode[] = []) {
    for (const child of node.children) {
      out.push(child)
      descendants(child, out)
    }

    return out
  }

  function colorValue(color: any, appearance?: any) {
    try {
      const rgb = srgbComponents(color, appearance)
      return rgb
        ? '#' +
            [rgb.red, rgb.green, rgb.blue]
              .map((component) =>
                Math.round(component * 255)
                  .toString(16)
                  .padStart(2, '0'),
              )
              .join('')
        : undefined
    } catch {
      return undefined
    }
  }

  function parityStyle(node: ElementNode, facets: readonly string[]) {
    const view = node.view
    const font = view?.font
    const supplied: PropBag = effectiveStyle(node)
    // Mason consumes dockInsets rather than NSStackView.edgeInsets. Its
    // absent flex values use the CSS row/stretch/normal defaults.
    const mason = node.masonNode != null
    const padding = node.dockInsets ?? view?.edgeInsets ?? labelPaddings.get(view!)
    const out: Record<string, any> = {}
    for (const facet of facets) {
      let value = supplied[facet]
      if (facet === 'paddingTop' && (padding?.top != null || mason)) {
        value = padding?.top ?? 0
      }

      if (facet === 'paddingRight' && (padding?.right != null || mason)) {
        value = padding?.right ?? 0
      }

      if (facet === 'paddingBottom' && (padding?.bottom != null || mason)) {
        value = padding?.bottom ?? 0
      }

      if (facet === 'paddingLeft' && (padding?.left != null || mason)) {
        value = padding?.left ?? 0
      }

      if (facet === 'fontSize' && font?.pointSize != null) {
        value = font.pointSize
      }

      if (facet === 'fontFamily' && font?.familyName) {
        value = font.familyName
      }

      if (facet === 'fontWeight' && font?.fontDescriptor?.symbolicTraits != null) {
        value =
          supplied.fontWeight ??
          node.appliedFontWeight ??
          (Number(font.fontDescriptor.symbolicTraits) & 2 ? '700' : '400')
      }

      if (facet === 'lineHeight' && font) {
        value =
          supplied.lineHeight ??
          (node.type === 'label'
            ? round(Number(view.frame.size.height))
            : round(Number(font.ascender) - Number(font.descender) + Number(font.leading)))
      }

      if (facet === 'color' && view?.textColor) {
        value = colorValue(view.textColor, view.effectiveAppearance) ?? value
      }

      if (facet === 'backgroundColor') {
        value =
          colorValue(
            view?.layer?.backgroundColor
              ? NSColor.colorWithCGColor(view.layer.backgroundColor)
              : null,
            view?.effectiveAppearance,
          ) ?? value

        if (value == null && view?.drawsBackground === false) {
          value = 'rgba(0,0,0,0)'
        }
      }

      if (facet === 'borderTopWidth') {
        const declared = node.borderSpec?.widths?.top
        if (declared != null) {
          value = borderLength(declared)
        } else if (view?.layer) {
          value = view.layer.borderWidth
        }
      }

      if (facet === 'borderTopColor') {
        const declared = node.borderSpec?.colors?.top
        const color =
          declared != null
            ? borderNSColor(node, declared)
            : view?.layer?.borderColor
              ? NSColor.colorWithCGColor(view.layer.borderColor)
              : null

        if (color) {
          value = colorValue(color, view?.effectiveAppearance) ?? value
        }
      }

      if (facet === 'borderTopLeftRadius') {
        const declared = node.borderSpec?.radii?.topLeft
        if (declared != null && view) {
          const size = view.frame?.size ?? { width: 0, height: 0 }
          value = borderRadiusPoints(declared, Number(size.width) || 0, Number(size.height) || 0)
        } else if (view?.layer) {
          value = view.layer.cornerRadius
        }
      }

      if (facet === 'opacity' && view?.alphaValue != null) {
        value = view.alphaValue
      }

      if (facet === 'flexDirection') {
        value =
          supplied.flexDirection ??
          node.props.flexDirection ??
          (node.props.orientation === 'horizontal'
            ? 'row'
            : node.props.orientation === 'vertical'
              ? 'column'
              : node.type === 'scrollview'
                ? node.props.horizontal === true
                  ? 'row'
                  : 'column'
                : mason
                  ? 'row'
                  : undefined)
      }

      if (facet === 'alignItems') {
        value = supplied.alignItems ?? node.props.alignItems ?? (mason ? 'stretch' : undefined)
      }

      if (facet === 'justifyContent') {
        value = supplied.justifyContent ?? node.props.justifyContent ?? (mason ? 'normal' : undefined)
      }

      if (value !== undefined && value !== null && value !== '') {
        out[facet] = String(value)
      }
    }

    if (font?.fontName) {
      out.fontPostScriptName = String(font.fontName)
    }

    return out
  }

  function measureTextLineAdvances(value: string, font: any) {
    if (!value || !font) {
      return undefined
    }

    return String(value)
      .split(/\r\n|\r|\n/)
      .map((line) => {
        const attributed = NSAttributedString.alloc().initWithStringAttributes(line, {
          [NSFontAttributeName]: font,
        })

        return round(Number(attributed.size().width))
      })
  }

  function measureTextLineCount(node: ElementNode) {
    if (node.type !== 'label') {
      return undefined
    }

    const view = node.view
    const cell = view?.cell
    if (typeof cell?.cellSizeForBounds !== 'function') {
      return undefined
    }

    const bounds = view!.bounds
    const fit = cell.cellSizeForBounds({
      origin: { x: 0, y: 0 },
      size: { width: Number(bounds.size.width), height: 100000 },
    })

    // The padded cell reports padding inside its size — take it back out
    // before dividing by the line height.
    const pad = labelPaddings.get(view!)
    const height = Number(fit?.height) - (pad ? Number(pad.top) + Number(pad.bottom) : 0)
    const styleLineHeight = Number(parityStyle(node, []).lineHeight)
    const font = view!.font
    const fontLineHeight = Number(font?.ascender) - Number(font?.descender) + Number(font?.leading)
    const lineHeight = styleLineHeight > 0 ? styleLineHeight : fontLineHeight
    if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(lineHeight) || lineHeight <= 0) {
      return undefined
    }

    return Math.max(1, Math.round(height / lineHeight))
  }

  function parityBoxInHost(view: any, rect: any, boxView: any) {
    if (
      view.window &&
      boxView.window &&
      view.window !== boxView.window &&
      !view.window.isEqual?.(boxView.window)
    ) {
      const windowRect = view.superview
        ? view.superview.convertRectToView(rect, null)
        : view.convertRectToView(view.bounds, null)

      const screenRect = view.window.convertRectToScreen(windowRect)
      const boxScreen = boxView.window.convertRectToScreen(
        boxView.convertRectToView(boxView.bounds, null),
      )

      return {
        x: round(Number(screenRect.origin.x) - Number(boxScreen.origin.x)),
        y: round(
          Number(boxScreen.origin.y) +
            Number(boxScreen.size.height) -
            Number(screenRect.origin.y) -
            Number(screenRect.size.height),
        ),
        w: round(Number(screenRect.size.width)),
        h: round(Number(screenRect.size.height)),
      }
    }
    const converted = view.superview
      ? view.superview.convertRectToView(rect, boxView)
      : view.convertRectToView(view.bounds, boxView)

    const boxHeight = Number(boxView.bounds.size.height)
    return {
      x: round(Number(converted.origin.x)),
      y: round(boxHeight - Number(converted.origin.y) - Number(converted.size.height)),
      w: round(Number(converted.size.width)),
      h: round(Number(converted.size.height)),
    }
  }

  function parityLocalBoxInHost(view: any, rect: any, boxView: any) {
    const frameOrigin = view.frame.origin
    return parityBoxInHost(
      view,
      {
        origin: {
          x: Number(frameOrigin.x) + Number(rect.origin.x),
          y: Number(frameOrigin.y) + Number(rect.origin.y),
        },
        size: rect.size,
      },
      boxView,
    )
  }

  function textContentBox(node: ElementNode, boxNode: ElementNode) {
    const view = node.view
    if (!view || !boxNode.view) {
      return null
    }

    if (node.type === 'textfield' && typeof view.cell?.titleRectForBounds === 'function') {
      return parityLocalBoxInHost(view, view.cell.titleRectForBounds(view.bounds), boxNode.view)
    }

    if (node.type === 'textview') {
      const inset = view.textContainerInset ?? { width: 0, height: 0 }
      const padding = Number(view.textContainer?.lineFragmentPadding ?? 0)
      const width = Number(view.bounds.size.width) - 2 * Number(inset.width) - 2 * padding
      const height = Number(view.bounds.size.height) - 2 * Number(inset.height)
      return parityLocalBoxInHost(
        view,
        {
          origin: { x: Number(inset.width) + padding, y: Number(inset.height) },
          size: { width: Math.max(0, width), height: Math.max(0, height) },
        },
        boxNode.view,
      )
    }

    return null
  }

  function parityNode(node: ElementNode, boxNode: ElementNode, facets: readonly string[]) {
    const view = node.view
    let box = null
    let frameBox = null
    if (view && boxNode.view) {
      try {
        frameBox = parityBoxInHost(view, view.frame, boxNode.view)
        const alignedRect = view.alignmentRectForFrame?.(view.frame)
        box = alignedRect ? parityBoxInHost(view, alignedRect, boxNode.view) : frameBox
      } catch {}
    }

    let placeholderBox = null
    let placeholderFrameBox = null
    if (node.placeholderView && boxNode.view) {
      try {
        const placeholderView = node.placeholderView
        placeholderFrameBox = parityBoxInHost(placeholderView, placeholderView.frame, boxNode.view)
        const alignedRect = placeholderView.alignmentRectForFrame?.(placeholderView.frame)
        placeholderBox = alignedRect
          ? parityBoxInHost(placeholderView, alignedRect, boxNode.view)
          : placeholderFrameBox
      } catch {}
    }

    let text
    let textLineAdvances
    if (node.type === 'label') {
      const value = String(view?.stringValue ?? '')
      text = value.trim()
      textLineAdvances = measureTextLineAdvances(value, view?.font)
    } else if (node.type === 'button') {
      const value = String(view?.title ?? '')
      text = value.trim()
      textLineAdvances = measureTextLineAdvances(value, view?.font)
    } else if (node.type === 'textfield') {
      const value = String(view?.stringValue ?? '')
      text = value.trim()
      textLineAdvances = measureTextLineAdvances(value, view?.font)
    } else if (node.type === 'textview') {
      const value = String(view?.string ?? '')
      text = value.trim()
      textLineAdvances = measureTextLineAdvances(value, view?.font)
    }

    const placeholderAttributedString =
      node.type === 'textfield' ? view?.placeholderAttributedString : null

    const placeholder =
      node.type === 'textfield'
        ? String(placeholderAttributedString?.string ?? view?.placeholderString ?? '').trim()
        : node.type === 'textview'
          ? String(node.placeholderView?.stringValue ?? '').trim()
          : ''

    const placeholderColor =
      node.type === 'textfield'
        ? (placeholderAttributedString?.attributeAtIndexEffectiveRange?.(
            NSForegroundColorAttributeName,
            0,
            null,
          ) ?? NSColor.placeholderTextColor)
        : node.type === 'textview'
          ? node.placeholderView?.textColor
          : null

    const appearance = view?.effectiveAppearance ?? view?.window?.effectiveAppearance
    const placeholderStyle = placeholderColor
      ? {
          color: colorValue(placeholderColor, appearance),
          opacity: round(
            Number(withDrawingAppearance(appearance, () => placeholderColor.alphaComponent)),
          ),
        }
      : undefined

    const contentBox = textContentBox(node, boxNode)
    const textLineCount = measureTextLineCount(node)

    return {
      tag: String(node.type ?? 'view').toLowerCase(),
      id: node.props?.id || undefined,
      classes: nodeClasses(node),
      box,
      frameBox,
      placeholderBox,
      placeholderFrameBox,
      style: parityStyle(node, facets),
      text: text || undefined,
      textLineAdvances,
      placeholder: placeholder || undefined,
      placeholderStyle,
      contentBox,
      textLineCount,
    }
  }

  function measureParity(container: RootContainer, facets: readonly string[]) {
    const mountedNodes = [...appKitContainers].flatMap((entry) => [...entry.nodes.values()])
    const stage = mountedNodes.find((node) => node.props?.id === 'parity-stage')
    if (!stage?.view) {
      return null
    }

    // The stage can live in a sibling container (tab pane, popup, route host).
    const stageContainer: RootContainer = stage.container ?? container
    stageContainer.hostView.window?.contentView?.layoutSubtreeIfNeeded?.()
    stage.view.layoutSubtreeIfNeeded?.()

    const cells: Record<string, any> = {}
    for (const cell of stage.children.filter((node) => nodeClasses(node).includes('parity-cell'))) {
      const name = String(cell.props?.id ?? '').replace(/^cell-/, '')
      const box = descendants(cell).find((node) => nodeClasses(node).includes('parity-box'))
      if (!box?.view) {
        continue
      }

      box.view.layoutSubtreeIfNeeded?.()
      for (const scroll of descendants(box).filter(
        (node) => node.type === 'scrollview' && node.view,
      )) {
        const clip = scroll.view!.contentView
        const contentDocument = scroll.view!.documentView
        const y = Math.max(
          0,
          Number(contentDocument.bounds.size.height) - Number(clip.bounds.size.height),
        )

        clip.scrollToPoint({ x: 0, y })
        scroll.view!.reflectScrolledClipView(clip)
      }

      // Match the web dump's fixture-specific portal markers. Portals and
      // standalone surface roots do not descend from the fixture's box.
      const portalNodes = mountedNodes
        .filter((node) => nodeClasses(node).includes('parity-portal--' + name))
        .flatMap((node) => [node, ...descendants(node)])

      cells[name] = [...new Set([box, ...descendants(box), ...portalNodes])]
        .filter((node) => node.view)
        .map((node) => parityNode(node, box, facets))
    }

    return { target: 'macos', cells }
  }

  return { round, descendants, colorValue, measureParity }
}
