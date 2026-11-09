import postcss, { type Declaration, type Input, type Node, type Root } from 'postcss'
import nesting from 'postcss-nesting'
import valueParser from 'postcss-value-parser'
import type { TailwindTarget } from './target.ts'

type NativeTarget = Exclude<TailwindTarget, 'web' | 'linux'>

// This is the candidate compiler surface, not a filter over app CSS. Unknown
// generated properties fail rather than disappear. Grow it with host evidence.
const properties = new Set([
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'flex',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'flex-direction',
  'flex-wrap',
  'align-items',
  'align-self',
  'align-content',
  'justify-content',
  'justify-self',
  'justify-items',
  'gap',
  'row-gap',
  'column-gap',
  'order',
  'grid-template-columns',
  'grid-template-rows',
  'grid-auto-columns',
  'grid-auto-rows',
  'grid-auto-flow',
  'grid-column',
  'grid-row',
  'grid-column-start',
  'grid-column-end',
  'grid-row-start',
  'grid-row-end',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'border-width',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-style',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'background-color',
  'color',
  'opacity',
  'visibility',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'text-align',
])

const symmetricLogical = new Map([
  ['padding-inline', ['padding-left', 'padding-right']],
  ['padding-block', ['padding-top', 'padding-bottom']],
  ['margin-inline', ['margin-left', 'margin-right']],
  ['margin-block', ['margin-top', 'margin-bottom']],
])

const gridTracks = new Set([
  'grid-template-columns',
  'grid-template-rows',
  'grid-auto-columns',
  'grid-auto-rows',
])

function selector(node: Node): string {
  for (let cursor: Node | undefined = node; cursor; cursor = cursor.parent) {
    if ('selector' in cursor && typeof cursor.selector === 'string') {
      return cursor.selector
    }
  }

  return '@stylesheet'
}

function generatedOutput() {
  const inputs = new Map<Input, Array<{ start: number; end: number }>>()

  return (node: Node): boolean => {
    const source = node.source

    if (!source) {
      return true
    }

    let ranges = inputs.get(source.input)

    if (!ranges) {
      const found: Array<{ start: number; end: number }> = []
      const original = postcss.parse(source.input.css, { from: source.input.file })

      original.walkAtRules(/^(theme|tailwind|utility|apply|variant|custom-variant)$/, (rule) => {
        const start = rule.source?.start?.offset
        const end = rule.source?.end?.offset

        if (start !== undefined && end !== undefined) {
          found.push({ start, end })
        }
      })

      ranges = found
      inputs.set(source.input, ranges)
    }

    const offset = source.start?.offset

    return offset !== undefined && ranges.some(({ start, end }) => offset >= start && offset <= end)
  }
}

function fail(root: Root, node: Node, target: NativeTarget, detail: string): never {
  throw (node.source ? node : root).error(`[${target}] Tailwind ${selector(node)}: ${detail}`, {
    plugin: 'xplat-tailwind',
  })
}

function checkValue(root: Root, declaration: Declaration, target: NativeTarget) {
  const parsed = valueParser(declaration.value)

  parsed.walk((node) => {
    if (node.type === 'function' && node.value.toLowerCase() === 'calc') {
      let percentage = false
      let length = false

      valueParser.walk(node.nodes, (part) => {
        if (part.type !== 'word') {
          return
        }

        const dimension = valueParser.unit(part.value)

        if (dimension) {
          const unit = dimension.unit.toLowerCase()

          percentage ||= unit === '%'
          length ||= unit === 'px' || unit === 'dip'
        }
      })

      if (percentage && length) {
        fail(
          root,
          declaration,
          target,
          `${declaration.prop}: ${declaration.value} uses mixed percentage/length math requiring unsupported native layout context`,
        )
      }
    }

    if (
      node.type === 'function' &&
      !['var', 'calc', 'repeat', 'minmax', 'rgb', 'rgba', 'hsl', 'hsla'].includes(
        node.value.toLowerCase(),
      )
    ) {
      fail(
        root,
        declaration,
        target,
        `${declaration.prop}: ${declaration.value} uses unsupported ${node.value}()`,
      )
    }

    if (
      node.type === 'word' &&
      !node.value.startsWith('--') &&
      /(?:\d|\.)(?:rem|em|vh|vw|vmin|vmax|svh|dvh|lvh|svw|dvw|lvw)\b/i.test(node.value)
    ) {
      fail(
        root,
        declaration,
        target,
        `${declaration.prop}: ${declaration.value} uses a relative unit not implemented by this native adapter; use shared px theme tokens`,
      )
    }

    if (node.type === 'word' && /\binfinity\b/i.test(node.value)) {
      fail(
        root,
        declaration,
        target,
        `${declaration.prop}: ${declaration.value} needs native infinite-length support`,
      )
    }

    if (node.type === 'word') {
      const dimension = valueParser.unit(node.value)

      if (!dimension) {
        return
      }

      const unit = dimension.unit.toLowerCase()
      const gridFraction =
        unit === 'fr' && (gridTracks.has(declaration.prop) || declaration.prop.startsWith('--'))

      if (!['', 'px', 'dip', '%'].includes(unit) && !gridFraction) {
        fail(
          root,
          declaration,
          target,
          `${declaration.prop}: ${declaration.value} uses unit ${unit} outside the native utility contract`,
        )
      }
    }
  })
}

