import { buffer, stream, events, util, assert, querystring } from './engine.js'

const modules = { buffer, stream, events, util, assert, querystring }

export type BuiltinName = keyof typeof modules
export type BuiltinModules = typeof modules

export function builtinName(name: string): BuiltinName | undefined {
  const bare = name.startsWith('node:') ? name.slice(5) : name

  switch (bare) {
    case 'buffer':
    case 'stream':
    case 'events':
    case 'util':
    case 'assert':
    case 'querystring':
      return bare
    default:
      return undefined
  }
}

/** Resolve exactly the six supported builtins. Other names throw. */
export function requireNode<Name extends BuiltinName>(
  name: Name | `node:${Name}`,
): BuiltinModules[Name]

export function requireNode(name: string): BuiltinModules[BuiltinName]
export function requireNode(name: string): BuiltinModules[BuiltinName] {
  const key = builtinName(name)

  if (key === undefined) {
    throw new Error(`Unsupported Node builtin: ${name}`)
  }

  return modules[key]
}
