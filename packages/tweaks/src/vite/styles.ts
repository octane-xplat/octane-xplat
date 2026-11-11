// Style-site extraction (bamboo css() + inline JSX style={}) and the
// property-level writeback used by Save. All offsets are UTF-16 code units,
// like tweak extraction.
import type { StyleDraft, StyleEntry, StyleProperty, StyleValue } from '../protocol.ts'
import { parseSource, type EstreeNode, literalOf } from './extract.ts'

export interface StyleSite {
  entry: StyleEntry
  // Whole ObjectExpression node — replacement target for re-extraction.
  object: EstreeNode
  // For inline sites: the wrapping JSX attribute expression `{…}` range.
  attribute?: EstreeNode
  // Enclosing component's body node — transform injects the hook after `{`.
  componentBody?: EstreeNode
  // For bamboo sites: the whole `css(...)` CallExpression (wrap target).
  call?: EstreeNode
  // Property nodes by path.join('.').
  propNodes: Map<string, { key: EstreeNode; value: EstreeNode; prop: EstreeNode }>
}

const BAMBOO_CSS_DEFAULT = /(^|\/)styled-system\/css(\.[mc]?[jt]s)?$/

function* walk(node: unknown, parent?: EstreeNode): Generator<EstreeNode> {
  if (!node || typeof node !== 'object') {
    return
  }

  const n = node as EstreeNode

  if (parent) {
    n.parent = parent
  }

  if (n.type) {
    yield n
  }

  for (const key of Object.keys(n)) {
    if (key === 'parent') {
      continue
    }

    const child = (n as Record<string, unknown>)[key]

    if (Array.isArray(child)) {
      for (const c of child) {
        yield* walk(c, n)
      }
    } else {
      yield* walk(child, n)
    }
  }
}

function propName(k: EstreeNode | undefined): string | null {
  if (!k) {
    return null
  }

  if (k.type === 'Identifier' || k.type === 'JSXIdentifier') {
    return k.name as string
  }

  if (k.type === 'Literal') {
    return String(k.value)
  }

  if (k.type === 'JSXMemberExpression') {
    const o = propName(k.object as EstreeNode)
    const p = propName(k.property as EstreeNode)

    return o && p ? `${o}.${p}` : (o ?? p)
  }

  return null
}

// Flatten an ObjectExpression into properties; null when the object contains
// anything unwritable (spread, computed, method, duplicate keys).
export function flattenObject(
  obj: EstreeNode,
  nested: boolean,
): { props: StyleProperty[]; reason?: string } {
  const props: StyleProperty[] = []
  const seen = new Set<string>()
  const reason = 'spread/computed/method/duplicate key'
  function rec(o: EstreeNode, base: string[]): boolean {
    for (const p of (o.properties as EstreeNode[]) ?? []) {
      if (p.type !== 'Property' || p.computed || p.method) {
        return false
      }

      const name = propName(p.key as EstreeNode)

      if (!name) {
        return false
      }

      const path = [...base, name]
      const key = path.join('.')

      if (seen.has(key)) {
        return false
      }

      seen.add(key)

      const v = p.value as EstreeNode

      if (nested && v.type === 'ObjectExpression') {
        if (!rec(v, path)) {
          return false
        }

        continue
      }

      const lit = literalOf(v)
      const val =
        (lit && typeof lit.value === 'string') || typeof lit?.value === 'number' ? lit.value : null

      props.push({ path, value: val, editable: val !== null })
    }

    return true
  }

  return rec(obj, []) ? { props } : { props: [], reason }
}

function collectPropNodes(obj: EstreeNode, map: StyleSite['propNodes'], base: string[] = []) {
  for (const p of (obj.properties as EstreeNode[]) ?? []) {
    if (p.type !== 'Property' || p.computed) {
      continue
    }

    const name = propName(p.key as EstreeNode)

    if (!name) {
      continue
    }

    const path = [...base, name]

    map.set(path.join('.'), { key: p.key as EstreeNode, value: p.value as EstreeNode, prop: p })
    if ((p.value as EstreeNode).type === 'ObjectExpression') {
      collectPropNodes(p.value as EstreeNode, map, path)
    }
  }
}

function lineOf(code: string, offset: number): number {
  let n = 1

  for (let i = 0; i < offset; i++) {
    if (code[i] === '\n') {
      n++
    }
  }

  return n
}

function enclosingComponent(node: EstreeNode): { name: string; body: EstreeNode } | null {
  let cur = node.parent as EstreeNode | undefined

  while (cur) {
    if (
      cur.type === 'FunctionDeclaration' ||
      cur.type === 'FunctionExpression' ||
      cur.type === 'ArrowFunctionExpression'
    ) {
      const id = (cur as Record<string, unknown>).id as EstreeNode | undefined
      const name = id?.name as string | undefined
      // tsrx `@{` components parse as functions; infer name via declarator parent.
      const inferred =
        name ??
        (((cur.parent as EstreeNode | undefined)?.type === 'VariableDeclarator'
          ? ((cur.parent as EstreeNode).id as EstreeNode)?.name
          : undefined) as string | undefined)

      if (inferred && /^[A-Z]/.test(inferred)) {
        return { name: inferred, body: cur.body as EstreeNode }
      }

      if (inferred && !/^[A-Z]/.test(inferred)) {
        return null
      }
    }

    cur = cur.parent as EstreeNode | undefined
  }

  return null
}

