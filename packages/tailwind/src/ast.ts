// Adapted from Tailwind CSS v4.3.5's PostCSS AST bridge (MIT).
// Copyright (c) Tailwind Labs, Inc. See THIRD_PARTY_NOTICES.
import postcss, { type ChildNode, type Input, type Root, type Source } from 'postcss'
import type { compileAst } from '@tailwindcss/node'

// The compiler exposes this union through its public parameter declaration.
export type TailwindAstNode = Parameters<typeof compileAst>[0][number]

type Location = NonNullable<TailwindAstNode['src']>
type Origin = Location[0]

/** Retain original PostCSS inputs so authored CSS maps survive compilation. */
export function toTailwindAst(root: Root): TailwindAstNode[] {
  const inputs = new Map<Input, Origin>()
  function location(node: ChildNode): Location | undefined {
    const source = node.source

    if (source?.start?.offset === undefined || source.end?.offset === undefined) {
      return
    }

    let origin = inputs.get(source.input)

    if (!origin) {
      origin = { file: source.input.file ?? source.input.id ?? null, code: source.input.css }
      inputs.set(source.input, origin)
    }

    return [origin, source.start.offset, source.end.offset]
  }

  function convert(node: ChildNode): TailwindAstNode[] {
    const src = location(node)

    if (node.type === 'decl') {
      return [
        {
          kind: 'declaration',
          property: node.prop,
          value: node.value,
          important: Boolean(node.important),
          src,
        },
      ]
    }

    if (node.type === 'rule') {
      return [{ kind: 'rule', selector: node.selector, nodes: node.nodes.flatMap(convert), src }]
    }

    if (node.type === 'atrule') {
      return [
        {
          kind: 'at-rule',
          name: `@${node.name}`,
          params: node.params,
          nodes: node.nodes?.flatMap(convert) ?? [],
          src,
        },
      ]
    }

    if (node.type === 'comment') {
      return node.text.startsWith('!') ? [{ kind: 'comment', value: node.text, src }] : []
    }

    node satisfies never
    throw new Error('Unsupported PostCSS node in Tailwind entry')
  }

  return root.nodes.flatMap(convert)
}

/** Reattach original source locations without serializing/reparsing CSS. */
export function fromTailwindAst(ast: TailwindAstNode[], source?: Source): Root {
  const inputs = new Map<Origin, Input>()
  function location(loc: TailwindAstNode['src']): Source | undefined {
    if (!loc) {
      return
    }

    const [origin, startOffset, endOffset] = loc
    let input = inputs.get(origin)

    if (!input) {
      input = new postcss.Input(origin.code, {
        from: origin.file ?? undefined,
        map: source?.input.map,
      })

      inputs.set(origin, input)
    }

    const start = input.fromOffset(startOffset)
    const end = input.fromOffset(endOffset)

    if (!start || !end) {
      throw new Error('Tailwind returned an invalid source location')
    }

    return {
      input,
      start: { line: start.line, column: start.col, offset: startOffset },
      end: { line: end.line, column: end.col, offset: endOffset },
    }
  }

  function convert(node: TailwindAstNode): ChildNode {
    let result: ChildNode

    if (node.kind === 'declaration') {
      result = postcss.decl({
        prop: node.property,
        value: node.value ?? '',
        important: node.important,
      })
    } else if (node.kind === 'rule') {
      result = postcss.rule({ selector: node.selector, nodes: node.nodes.map(convert) })
      result.raws.semicolon = true
    } else if (node.kind === 'at-rule') {
      result = postcss.atRule({ name: node.name.slice(1), params: node.params })
      if (node.nodes.length > 0) {
        result.append(node.nodes.map(convert))
      }

      result.raws.semicolon = true
    } else if (node.kind === 'comment') {
      result = postcss.comment({ text: node.value })
      result.raws.left = ''
      result.raws.right = ''
    } else {
      throw new Error(`Tailwind returned an unlowered ${node.kind} AST node`)
    }

    const origin = location(node.src)

    if (origin) {
      result.source = origin
    }

    return result
  }

  const root = postcss.root({ nodes: ast.map(convert) })

  if (source) {
    root.source = source
  }

  root.raws.indent = '  '
  return root
}