/** Adapt compiler output without stripping declarations from authored app CSS. */
export async function adaptNativeStylesheet(root: Root, target: NativeTarget): Promise<void> {
  const compilerOwned = generatedOutput()

  if (target === 'windows' || target === 'native') {
    fail(
      root,
      root,
      target,
      'select a qualified concrete native host; this host adapter is not ready',
    )
  }

  const lowered = await postcss([nesting()]).process(root.clone(), {
    from: root.source?.input.file,
    map: false,
  })

  if (lowered.root.type !== 'root') {
    throw root.error('Expected a native stylesheet')
  }

  root.removeAll().append(lowered.root.nodes)

  root.walkAtRules((rule) => {
    if (!compilerOwned(rule)) {
      return
    }

    if (rule.name === 'layer') {
      return
    }

    if (rule.name !== 'media') {
      fail(
        root,
        rule,
        target,
        `@${rule.name} ${rule.params} is not supported by the native adapter`,
      )
    }

    rule.params = rule.params.replace(
      /\(\s*(width|height)\s*(>=|<=)\s*([\d.]+px)\s*\)/g,
      (_match, axis: string, operator: string, length: string) =>
        `(${operator === '>=' ? 'min' : 'max'}-${axis}: ${length})`,
    )

    if (
      !/^(?:\s*\((?:min-|max-)?(?:width|height):\s*[\d.]+px\)|\s*\(prefers-color-scheme:\s*(?:dark|light)\)|\s*\(orientation:\s*(?:portrait|landscape)\)|\s*(?:and|screen|all)\s*)+$/.test(
        rule.params,
      )
    ) {
      fail(root, rule, target, `@media ${rule.params} cannot be preserved on this host`)
    }
  })

  root.walkRules((rule) => {
    if (!compilerOwned(rule)) {
      return
    }

    if (rule.selectors.every((item) => item === ':root' || item === ':host')) {
      rule.selector = '.ns-root, .ns-modal'
      return
    }

    const unescaped = rule.selector.replace(/\\./g, '')

    if (/[:[\]&]/.test(unescaped)) {
      fail(root, rule, target, 'selector needs native qualification')
    }
  })

  root.walkDecls((declaration) => {
    if (compilerOwned(declaration)) {
      for (
        let ancestor: Node | undefined = declaration.parent;
        ancestor;
        ancestor = ancestor.parent
      ) {
        if (
          'name' in ancestor &&
          typeof ancestor.name === 'string' &&
          !['layer', 'media'].includes(ancestor.name)
        ) {
          fail(
            root,
            declaration,
            target,
            `${declaration.prop}: ${declaration.value} is gated by unsupported @${ancestor.name}`,
          )
        }
      }

      if (declaration.important) {
        fail(
          root,
          declaration,
          target,
          `${declaration.prop}: ${declaration.value} !important needs native cascade support`,
        )
      }

      if (
        !declaration.prop.startsWith('--') &&
        !properties.has(declaration.prop) &&
        !symmetricLogical.has(declaration.prop)
      ) {
        fail(
          root,
          declaration,
          target,
          `${declaration.prop}: ${declaration.value} is outside the native utility contract`,
        )
      }

      checkValue(root, declaration, target)
      if (declaration.prop === 'opacity' && /^-?(?:\d*\.)?\d+%$/.test(declaration.value)) {
        declaration.value = String(
          Math.max(0, Math.min(1, Number.parseFloat(declaration.value) / 100)),
        )
      }

      if (declaration.prop === 'display' && !['flex', 'grid', 'none'].includes(declaration.value)) {
        fail(
          root,
          declaration,
          target,
          `display: ${declaration.value} is not a supported Mason layout mode`,
        )
      }

      if (
        declaration.prop === 'position' &&
        !['relative', 'absolute'].includes(declaration.value)
      ) {
        fail(
          root,
          declaration,
          target,
          `position: ${declaration.value} is not supported by this host`,
        )
      }

      const physical = symmetricLogical.get(declaration.prop)

      if (physical) {
        const values = valueParser(declaration.value).nodes.filter(
          (node) => node.type !== 'space' && node.type !== 'comment',
        )

        if (values.length !== 1) {
          fail(
            root,
            declaration,
            target,
            `${declaration.prop}: ${declaration.value} requires direction-aware logical edges`,
          )
        }

        for (const property of physical) {
          declaration.cloneBefore({ prop: property })
        }

        declaration.remove()
      }
    }
  })

  // Match Xplat's shared px/DIP contract after compilation as well as before
  // it. Existing native finalizers see DIP and do not convert a second time.
  root.walkDecls((declaration) => {
    const parsed = valueParser(declaration.value)

    parsed.walk((node) => {
      if (node.type === 'function' && node.value.toLowerCase() === 'url') {
        return false
      }

      if (node.type === 'word' && /^-?(?:\d*\.)?\d+px$/i.test(node.value)) {
        node.value = node.value.slice(0, -2) + 'dip'
      }
    })

    declaration.value = parsed.toString()
  })
}
