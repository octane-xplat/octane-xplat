import {
  NSLayoutManager,
  NSTextContainer,
  NSTextStorage,
  type NSTextField,
  type NSTextFieldCell,
} from '@octane-xplat/platform/macos'

/** Character index under `point` (view coordinates) inside a label's drawn
 *  text — mirrors the cell's text rect, break mode and line cap so the tapped
 *  glyph maps back into the composed string. Points off every glyph rect
 *  (padding, line tails, empty space below the text) return null instead of
 *  the nearest character. */
export function textLinkCharacterIndex(
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
