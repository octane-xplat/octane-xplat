import { parseSync } from '@tsrx/oxc/parser'
import type { TweakInput, TweakValue } from '../protocol.ts'

// @tsrx/oxc is the toolchain's own parser: it handles .ts/.tsx/.tsrx alike and
// reports UTF-16 code-unit offsets, which is what string slicing and
// MagicString need — no byte-offset translation step.
export function parseSource(code: string, file: string) {
  const program = parseSync(file, code).program

  if (!program) {
    throw new Error(`tweaks: failed to parse ${file}`)
  }

  return program as unknown as EstreeNode
}

export interface EstreeNode {
  type: string
  start: number
  end: number
  [key: string]: unknown
}

export interface ExtractedTweak {
  id: string
  name: string
  group: string | null
  input: TweakInput
  /** Source literal when statically known, else null. */
  value: TweakValue | null
  writable: boolean
  reason?: string
  /** CallExpression range (for id injection / prod stripping). */
  call: { start: number; end: number }
  /** Value-argument range (for Save writeback). Only set when writable. */
  valueRange?: { start: number; end: number }
  /** Quote style of a string literal default (' or "). */
  quote?: string
  /** Raw source text of the value argument (prod replacement). */
  valueText: string
}

export interface ImportInfo {
  /** ImportDeclaration node for the tweaks import, if any. */
  declaration: EstreeNode | null
  /** Specifier node importing `useTweak` (for removal in prod). */
  specifier: EstreeNode | null
  /** Local names bound to `useTweak`. */
  localNames: Set<string>
}

export interface ExtractResult {
  tweaks: ExtractedTweak[]
  warnings: string[]
  imports: ImportInfo
}

const INPUT_TYPES = new Set(['number', 'boolean', 'string', 'color', 'select'])
const COLOR_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

function* walk(node: unknown): Generator<EstreeNode> {
  if (!node || typeof node !== 'object') {
    return
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      yield* walk(item)
    }

    return
  }

  const n = node as EstreeNode

  if (typeof n.type !== 'string') {
    return
  }

  yield n
  for (const key of Object.keys(n)) {
    if (key === 'start' || key === 'end' || key === 'loc' || key === 'range') {
      continue
    }

    yield* walk(n[key])
  }
}

interface LiteralValue {
  value: TweakValue
  range: { start: number; end: number }
  quote?: string
}

/** Writable iff: string literal (no template), numeric literal, -<numeric>, boolean literal. */
export function literalOf(node: EstreeNode | undefined): LiteralValue | null {
  if (!node) {
    return null
  }

  if (node.type === 'Literal') {
    const v = node.value

    if (typeof v === 'string') {
      const raw = String(node.raw ?? '')

      return {
        value: v,
        range: { start: node.start, end: node.end },
        quote: raw.startsWith("'") ? "'" : '"',
      }
    }

    if (typeof v === 'number' || typeof v === 'boolean') {
      return { value: v as TweakValue, range: { start: node.start, end: node.end } }
    }

    return null
  }

  if (
    node.type === 'UnaryExpression' &&
    node.operator === '-' &&
    (node.argument as EstreeNode).type === 'Literal' &&
    typeof (node.argument as EstreeNode).value === 'number'
  ) {
    return {
      value: -((node.argument as EstreeNode).value as number),
      range: { start: node.start, end: node.end },
    }
  }

  return null
}

function literalProperty(object: EstreeNode | undefined, key: string): EstreeNode | null {
  if (!object || object.type !== 'ObjectExpression') {
    return null
  }

  for (const prop of object.properties as EstreeNode[]) {
    if (prop.type !== 'Property') {
      return null
    }

    const k = prop.key as EstreeNode
    const name = k.type === 'Identifier' ? k.name : k.type === 'Literal' ? k.value : undefined

    if (name === key) {
      return prop.value as EstreeNode
    }
  }

  return null
}

function parseInput(node: EstreeNode | null | undefined): TweakInput | 'invalid' | null {
  if (!node) {
    return null
  }

  if (node.type !== 'ObjectExpression') {
    return 'invalid'
  }

  const typeNode = literalProperty(node, 'type')
  const type = typeNode?.type === 'Literal' ? typeNode.value : undefined

  if (typeof type !== 'string' || !INPUT_TYPES.has(type)) {
    return 'invalid'
  }

  const numberProp = (key: string) => {
    const lit = literalOf(literalProperty(node, key) ?? undefined)

    return typeof lit?.value === 'number' ? lit.value : undefined
  }

  switch (type) {
    case 'number':
      return { type, min: numberProp('min'), max: numberProp('max'), step: numberProp('step') }
    case 'boolean':
    case 'string':
    case 'color':
      return { type }
    case 'select': {
      const options = literalProperty(node, 'options')

      if (!options || options.type !== 'ArrayExpression') {
        return 'invalid'
      }

      const values: (string | number)[] = []

      for (const el of options.elements as (EstreeNode | null)[]) {
        const lit = el ? literalOf(el) : null

        if (!lit || typeof lit.value === 'boolean') {
          return 'invalid'
        }

        values.push(lit.value)
      }

      return { type, options: values }
    }
  }

  return 'invalid'
}

