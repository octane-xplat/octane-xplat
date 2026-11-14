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

const variants = {}
const launch = compileLaunchConstraints(stylesheetMediaQueries(), input.environment)

for (const colorScheme of ['light', 'dark']) {
  setStyleEnvironment(() => ({ ...input.environment, colorScheme }))
  refreshMediaQueries()

  const host = cssNode('masonview', {
    className: 'ns-root ' + (colorScheme === 'dark' ? 'ns-dark' : 'xds-light'),
  })

  const hostCascade = computeCascade(host)

  host.computedStyle = hostCascade.style
  host.computedCustomProps = hostCascade.customProps

  const cssNodes = nodes.map((node) => cssNode(node.kind, node.props))

  nodes.forEach((node, index) => {
    cssNodes[index].parent = node.parent === null ? host : cssNodes[node.parent]
    cssNodes[index].parent.children.push(cssNodes[index])
  })

  variants[colorScheme] = cssNodes.map((node, index) => {
    const result = computeCascade(node)

    node.computedStyle = result.style
    node.computedCustomProps = result.customProps
    if (result.animations.length) {
      throw new Error('Native startup producer: initial animations unsupported')
    }

    return {
      index,
      style: result.style,
      cssKeys: [...result.cssKeys],
      inheritedKeys: [...result.inheritedKeys],
    }
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
      variants,
      launch,
    },
    null,
    2,
  ),
)