export interface ExtractStylesResult {
  sites: StyleSite[]
  cssImport: boolean // file has a bamboo css() import (for transform context)
}

export function extractStyles(
  code: string,
  file: string,
  opts: { bambooCssModules?: RegExp } = {},
): ExtractStylesResult {
  const program = parseSource(code, file)
  const matcher = opts.bambooCssModules ?? BAMBOO_CSS_DEFAULT
  const cssNames = new Set<string>()
  const sites: StyleSite[] = []
  const seen = new Set<string>()
  let bambooN = 0
  const inlineByComponent = new Map<string, number>()

  // Collect css() import specifiers first.
  for (const n of walk(program)) {
    if (
      n.type === 'ImportDeclaration' &&
      matcher.test(String((n.source as EstreeNode | undefined)?.value))
    ) {
      for (const sp of (n.specifiers as EstreeNode[]) ?? []) {
        const imported = sp.type === 'ImportSpecifier' ? propName(sp.imported as EstreeNode) : null

        if (imported === 'css') {
          cssNames.add((sp.local as EstreeNode).name as string)
        }
      }
    }
  }

  for (const n of walk(program)) {
    // Bamboo site: css(<ObjectExpression>)
    if (n.type === 'CallExpression' && cssNames.size) {
      const callee = n.callee as EstreeNode

      if (callee.type === 'Identifier' && cssNames.has(callee.name as string)) {
        bambooN++

        const args = (n.arguments as EstreeNode[]) ?? []
        const site = bambooSite(code, file, n, args, bambooN, sites)

        if (site) {
          sites.push(site)
        }
      }
    }

    // Inline site: JSXAttribute style={<ObjectExpression>}
    if (n.type === 'JSXAttribute' && propName(n.name as EstreeNode) === 'style') {
      const expr = n.value as EstreeNode
      const inner = expr?.type === 'JSXExpressionContainer' ? (expr.expression as EstreeNode) : expr

      if (inner?.type !== 'ObjectExpression') {
        continue
      }

      const comp = enclosingComponent(n)

      if (!comp) {
        continue
      }

      const count = (inlineByComponent.get(comp.name) ?? 0) + 1

      inlineByComponent.set(comp.name, count)

      const elName = propName((n.parent as EstreeNode)?.name as EstreeNode) ?? 'element'
      const label = `${elName} in ${comp.name}`
      const id = `${file}#style:${comp.name}/${elName}:${count}`

      if (seen.has(id)) {
        continue
      }

      seen.add(id)

      const { props, reason } = flattenObject(inner, false)
      const propNodes: StyleSite['propNodes'] = new Map()

      collectPropNodes(inner, propNodes)
      sites.push({
        entry: {
          id,
          kind: 'inline',
          file,
          line: lineOf(code, inner.start ?? 0),
          label,
          properties: props,
          writable: !reason,
          reason,
        },
        object: inner,
        attribute: expr,
        componentBody: comp.body,
        propNodes,
      })
    }
  }

  return { sites, cssImport: cssNames.size > 0 }
}

function bambooSite(
  code: string,
  file: string,
  call: EstreeNode,
  args: EstreeNode[],
  n: number,
  _sites: StyleSite[],
): StyleSite | null {
  if (args.length !== 1) {
    // Several arguments → read-only listing. Label still best-effort.
    const id = `${file}#css:css #${n}`

    return {
      entry: {
        id,
        kind: 'bamboo',
        file,
        line: lineOf(code, call.start ?? 0),
        label: `css #${n}`,
        properties: [],
        writable: false,
        reason: 'multiple arguments',
      },
      object: call,
      call,
      propNodes: new Map(),
    }
  }

  const obj = args[0]

  if (obj.type !== 'ObjectExpression') {
    const id = `${file}#css:css #${n}`

    return {
      entry: {
        id,
        kind: 'bamboo',
        file,
        line: lineOf(code, call.start ?? 0),
        label: `css #${n}`,
        properties: [],
        writable: false,
        reason: 'non-literal argument',
      },
      object: call,
      call,
      propNodes: new Map(),
    }
  }

  // Label: object-literal key when the call is a property value, else const name.
  let label: string | null = null
  const parent = call.parent as EstreeNode | undefined

  if (parent?.type === 'Property') {
    label = propName(parent.key as EstreeNode)
  } else if (parent?.type === 'VariableDeclarator') {
    label = (parent.id as EstreeNode)?.name as string
  }

  label ??= `css #${n}`

  const id = `${file}#css:${label}`
  const { props, reason } = flattenObject(obj, true)
  const propNodes: StyleSite['propNodes'] = new Map()

  collectPropNodes(obj, propNodes)
  return {
    entry: {
      id,
      kind: 'bamboo',
      file,
      line: lineOf(code, obj.start ?? 0),
      label,
      properties: props,
      writable: !reason,
      reason,
    },
    object: obj,
    call,
    propNodes,
  }
}