export function inferInput(value: TweakValue | null): TweakInput {
  if (typeof value === 'number') {
    return { type: 'number' }
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean' }
  }

  if (typeof value === 'string' && COLOR_RE.test(value)) {
    return { type: 'color' }
  }

  return { type: 'string' }
}

export function buildId(file: string, name: string, group: string | null): string {
  return `${file}#${group ? `${group}/` : ''}${name}`
}

// The plugin accepts the umbrella specifier too: `octane-xplat/tweaks` is the
// same runtime re-exported by the `octane-xplat` package.
const TWEAKS_IMPORT_SPECIFIERS = new Set(['@octane-xplat/tweaks', 'octane-xplat/tweaks'])

/**
 * Find every `useTweak(...)` call whose callee is a named/aliased import of
 * `useTweak` from `@octane-xplat/tweaks` (or the umbrella `octane-xplat/tweaks`).
 * Namespace imports are reported as a warning and left untouched (still
 * correct at runtime).
 */
export function extract(code: string, file: string): ExtractResult {
  const warnings: string[] = []
  const tweaks: ExtractedTweak[] = []
  const imports: ImportInfo = {
    declaration: null,
    specifier: null,
    localNames: new Set(),
  }

  const program = parseSource(code, file)
  const seenIds = new Set<string>()
  let namespaceImport = false

  for (const node of walk(program)) {
    if (
      node.type === 'ImportDeclaration' &&
      node.source &&
      TWEAKS_IMPORT_SPECIFIERS.has((node.source as EstreeNode).value as string)
    ) {
      for (const spec of (node.specifiers as EstreeNode[]) || []) {
        if (spec.type === 'ImportSpecifier') {
          const imported = spec.imported as EstreeNode
          const importedName = imported.type === 'Identifier' ? imported.name : imported.value

          if (importedName === 'useTweak') {
            imports.declaration = node
            imports.specifier = spec
            imports.localNames.add(String((spec.local as EstreeNode).name))
          }
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          namespaceImport = true
        }
      }
    }
  }

  if (namespaceImport) {
    warnings.push(
      `${file}: namespace import of tweaks is not instrumented (use a named useTweak import)`,
    )
  }

  if (!imports.localNames.size) {
    return { tweaks, warnings, imports }
  }

  for (const node of walk(program)) {
    if (node.type !== 'CallExpression') {
      continue
    }

    const callee = node.callee as EstreeNode

    if (callee.type !== 'Identifier' || !imports.localNames.has(String(callee.name))) {
      continue
    }

    const args = node.arguments as EstreeNode[]
    const valueArg = args[0]
    const literal = literalOf(valueArg)
    const value = literal?.value ?? null
    const valueText = valueArg ? code.slice(valueArg.start, valueArg.end) : 'undefined'

    // Options: must be an object literal with literal values.
    const optionsArg = args[1]
    let name: string | null = null
    let group: string | null = null
    let input: TweakInput | null = null

    if (optionsArg !== undefined) {
      if (optionsArg.type !== 'ObjectExpression') {
        warnings.push(`${file}: useTweak options must be an object literal; ignoring it`)
      } else {
        const nameLit = literalOf(literalProperty(optionsArg, 'name') ?? undefined)

        if (nameLit && typeof nameLit.value === 'string') {
          name = nameLit.value
        } else if (literalProperty(optionsArg, 'name')) {
          warnings.push(`${file}: useTweak options.name must be a string literal; ignoring it`)
        }

        const groupLit = literalOf(literalProperty(optionsArg, 'group') ?? undefined)

        if (groupLit && typeof groupLit.value === 'string') {
          group = groupLit.value
        } else if (literalProperty(optionsArg, 'group')) {
          warnings.push(`${file}: useTweak options.group must be a string literal; ignoring it`)
        }

        const parsed = parseInput(literalProperty(optionsArg, 'input'))

        if (parsed === 'invalid') {
          warnings.push(
            `${file}: useTweak options.input must be an object literal with literal values; inferring instead`,
          )
        } else {
          input = parsed
        }
      }
    }

    // Name: explicit options.name, else the const <ident> = useTweak(...) binding.
    if (name === null) {
      const parentDecl = findDeclarator(program, node)

      if (parentDecl) {
        name = String((parentDecl.id as EstreeNode).name)
      } else {
        warnings.push(
          `${file}: useTweak call has no options.name and is not assigned to a const; not instrumented`,
        )

        continue
      }
    }

    const id = buildId(file, name, group)

    if (seenIds.has(id)) {
      warnings.push(`${file}: duplicate tweak id ${id}; second call not instrumented`)
      continue
    }

    seenIds.add(id)

    tweaks.push({
      id,
      name,
      group,
      input: input ?? inferInput(value),
      value,
      writable: literal !== null,
      reason: literal === null ? 'value argument is not a literal' : undefined,
      call: { start: node.start, end: node.end },
      valueRange: literal?.range,
      quote: literal?.quote,
      valueText,
    })
  }

  return { tweaks, warnings, imports }
}

// Whether the call is the initializer of `const <ident> = useTweak(...)`.
function findDeclarator(program: EstreeNode, call: EstreeNode): EstreeNode | null {
  for (const node of walk(program)) {
    if (
      node.type === 'VariableDeclarator' &&
      node.init === call &&
      (node.id as EstreeNode).type === 'Identifier'
    ) {
      return node
    }
  }

  return null
}
