import {
  computeCascade,
  registerStylesheet,
  unregisterStylesheet,
  type CssHostNode,
} from '@octane-xplat/css-engine'

/** Source-level execution of the desktop cascade, without a native UI host. */
export function nativeOpacity(css: string, childClasses: string[], parentClasses?: string[]) {
  const id = 'tailwind-qualification'
  const node = (classes: string[], parent?: CssHostNode): CssHostNode => ({
    cssType: 'masonview',
    cssClasses: new Set(classes),
    cssPseudoClasses: new Set(),
    parent,
    props: {},
  })
  registerStylesheet(id, css)
  try {
    const parent = parentClasses ? node(parentClasses) : undefined
    if (parent) {
      const computed = computeCascade(parent)
      parent.computedStyle = computed.style
      parent.computedCustomProps = computed.customProps
    }
    return String(computeCascade(node(childClasses, parent)).style.opacity)
  } finally {
    unregisterStylesheet(id)
  }
}
