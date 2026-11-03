import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { parseModule } from '@tsrx/core'

interface Statement {
  type: string
  declare?: boolean
  exportKind?: string
  name?: string
  id?: { name?: string }
  declaration?: Statement
  declarations?: { id: { name?: string } }[]
  source?: unknown
  specifiers?: { local?: { name?: string }; exportKind?: string }[]
}

/** Declaration contracts participate in checking, never runtime discovery. */
export function isTsrxContract(source: string, file: string): boolean {
  if (source.startsWith('// Type contract only.')) {
    return true
  }
  if (!/\bdeclare\b/.test(source)) {
    return false
  }
  const { body } = parseModule(source, file) as { body: Statement[] }
  const declared = new Set<string>()
  for (const statement of body) {
    const node = statement.declaration ?? statement
    if (!node.declare) {
      continue
    }

    if (node.id?.name) {
      declared.add(node.id.name)
    }

    for (const item of node.declarations ?? []) {
      if (item.id.name) {
        declared.add(item.id.name)
      }
    }
  }
  const typeOnly = (node: Statement): boolean => {
    if (
      node.declare ||
      node.type === 'TSDeclareFunction' ||
      node.type === 'TSInterfaceDeclaration' ||
      node.type === 'TSTypeAliasDeclaration'
    ) {
      return true
    }
    if (node.type === 'ImportDeclaration' || node.type === 'EmptyStatement') {
      return true
    }
    if (node.type === 'ExportDefaultDeclaration') {
      return node.declaration?.type === 'Identifier' && declared.has(node.declaration.name ?? '')
    }
    if (node.type === 'ExportNamedDeclaration') {
      if (node.exportKind === 'type') {
        return true
      }

      if (node.declaration) {
        return typeOnly(node.declaration)
      }

      return (
        !node.source &&
        (node.specifiers ?? []).every(
          (item) => item.exportKind === 'type' || declared.has(item.local?.name ?? ''),
        )
      )
    }
    return false
  }
  return declared.size > 0 && body.every(typeOnly)
}

const suffixes: Record<string, string[]> = {
  web: ['web'],
  ios: ['ios', 'mobile'],
  visionos: ['ios', 'mobile'],
  android: ['android', 'mobile'],
  macos: ['macos'],
  windows: ['windows'],
  gtk: ['gtk'],
  linux: ['linux', 'web'],
  native: [],
}

/** Explicit extensions identify the source language, not the runtime platform. */
export function resolveTsrxLeaf(
  source: string,
  importer: string | undefined,
  platform: string,
): string | null {
  if (!importer || (!source.startsWith('.') && !isAbsolute(source))) {
    return null
  }
  const [file] = source.split(/[?#]/, 1)
  if (
    !file.endsWith('.tsrx') ||
    /\.(web|ios|android|mobile|macos|windows|linux|gtk)\.tsrx$/.test(file)
  ) {
    return null
  }
  const query = source.slice(file.length)
  const base = resolve(
    dirname(importer.split(/[?#]/, 1)[0].replace(/^\/@fs\//, '/')),
    file.slice(0, -5),
  )
  const fallback = `${base}.tsrx`
  // A platform implementation may delegate to its own unsuffixed base.
  // Redirecting that import back to the importer would create a module cycle.
  // Returning null here still lets ambient moduleSuffixes resolution prefer the
  // platform leaf — return the literal base so the delegation lands on it.
  const importerFile = importer
    .split(/[?#]/, 1)[0]
    .replace(/^\/@fs\//, '/')
    .replaceAll('\\', '/')
  const delegatesToBase =
    importerFile.replace(/\.(web|ios|android|mobile|macos|windows|linux|gtk)\.tsrx$/, '.tsrx') ===
    fallback.replaceAll('\\', '/')
  if (delegatesToBase) {
    return existsSync(fallback) ? fallback.replaceAll('\\', '/') + query : null
  }
  for (const suffix of suffixes[platform] ?? []) {
    const candidate = `${base}.${suffix}.tsrx`
    if (existsSync(candidate)) {
      return candidate.replaceAll('\\', '/') + query
    }
  }
  if (existsSync(fallback) && isTsrxContract(readFileSync(fallback, 'utf8'), fallback)) {
    throw new Error(
      `No ${platform} implementation for ${file}; its unsuffixed TSRX module is a declaration-only contract.`,
    )
  }
  return null
}
