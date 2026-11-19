import { readFileSync, writeFileSync } from 'node:fs'
import { compileLaunchConstraints } from './launch-constraints.mjs'
import {
  computeCascade,
  registerStylesheet,
  setStyleEnvironment,
  refreshMediaQueries,
  stylesheetMediaQueries,
} from '@octane-xplat/css-engine'

const input = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const nodes = JSON.parse(readFileSync(input.tree, 'utf8')).nodes

for (const sheet of input.sheets) {
  registerStylesheet(sheet.id, sheet.css)
}

function cssNode(kind, props) {
  return {
    cssType: kind,
    props,
    id: props.id,
    cssClasses: new Set((props.className ?? '').split(/\s+/).filter(Boolean)),
    cssPseudoClasses: new Set(),
    parent: null,
    children: [],
    getChildIndex(child) {
      return this.children.indexOf(child)
    },
    getChildAt(index) {
      return this.children[index]
    },
    getChildrenCount() {
      return this.children.length
    },
  }
}

// The nativescript-octane driver writes local styles on every scrollview:
// applyMasonDefaults at creation, then the inline `style` prop, then the
// `orientation` prop (applyMasonContainerProp). Local writes outrank CSS;
// inline keys keep the cascade's normalized values.
function scrollviewStyle(props, style) {
  const horizontal = props.orientation === 'horizontal'
  const orientation = {
    flexDirection: horizontal ? 'row' : 'column',
    overflowX: horizontal ? 'scroll' : 'hidden',
    overflowY: horizontal ? 'hidden' : 'scroll',
  }
  const inline = Object.keys(props.style ?? {}).filter((key) => key in style)
  return {
    ...style,
    display: 'flex',
    ...orientation,
    ...Object.fromEntries(inline.map((key) => [key, style[key]])),
    ...(props.orientation === undefined ? {} : orientation),
  }
}

// A placeholder mounts an empty box: only authored box geometry survives into
// the startup tree. Every other resolved key is dropped and reported.
const PLACEHOLDER_BOX_KEYS = new Set([
  'alignSelf',
  'flexGrow',
  'flexShrink',
  'height',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'width',
])
const droppedPlaceholderStyles = new Map()

const launch = compileLaunchConstraints(stylesheetMediaQueries(), input.environment, {
  consumesSafeAreaInsets: input.consumesSafeAreaInsets === true,
})

// One rendered tree resolves exactly one scheme variant: the producer runs
// this worker once per bind+scheme point so trees may diverge in topology.
const colorScheme = input.colorScheme
if (colorScheme !== 'light' && colorScheme !== 'dark') {
  throw new Error('Native startup cascade requires colorScheme light|dark')
}
let variant
{
  setStyleEnvironment(() => ({ ...input.environment, colorScheme }))
  refreshMediaQueries()

  const host = cssNode('masonview', {
    className: 'ns-root ' + (colorScheme === 'dark' ? 'ns-dark' : 'xds-light'),
  })

  const hostCascade = computeCascade(host)

  host.computedStyle = hostCascade.style
  host.computedCustomProps = hostCascade.customProps

  // Placeholders keep their logical kind so CSS matching sees the real host
  // type the live tree will create.
  const cssNodes = nodes.map((node) => cssNode(node.hostKind ?? node.kind, node.props))

  nodes.forEach((node, index) => {
    cssNodes[index].parent = node.parent === null ? host : cssNodes[node.parent]
    cssNodes[index].parent.children.push(cssNodes[index])
  })

  variant = cssNodes.map((node, index) => {
    const result = computeCascade(node)

    node.computedStyle = result.style
    node.computedCustomProps = result.customProps
    // A placeholder is replaced by its live native host during hydration, so
    // its authored animation never needs a cold-mount equivalent.
    if (result.animations.length && nodes[index].kind !== 'placeholder') {
      throw new Error('Native startup producer: initial animations unsupported')
    }

    let style =
      nodes[index].kind === 'scrollview'
        ? scrollviewStyle(nodes[index].props, result.style)
        : result.style
    // The IR only carries #hex and rgba() colors. CSS `transparent` is the
    // driver's rgba(0,0,0,0), so fold the keyword before backend validation.
    for (const key of ['color', 'backgroundColor']) {
      if (style[key] === 'transparent') {style = { ...style, [key]: 'rgba(0, 0, 0, 0)' }}
    }
    let cssKeys = [...result.cssKeys]
    let inheritedKeys = [...result.inheritedKeys]

    // `text-decoration: none` is the property's initial value; the startup
    // mounts never paint a decoration, so the declaration is a no-op. Drop it
    // (and its provenance) instead of widening the style subset for a reset
    // rule. Any painted value still fails backend validation loudly.
    if (style.textDecoration === 'none') {
      const { textDecoration: _dropped, ...kept } = style
      style = kept
      cssKeys = cssKeys.filter((key) => key !== 'textDecoration')
      inheritedKeys = inheritedKeys.filter((key) => key !== 'textDecoration')
    }

    if (nodes[index].kind === 'placeholder') {
      if (typeof style.width !== 'number' || typeof style.height !== 'number') {
        throw new Error(
          `Native startup producer: placeholder size not authored for ${nodes[index].hostKind} at ${nodes[index].path}`,
        )
      }
      const kept = {}
      const dropped = droppedPlaceholderStyles.get(index) ?? new Set()
      for (const key of Object.keys(style)) {
        if (PLACEHOLDER_BOX_KEYS.has(key)) {kept[key] = style[key]}
        else {dropped.add(key)}
      }
      droppedPlaceholderStyles.set(index, dropped)
      style = kept
      // Provenance requires every cssKeys entry to name a surviving key.
      cssKeys = cssKeys.filter((key) => key in kept)
      inheritedKeys = inheritedKeys.filter((key) => key in kept)
    }

    return { index, style, cssKeys, inheritedKeys }
  })
}

writeFileSync(
  input.output,
  JSON.stringify(
    {
      scope:
        'Configured startup visual tree and portable AOT cascade; experimental only; no native parity claim',
      seed: input.seed,
      nodes,
      variant,
      launch,
      placeholders: nodes.flatMap((node, index) =>
        node.kind === 'placeholder'
          ? [
              {
                path: node.path,
                hostKind: node.hostKind,
                droppedStyles: [...(droppedPlaceholderStyles.get(index) ?? [])].sort(),
              },
            ]
          : [],
      ),
    },
    null,
    2,
  ),
)
