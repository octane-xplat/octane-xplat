// @ts-nocheck — source inspection extracted unchanged from the TypeScript reference.
import { parseModule } from '@tsrx/core'

export interface RouteSourceMetadata {
  loader?: true
  guard?: true
  group?: true
  validateSearch?: true
  head?: true
  errorBoundary?: true
  dataMode?: 'baked' | 'live'
}

/** Inspect source, never imports/effects. Type-only exports and comments do not
 * advertise runtime capabilities. Static build mode must be locally knowable. */
export function routeSourceMetadata(source: string, file: string): RouteSourceMetadata {
  return routeAstMetadata(parseModule(source, file), file)
}

// Compiler AST details stay inside the project worker's implementation.
function routeAstMetadata(ast: unknown, file: string): RouteSourceMetadata {
  const bindings = new Map()
  const exported = new Map()
  const declare = (node, isExported) => {
    if (!node || node.declare) {
      return
    }
    if (node.type === 'VariableDeclaration') {
      const names = (pattern) => {
        if (pattern.type === 'Identifier') {
          return [pattern.name]
        }
        if (pattern.type === 'ObjectPattern') {
          return pattern.properties.flatMap((property) =>
            names(property.value ?? property.argument),
          )
        }
        if (pattern.type === 'ArrayPattern') {
          return pattern.elements.filter(Boolean).flatMap(names)
        }
        if (pattern.type === 'AssignmentPattern') {
          return names(pattern.left)
        }
        if (pattern.type === 'RestElement') {
          return names(pattern.argument)
        }
        return []
      }

      for (const entry of node.declarations) {
        for (const name of names(entry.id)) {
          bindings.set(name, {
            value: entry.id.type === 'Identifier' && node.kind === 'const' ? entry.init : undefined,
          })

          if (isExported) {
            exported.set(name, name)
          }
        }
      }
    } else if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
      if (isExported && node.id) {
        exported.set(node.id.name, node.id.name)
      }
    }
  }
  for (const node of ast.body) {
    if (node.type === 'ExportAllDeclaration' && node.exportKind !== 'type') {
      throw new Error(
        `route/source-exports: ${file}: use explicit named exports instead of export * so route capabilities can be discovered without executing modules`,
      )
    }

    if (node.type !== 'ExportNamedDeclaration') {
      declare(node, false)
      continue
    }

    if (node.exportKind === 'type') {
      continue
    }

    declare(node.declaration, true)
    for (const specifier of node.specifiers ?? []) {
      if (specifier.exportKind !== 'type') {
        exported.set(
          specifier.exported.name ?? specifier.exported.value,
          node.source ? undefined : specifier.local.name,
        )
      }
    }
  }
  const result = {}
  for (const [name, flag] of [
    ['loader', 'loader'],
    ['beforeLoad', 'guard'],
    ['group', 'group'],
    ['validateSearch', 'validateSearch'],
    ['head', 'head'],
    ['ErrorBoundary', 'errorBoundary'],
  ]) {
    if (exported.has(name)) {
      result[flag] = true
    }
  }
  if (exported.has('dataMode')) {
    let value = bindings.get(exported.get('dataMode'))?.value
    const visited = new Set()
    while (value) {
      if (
        [
          'TSAsExpression',
          'TSSatisfiesExpression',
          'TSTypeAssertion',
          'ParenthesizedExpression',
        ].includes(value.type)
      ) {
        value = value.expression
      } else if (value.type === 'Identifier' && !visited.has(value.name)) {
        visited.add(value.name)
        value = bindings.get(value.name)?.value
      } else {
        break
      }
    }

    if (value?.type !== 'Literal' || !['baked', 'live'].includes(value.value)) {
      throw new Error(
        `route/invalid-data-mode: ${file}: dataMode must resolve to a local const literal 'baked' or 'live'; declare it in the route module instead of computing or importing it`,
      )
    }

    result.dataMode = value.value
  }
  return result
}
