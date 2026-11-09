import { effectiveStyle } from './style-values.ts'
import type { NativeStyle } from './native-style'
import type { CssCascade } from './css-cascade'
import type { InputElements } from './input-elements'
import type { Layout } from './layout'
import type { Registry } from './registry'
import { FailureCollector } from './failures'
import type { Actions } from './actions'
import type { Accessibility } from './accessibility'
import type { Tree } from './tree'
import type { PropBag, ElementNode } from './model'
import {
  NSColor,
  NSTextField,
  NSView,
  NSTextAlignment,
  NSAccessibilityCustomAction,
  NSAttributedString,
  NSClickGestureRecognizer,
  NSFontAttributeName,
  NSForegroundColorAttributeName,
  NSKernAttributeName,
  NSLayoutManager,
  NSLineBreakMode,
  NSMutableParagraphStyle,
  NSParagraphStyleAttributeName,
  NSTextContainer,
  NSTextFieldCell,
  NSTextStorage,
  NativeClass,
} from '@octane-xplat/platform/macos'

import { nativeColor } from './native-colors'
import { parseHtmlText } from './html-text'
import { composeAttributedText } from './formatted-text'
import type { TextLinkRun } from './formatted-text'
import { resolveFont as fontForFamilyStyle } from './fonts'
import { configureGesture } from './gestures'
import { syncHeadingAccessibility } from './heading-accessibility.ts'
import { isPrimaryClickBoundary, shouldReceivePrimaryClick } from './primary-click'

export type AxLinkSlot = {
  action: NSAccessibilityCustomAction
  dispatch: (() => boolean) | null
}

interface Dependencies {
  nativeStyle: Pick<NativeStyle, 'setSizeConstraint' | 'fontForStyle' | 'syncNodeFont'>
  cssCascade: Pick<CssCascade, 'warnUnsupportedCssProp' | 'setNodeInlineStyle' | 'applyClassName'>
  inputElements: Pick<InputElements, 'DEFAULT_TEXT_LINE_HEIGHT_RATIO' | 'fitTextView'>
  layout: Pick<Layout, 'queueLayoutReconcile'>
  registry: Pick<Registry, 'cssNodesByView'>
  actions: Pick<Actions, 'hasHandler' | 'buttonActionTarget'>
  accessibility: Pick<Accessibility, 'applyAccessibility'>
  tree: Pick<Tree, 'detach'>
}

export type TextElements = ReturnType<typeof createTextElements>

