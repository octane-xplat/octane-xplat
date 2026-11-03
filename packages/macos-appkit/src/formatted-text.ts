/** Viewless text composition. No AppKit object is allocated for a logical node. */
interface TextNode {
  computedStyle?: Record<string, any>
  type: string
  props: Record<string, any>
  text: string
  children: TextNode[]
}

const TEXT_STYLE_KEYS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'textDecoration',
  'color',
  'backgroundColor',
  'letterSpacing',
] as const

export function validateTextStyle(props: Record<string, any>, color: (value: any) => any) {
  if (props.style != null && (typeof props.style !== 'object' || Array.isArray(props.style))) {
    throw new Error('AppKit formatted text expects a style object')
  }

  for (const source of [props, props.style ?? {}]) {
    if (source.fontSize != null && (!Number.isFinite(source.fontSize) || source.fontSize <= 0)) {
      throw new Error('AppKit formatted text fontSize must be positive and finite')
    }

    if (
      source.letterSpacing != null &&
      source.letterSpacing !== 'normal' &&
      !Number.isFinite(source.letterSpacing)
    ) {
      throw new Error('AppKit formatted text letterSpacing must be finite points or normal')
    }

    if (source.fontFamily != null && typeof source.fontFamily !== 'string') {
      throw new Error('AppKit formatted text fontFamily must be a string')
    }

    if (source.fontStyle != null && !['normal', 'italic', 'oblique'].includes(source.fontStyle)) {
      throw new Error('AppKit formatted text fontStyle supports normal, italic and oblique')
    }

    if (
      source.textDecoration != null &&
      ![
        'none',
        'underline',
        'line-through',
        'underline line-through',
        'line-through underline',
      ].includes(source.textDecoration)
    ) {
      throw new Error('AppKit formatted text has an unsupported textDecoration')
    }

    for (const key of ['color', 'backgroundColor']) {
      if (source[key] != null) {
        color(source[key])
      }
    }
  }
}

/** One activation entry inside a composed string — a character range plus the
 *  span's tap handler. The label hit-tests the tapped glyph against these. */
export interface TextLinkRun {
  location: number
  length: number
  handler: () => void
}

/** Fold inherited values without mutating authored props. Removed values fall
 * through to the ancestor; style wins over the direct property. `onLinkTap`
 * (or `onPress`) on a span activates every run it folds into, descendant runs
 * included — an inner span's own handler wins. */
export function textRuns(
  node: TextNode,
  inherited: Record<string, any> = {},
  link: (() => void) | null = null,
): Array<{ text: string; style: Record<string, any>; link: (() => void) | null }> {
  const style = { ...inherited }
  for (const key of TEXT_STYLE_KEYS) {
    const value = node.computedStyle?.[key] ?? node.props.style?.[key] ?? node.props[key]
    if (value != null) {
      style[key] = value
    }
  }

  const tap = node.props?.onLinkTap ?? node.props?.onPress
  if (typeof tap === 'function') {
    link = tap as () => void
  }

  const own =
    node.type === '#text'
      ? node.text
      : node.type === 'span'
        ? String(node.props.text ?? '')
            .replace('\\n', '\n')
            .replace('\\t', '\t')
        : ''

  return [
    ...(own ? [{ text: own, style, link }] : []),
    ...node.children.flatMap((child) => textRuns(child, style, link)),
  ]
}

/** Compose the folded runs into an attributed string. When `links` is given it
 *  is filled with the activation table (range + handler) for every run whose
 *  span carried a tap handler; those runs also get `NSLinkAttributeName` so
 *  the attributed string itself marks them as links for accessibility. */
export function composeAttributedText(
  children: TextNode[],
  view: any,
  props: Record<string, any>,
  font: (size: number, weight: number | string, family?: string) => any,
  color: (value: any) => any,
  defaults: Record<string, any>,
  links?: TextLinkRun[],
) {
  const native = globalThis as any
  const result = native.NSMutableAttributedString.alloc().initWithString('')
  const paragraph = native.NSMutableParagraphStyle.alloc().init()
  paragraph.alignment = view.alignment ?? 0
  paragraph.lineBreakMode = view.cell?.lineBreakMode ?? native.NSLineBreakMode.WordWrapping
  const lineHeight = Number(defaults.lineHeight ?? props.style?.lineHeight)
  if (Number.isFinite(lineHeight) && lineHeight > 0) {
    paragraph.minimumLineHeight = lineHeight
    paragraph.maximumLineHeight = lineHeight
  }

  let location = 0
  for (const run of children.flatMap((child) => textRuns(child, defaults))) {
    const style = run.style
    let face = font(style.fontSize, style.fontWeight, style.fontFamily)
    if (style.fontStyle === 'italic' || style.fontStyle === 'oblique') {
      face = native.NSFontManager.sharedFontManager.convertFontToHaveTrait(
        face,
        native.NSFontTraitMask.Italic,
      )
    }

    const attributes: Record<string, any> = {
      [native.NSFontAttributeName]: face,
      [native.NSParagraphStyleAttributeName]: paragraph,
    }

    if (typeof run.link === 'function') {
      // Synthetic scheme mirroring the GTK fold's octane-span:// URIs — the
      // index addresses the entry in `links`, never a navigable destination.
      const index = links?.length ?? 0
      links?.push({ location, length: run.text.length, handler: run.link })
      attributes[native.NSLinkAttributeName ?? 'NSLink'] = `octane-span://${index}`
    }

    if (style.color != null) {
      attributes[native.NSForegroundColorAttributeName] =
        typeof style.color === 'object' ? style.color : color(style.color)
    }

    if (style.backgroundColor != null) {
      attributes[native.NSBackgroundColorAttributeName] =
        typeof style.backgroundColor === 'object'
          ? style.backgroundColor
          : color(style.backgroundColor)
    }

    if (String(style.textDecoration).includes('underline')) {
      attributes[native.NSUnderlineStyleAttributeName] = 1
    }

    if (String(style.textDecoration).includes('line-through')) {
      attributes[native.NSStrikethroughStyleAttributeName] = 1
    }

    const kern = Number(style.letterSpacing)
    // Match plain labels: zero/normal reset inherited spacing by omitting
    // an explicit kern attribute on this newly constructed run.
    if (Number.isFinite(kern) && kern !== 0) {
      attributes[native.NSKernAttributeName] = kern
    }

    result.appendAttributedString(
      native.NSAttributedString.alloc().initWithStringAttributes(run.text, attributes),
    )
    location += run.text.length
  }

  return result
}