export function createTextElements(deps: Dependencies) {
  /** Label cell carrying CSS padding — drawing insets by the edges and the
   *  measured size grows by them, so mason and manual hosts read one box.
   *  The insets live in labelPaddings: JS field initializers do not survive
   *  ObjC-side init paths like initTextCell, and ObjC exceptions crossing the
   *  bridge terminate the process. */
  const labelPaddings = new WeakMap<
    object,
    { top: number; left: number; bottom: number; right: number }
  >()

  const ZERO_PADDING = { top: 0, left: 0, bottom: 0, right: 0 }

  class PaddedLabelCell extends NSTextFieldCell {
    static {
      NativeClass(this)
    }

    private insets() {
      return labelPaddings.get(this.controlView) ?? labelPaddings.get(this) ?? ZERO_PADDING
    }

    drawingRectForBounds(bounds: any) {
      const pad = this.insets()

      return {
        origin: {
          x: bounds.origin.x + pad.left,
          y: bounds.origin.y + pad.top,
        },
        size: {
          width: Math.max(0, bounds.size.width - pad.left - pad.right),
          height: Math.max(0, bounds.size.height - pad.top - pad.bottom),
        },
      }
    }

    cellSizeForBounds(bounds: any) {
      const pad = this.insets()
      const inner = super.cellSizeForBounds({
        origin: bounds.origin,
        size: {
          width: Math.max(0, bounds.size.width - pad.left - pad.right),
          height: bounds.size.height,
        },
      })

      return {
        width: inner.width + pad.left + pad.right,
        height: inner.height + pad.top + pad.bottom,
      }
    }
  }

  function textContent(node: ElementNode): string {
    if (node.type === '#text') {
      return node.text
    }

    if (node.type === 'label') {
      return node.view!.stringValue
    }

    return node.children.map(textContent).join('')
  }

  // Keep the native value intact: AppKit truncates only when drawing in the frame.
  function syncLabelOverflow(node: ElementNode, style = effectiveStyle(node)) {
    const { maxLines } = node.props
    let { whiteSpace, textOverflow } = node.props

    if (whiteSpace != null && !['normal', 'nowrap'].includes(whiteSpace)) {
      throw new Error('[macos-host] label whiteSpace supports only normal and nowrap')
    }

    if (textOverflow != null && !['clip', 'ellipsis'].includes(textOverflow)) {
      throw new Error('[macos-host] label textOverflow supports only clip and ellipsis')
    }

    if (maxLines != null && (!Number.isInteger(maxLines) || maxLines < 0)) {
      throw new Error('[macos-host] label maxLines must be a non-negative integer')
    }

    // Explicit host props keep their existing contract. CSS supplies modes
    // when those props are absent, including inherited white-space.
    if (whiteSpace == null && style.whiteSpace != null) {
      if (['normal', 'nowrap'].includes(style.whiteSpace)) {
        whiteSpace = style.whiteSpace
      } else {
        deps.cssCascade.warnUnsupportedCssProp(node, 'whiteSpace')
      }
    }

    if (textOverflow == null && style.textOverflow != null) {
      if (['clip', 'ellipsis'].includes(style.textOverflow)) {
        textOverflow = style.textOverflow
      } else {
        deps.cssCascade.warnUnsupportedCssProp(node, 'textOverflow')
      }
    }

    const singleLine = whiteSpace === 'nowrap' || maxLines === 1
    const view = node.view as NSTextField

    view.maximumNumberOfLines = singleLine ? 1 : (maxLines ?? 0)
    view.cell.wraps = !singleLine
    view.cell.scrollable = false
    view.cell.usesSingleLineMode = singleLine
    view.cell.lineBreakMode = singleLine
      ? textOverflow === 'ellipsis'
        ? NSLineBreakMode.TruncatingTail
        : NSLineBreakMode.Clipping
      : NSLineBreakMode.WordWrapping

    view.cell.truncatesLastVisibleLine = !singleLine && textOverflow === 'ellipsis'
    view.invalidateIntrinsicContentSize()
    if (style.height == null) {
      if (singleLine && style.lineHeight == null) {
        const size = Number(view.font?.pointSize ?? 16)

        deps.nativeStyle.setSizeConstraint(
          node,
          'height',
          Math.ceil(size * deps.inputElements.DEFAULT_TEXT_LINE_HEIGHT_RATIO),
        )
      } else {
        // Wrapping text measures at Mason's available width; release an old
        // single-line pin after either prop or CSS mode removal.
        deps.nativeStyle.setSizeConstraint(node, 'height', undefined)
      }
    }
  }

  function syncHtmlView(node: ElementNode) {
    const view = node.view!

    view.attributedStringValue = parseHtmlText(node.props.html ?? '', {
      fontSize: Number(view.font.pointSize),
      fontFamily: String(view.font.familyName),
      fontWeight: node.appliedFontWeight ?? '400',
      color: view.textColor,
      appearance: view.effectiveAppearance,
      style: effectiveStyle(node),
    })

    view.invalidateIntrinsicContentSize()
    deps.layout.queueLayoutReconcile(node.container, node.parent)
  }

  function setLabelText(node: ElementNode, text: any) {
    const style = effectiveStyle(node)
    const lineHeight = Number(style.lineHeight)
    const decoration = String(style.textDecoration ?? '')
    const kern = Number(style.letterSpacing)
    const decorate = decoration.includes('underline') || decoration.includes('line-through')

    if (
      (!Number.isFinite(lineHeight) || lineHeight <= 0) &&
      !decorate &&
      (!Number.isFinite(kern) || kern === 0)
    ) {
      node.view!.stringValue = text
      if (node.props.accessibilityRole === 'heading') {
        syncHeadingAccessibility(node.view!, node.props)
      }

      return
    }

    const attributes: Record<string, any> = {
      [NSFontAttributeName]: node.view!.font,
      [NSForegroundColorAttributeName]: node.view!.textColor,
    }

    // AppKit ignores the control's paragraph properties for attributed values,
    // including strings attributed only for decoration or letter spacing.
    const paragraphStyle = NSMutableParagraphStyle.alloc().init()

    paragraphStyle.lineBreakMode = (node.view as NSTextField).cell.lineBreakMode
    paragraphStyle.alignment = node.view!.alignment
    attributes[NSParagraphStyleAttributeName] = paragraphStyle
    if (Number.isFinite(lineHeight) && lineHeight > 0) {
      paragraphStyle.minimumLineHeight = lineHeight
      paragraphStyle.maximumLineHeight = lineHeight
    }

    // macos-node-api publishes the AppKit attribute keys as globals (the same
    // lookup formatted-text.ts uses); the literals match AppKit's own values.
    const underlineKey = (globalThis as any).NSUnderlineStyleAttributeName ?? 'NSUnderline'
    const strikeKey = (globalThis as any).NSStrikethroughStyleAttributeName ?? 'NSStrikethrough'

    if (decoration.includes('underline')) {
      attributes[underlineKey] = 1
    }

    if (decoration.includes('line-through')) {
      attributes[strikeKey] = 1
    }

    if (Number.isFinite(kern) && kern !== 0) {
      attributes[NSKernAttributeName] = kern
    }

    node.view!.attributedStringValue = NSAttributedString.alloc().initWithStringAttributes(
      text,
      attributes,
    )

    if (node.props.accessibilityRole === 'heading') {
      syncHeadingAccessibility(node.view!, node.props)
    }
  }

  /** Character index under `point` (view coordinates) inside a label's drawn
   *  text — mirrors the cell's text rect, break mode and line cap so the tapped
   *  glyph maps back into the composed string. Points off every glyph rect
   *  (padding, line tails, empty space below the text) return null instead of
   *  the nearest character. */
  function textLinkCharacterIndex(
    view: NSTextField,
    point: { x: number; y: number },
  ): number | null {
    const text = view.attributedStringValue
    const cell = view.cell as NSTextFieldCell | undefined
    const bounds = view.bounds

    if (!text || Number(text.length ?? 0) === 0 || !cell || !bounds) {
      return null
    }

    const rect = cell.titleRectForBounds(bounds)
    const local = {
      x: point.x - Number(rect.origin?.x ?? 0),
      y: point.y - Number(rect.origin?.y ?? 0),
    }

    if (
      !Number.isFinite(local.x) ||
      !Number.isFinite(local.y) ||
      local.x < 0 ||
      local.y < 0 ||
      local.x > Number(rect.size?.width ?? 0) ||
      local.y > Number(rect.size?.height ?? 0)
    ) {
      return null
    }

    try {
      const container = NSTextContainer.alloc().initWithContainerSize(rect.size)

      container.lineFragmentPadding = 0
      container.lineBreakMode = cell.lineBreakMode
      container.maximumNumberOfLines = Number(view.maximumNumberOfLines ?? 0)

      const layout = NSLayoutManager.alloc().init()

      layout.addTextContainer(container)

      const storage = NSTextStorage.alloc().initWithAttributedString(text)

      storage.addLayoutManager(layout)

      const glyph = layout.glyphIndexForPointInTextContainer(local, container)

      if (!Number.isFinite(glyph) || glyph < 0 || glyph >= Number(layout.numberOfGlyphs)) {
        return null
      }

      // glyphIndexForPoint reports the nearest glyph even off its ink — require
      // the point inside that glyph's bounds so line tails and paragraph edges
      // cannot activate a link.
      const glyphRect = layout.boundingRectForGlyphRangeInTextContainer(
        { location: glyph, length: 1 },
        container,
      )

      if (
        local.x < Number(glyphRect.origin.x) ||
        local.y < Number(glyphRect.origin.y) ||
        local.x > Number(glyphRect.origin.x) + Number(glyphRect.size.width) ||
        local.y > Number(glyphRect.origin.y) + Number(glyphRect.size.height)
      ) {
        return null
      }

      const index = layout.characterIndexForGlyphAtIndex(glyph)

      return Number.isFinite(index) ? index : null
    } catch (error) {
      console.error('[macos-event] link hit-test failed', error)
      return null
    }
  }

  /** The primary-click gate shared by view taps and label link taps — a click
   *  only counts when the deepest hit view belongs to this node and no nearer
   *  interactive boundary owns the sequence. */
  function primaryClickBoundary(_node: ElementNode) {
    return (view: NSView) => {
      const target = deps.registry.cssNodesByView.get(view)

      return (
        target != null &&
        isPrimaryClickBoundary(
          target.type,
          target.props.accessibilityRole,
          deps.actions.hasHandler(view),
        )
      )
    }
  }

  // Native handler blocks cannot safely finalize during the bridge's GC sweep.
  // Retain action objects for the process, but give each node/view lifetime its
  // own slots. Sharing by link text redirects another live label's action.
  const axLinkActionPool = new Set<AxLinkSlot>()
  type TextLinkOwner = {
    node: ElementNode
    view: NSView
    active: boolean
    slots: Map<string, AxLinkSlot>
  }

  const linkOwners = new WeakMap<ElementNode, TextLinkOwner>()
  const linkOwnersByView = new WeakMap<object, TextLinkOwner>()

  function retireTextLinks(node: ElementNode) {
    const owner = linkOwners.get(node)

    linkOwners.delete(node)
    if (owner) {
      owner.active = false
      if (linkOwnersByView.get(owner.view) === owner) {
        linkOwnersByView.delete(owner.view)
      }

      for (const slot of owner.slots.values()) {
        slot.dispatch = null
      }
    }

    return owner
  }

  function axLinkActionSlot(name: string): AxLinkSlot {
    const slot: AxLinkSlot = {
      action: NSAccessibilityCustomAction.alloc().initWithNameHandler(name, () => {
        try {
          return slot.dispatch?.() ?? false
        } catch (error) {
          console.error('[macos-ax] link action failed', error)
          return false
        }
      }),
      dispatch: null,
    }

    axLinkActionPool.add(slot)
    return slot
  }

  /** Labels with folded link runs own one click recognizer; hits are resolved
   *  per glyph in `linkPressed` so a mixed paragraph never fires as one action. */
  function syncTextLinks(node: ElementNode) {
    if (node.lifecycle === 'disposing' || node.lifecycle === 'disposed') {
      return
    }

    const viewOwner = node.view ? linkOwnersByView.get(node.view) : undefined

    if (viewOwner && viewOwner.node !== node) {
      releaseTextLinkView(viewOwner.node)
    }

    const previous = linkOwners.get(node)

    if (previous && previous.view !== node.view) {
      releaseTextLinkView(node)
    }

    const active =
      node.type === 'label' &&
      (node.textLinks?.length ?? 0) > 0 &&
      node.props.disabled !== true &&
      node.props.isEnabled !== false &&
      node.props.enabled !== false

    if (active && !node.linkClickRecognizer && node.view) {
      node.linkClickRecognizer = configureGesture(
        NSClickGestureRecognizer.alloc().initWithTargetAction(
          deps.actions.buttonActionTarget,
          'linkPressed:',
        ),
        (event) => shouldReceivePrimaryClick(node.view, event, primaryClickBoundary(node)),
      )

      node.view.addGestureRecognizer(node.linkClickRecognizer)
    }

    if (node.linkClickRecognizer) {
      node.linkClickRecognizer.enabled = active
    }

    const view = node.view as NSTextField | undefined
    let owner = linkOwners.get(node)

    if (!view) {
      return
    }

    if (!owner) {
      owner = { node, view, active: true, slots: new Map() }
      linkOwners.set(node, owner)
      linkOwnersByView.set(view, owner)
    }

    const currentOwner = owner
    const links = active ? (node.textLinks ?? []) : []
    const string = String(view.attributedStringValue?.string ?? '')
    const slots = links.map((run, index) => {
      const name = `Open link ${string.substring(run.location, run.location + run.length)}`
      const key = `${index}:${name}`
      let slot = currentOwner.slots.get(key)

      if (!slot) {
        slot = axLinkActionSlot(name)
        currentOwner.slots.set(key, slot)
      }

      const currentSlot = slot
      const dispatch = () => {
        if (
          !currentOwner.active ||
          linkOwners.get(node) !== currentOwner ||
          linkOwnersByView.get(view) !== currentOwner ||
          node.view !== view ||
          currentSlot.dispatch !== dispatch ||
          node.lifecycle === 'disposing' ||
          node.lifecycle === 'disposed' ||
          node.props.disabled === true ||
          node.props.isEnabled === false ||
          node.props.enabled === false ||
          !node.container.root
        ) {
          return false
        }

        try {
          node.container.root.eventScope('discrete', run.handler)
        } catch (error) {
          console.error('[macos-ax] link action failed', error)
          return false
        }

        return true
      }

      slot.dispatch = dispatch
      return slot
    })

    for (const slot of currentOwner.slots.values()) {
      if (!slots.includes(slot)) {
        slot.dispatch = null
      }
    }

    view.accessibilityCustomActions = slots.map((slot) => slot.action)
  }

  function releaseTextLinkView(node: ElementNode) {
    const owner = retireTextLinks(node)
    const recognizer = node.linkClickRecognizer

    node.linkClickRecognizer = undefined

    const failures = new FailureCollector()

    if (recognizer) {
      failures.run('link disable', () => {
        recognizer.enabled = false
      })

      failures.run('link detach', () =>
        (owner?.view ?? node.view)?.removeGestureRecognizer(recognizer),
      )
    }

    if (owner) {
      failures.run('AX links', () => {
        if (!linkOwnersByView.has(owner.view)) {
          owner.view.accessibilityCustomActions = []
        }
      })
    }

    failures.throwIfFailed()
  }

  function disposeTextLinks(node: ElementNode) {
    node.textLinks = undefined
    releaseTextLinkView(node)
  }

  function syncText(parent: ElementNode | null | undefined) {
    while (parent && ['span', 'formattedstring'].includes(parent.type)) {
      parent = parent.parent
    }

    if (
      !parent ||
      !['label', 'button', 'textfield', 'textview', 'searchbar'].includes(parent.type)
    ) {
      return
    }

    const rich = parent.children.some(
      (child) => child.type === 'formattedstring' || child.type === 'span',
    )

    if (rich) {
      const view = parent.view!
      const links: TextLinkRun[] = []
      const attributed = composeAttributedText(
        parent.children,
        view,
        parent.props,
        fontForFamilyStyle,
        nativeColor,
        {
          fontFamily: parent.appliedFontFamily,
          fontSize: Number(view.font?.pointSize ?? (parent.type === 'label' ? 16 : 14)),
          fontWeight: parent.appliedFontWeight ?? 400,
          color: view.textColor,
          letterSpacing: (parent.computedStyle ?? parent.props.style ?? {}).letterSpacing,
          lineHeight: (parent.computedStyle ?? parent.props.style ?? {}).lineHeight,
        },
        links,
      )

      if (parent.type === 'button') {
        view.attributedTitle = attributed
      } else if (parent.type === 'textview') {
        view.textStorage.setAttributedString(attributed)
      } else {
        view.attributedStringValue = attributed
      }

      if (parent.type === 'label' && parent.props.accessibilityRole === 'heading') {
        syncHeadingAccessibility(view, parent.props)
      }

      parent.textLinks = parent.type === 'label' && links.length ? links : undefined
      syncTextLinks(parent)
      parent.formattedTextActive = true
      view.invalidateIntrinsicContentSize()
      if (parent.type === 'textview') {
        deps.inputElements.fitTextView(parent)
      }

      deps.layout.queueLayoutReconcile(parent.container, parent.parent)
      return
    }

    if (parent.type !== 'label' && !parent.formattedTextActive) {
      return
    }

    parent.formattedTextActive = false
    parent.textLinks = undefined
    syncTextLinks(parent)

    const text = parent.children.length
      ? parent.children.map(textContent).join('')
      : String(parent.props?.text ?? '')

    if (parent.type === 'label') {
      setLabelText(parent, text)
    } else if (parent.type === 'button') {
      parent.view!.title = text
    } else if (parent.type === 'textview') {
      parent.view!.string = text
    } else {
      parent.view!.stringValue = text
    }

    parent.view!.invalidateIntrinsicContentSize()
  }

  function makeLabel(): NSTextField {
    const label = NSTextField.alloc().initWithFrame({
      origin: { x: 0, y: 0 },
      size: { width: 400, height: 32 },
    })

    label.cell = PaddedLabelCell.alloc().initTextCell('')
    label.bezeled = false
    label.drawsBackground = false
    label.editable = false
    label.selectable = false
    label.alignment = NSTextAlignment.Left
    label.cell.wraps = true
    label.cell.usesSingleLineMode = false
    label.translatesAutoresizingMaskIntoConstraints = false
    label.font = deps.nativeStyle.fontForStyle(16)
    label.textColor = NSColor.labelColor
    // A disabled NSTextField reports AXUnknown; a label is static text.
    label.accessibilityRole = 'AXStaticText'
    return label
  }

  function applyBuiltinHtmlViewProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (name === 'html' || name === 'id') {
      return // parse once after all font/color sources reconcile
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'accessible' || name.startsWith('accessibility')) {
      deps.accessibility.applyAccessibility(node, name, value)
    } else if (name.startsWith('on') && value == null) {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored htmlview prop ' + name)
    }
  }

  function applyBuiltinLabelProp(node: ElementNode, name: string, value: PropBag[string]) {
    if (name === 'text') {
      setLabelText(node, String(value ?? ''))
    } else if (name === 'fontSize') {
      node.propFontSize = Number(value ?? 16)
      deps.nativeStyle.syncNodeFont(node)
    } else if (name === 'style') {
      deps.cssCascade.setNodeInlineStyle(node, value)
      syncText(node)
    } else if (name === 'className') {
      deps.cssCascade.applyClassName(node, value)
    } else if (name === 'id') {
      return
    } else if (['maxLines', 'whiteSpace', 'textOverflow'].includes(name)) {
      return
    } else if (name === 'accessible' || name.startsWith('accessibility')) {
      deps.accessibility.applyAccessibility(node, name, value)
    } else if (name.startsWith('on') && value == null) {
      return
    } else if (value !== undefined) {
      console.warn('[macos-host] ignored label prop ' + name)
    }
  }

  function disposeBuiltinFormattedText(node: ElementNode) {
    if (node.type === 'formattedstring' || node.type === 'span') {
      deps.tree.detach(node.container, node)
      for (const child of node.children.slice()) {
        deps.tree.detach(node.container, child)
      }
    }
  }

  return {
    labelPaddings,
    PaddedLabelCell,
    syncLabelOverflow,
    syncHtmlView,
    setLabelText,
    textLinkCharacterIndex,
    primaryClickBoundary,
    syncTextLinks,
    disposeTextLinks,
    syncText,
    makeLabel,
    applyBuiltinHtmlViewProp,
    applyBuiltinLabelProp,
    disposeBuiltinFormattedText,
  }
}
