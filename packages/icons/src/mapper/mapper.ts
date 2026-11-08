// Content-mapper implementation for `.icon` type stubs (TypeScript 7.1+).
// A consumer maps `icons:*` to generated stub files through tsconfig `paths`
// (see ../vite/stubs.ts) and registers the `.icon` extension with this
// package's `typescript.contentMapper` manifest. TypeScript resolves each
// `icons:<prefix>/<name>` specifier to a stub on disk, reads it, and asks this
// mapper for the module's typed content — the icon's normalized IconifyIcon
// literal — so every per-icon import is compile-checked against the installed
// collection with no hand-maintained ambient declaration.
import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { dirname } from 'node:path'

import type { IconifyIcon, IconifyJSON } from '@iconify/types'
import { getIconData } from '@iconify/utils/lib/icon-set/get-icon'

import { iconStubParts, resolveCollectionJson } from '../vite/resolve'
import { discoverIconifyCollections } from '../vite/stubs'

// Span kinds/features, mirroring @tsrx/content-mapper's protocol module — the
// wire tuples are positional, so they are inlined rather than imported.
const ATOM = 1
const ALL_FEATURES = (1 << 20) - 1

/** Mapper diagnostic codes, printed as `icons<code>` next to TypeScript's. */
export const iconMapperDiagnostics = {
  /** The stub file's name does not fit `<prefix>/<name>.icon`. */
  malformedStub: 770100,
  /** `@iconify-json/<prefix>` cannot be resolved from the project. */
  missingCollection: 770101,
  /** The stub's icon name is absent from the resolved collection. */
  missingIcon: 770102,
  /** The stub file's content no longer matches its specifier. */
  staleStub: 770103,
} as const

interface MapperDiagnostic {
  start: number
  length: number
  code: number
  messageText: string
}

interface TransformResult {
  text: string
  extension: '.ts'
  mappings: Array<[number, number, number, number, number, number]>
  diagnostics?: MapperDiagnostic[]
}

interface CollectionEntry {
  mtimeMs: number
  json: IconifyJSON
}

interface ProjectState {
  /** Anchor for `@iconify-json/*` resolution — the project tsconfig. */
  anchor: string
  /** Parsed collections keyed by icons.json path, invalidated on mtime. */
  collections: Map<string, CollectionEntry>
}

const FALLBACK_MODULE = 'declare const icon: any\nexport default icon\n'

function diagnostic(code: number, messageText: string): MapperDiagnostic {
  return { start: 0, length: 0, code, messageText }
}

function collectionAt(state: ProjectState, jsonPath: string): IconifyJSON | undefined {
  const mtimeMs = statSync(jsonPath).mtimeMs
  const cached = state.collections.get(jsonPath)

  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.json
  }

  try {
    const json = JSON.parse(readFileSync(jsonPath, 'utf8')) as IconifyJSON

    state.collections.set(jsonPath, { mtimeMs, json })
    return json
  } catch {
    return undefined
  }
}

/** Resolve a stub's icon to its normalized literal module text — the same
 *  getIconData normalization the Vite plugin emits at bundle time. */
function iconModuleText(
  prefix: string,
  name: string,
  state: ProjectState,
): { text?: string; diagnostics: MapperDiagnostic[] } {
  const jsonPath = resolveCollectionJson(prefix, state.anchor)
  const collection = jsonPath ? collectionAt(state, jsonPath) : undefined

  if (!collection) {
    return {
      diagnostics: [
        diagnostic(
          iconMapperDiagnostics.missingCollection,
          `Cannot resolve @iconify-json/${prefix} — install the collection package.`,
        ),
      ],
    }
  }

  const icon: IconifyIcon | null = getIconData(collection, name)

  if (!icon) {
    return {
      diagnostics: [
        diagnostic(
          iconMapperDiagnostics.missingIcon,
          `Icon "${name}" not found in @iconify-json/${prefix} — regenerate icon type stubs (syncIconStubs) or fix the specifier.`,
        ),
      ],
    }
  }

  return {
    diagnostics: [],
    text: [
      `import type { IconifyIcon } from '@octane-xplat/icons'`,
      `const icon = ${JSON.stringify(icon)} as const satisfies IconifyIcon`,
      `export default icon`,
      '',
    ].join('\n'),
  }
}

/** Create the `.icon` content mapper — the object server.js speaks JSON-RPC
 *  to. `transform` sees only real files TypeScript resolved on disk. */
export function createIconContentMapper() {
  const projects = new Map<string, ProjectState>()

  return {
    initialize(params: { positionEncodings?: string[] }) {
      const encoding = params.positionEncodings?.includes('utf-16') ? 'utf-16' : 'utf-8'

      return { positionEncoding: encoding, diagnosticSource: 'icons' }
    },

    openProject(params: {
      configFileName: string
      projectHandle: string
      options?: Record<string, unknown>
    }) {
      const anchor = params.configFileName || process.cwd()

      projects.set(params.projectHandle, { anchor, collections: new Map() })
      return {
        configIdentity: createHash('sha256')
          .update(JSON.stringify(params.options ?? {}))
          .digest('hex')
          .slice(0, 16),
        watchedFiles: [...discoverIconifyCollections(dirname(anchor)).values()],
      }
    },

    closeProject(params: { projectHandle: string }) {
      projects.delete(params.projectHandle)
      return null
    },

    transform(params: {
      fileName: string
      content: string
      projectHandle?: string
    }): TransformResult {
      const state = (params.projectHandle !== undefined && projects.get(params.projectHandle)) || {
        anchor: params.fileName,
        collections: new Map<string, CollectionEntry>(),
      }

      const diagnostics: MapperDiagnostic[] = []
      let text = FALLBACK_MODULE

      const parts = iconStubParts(params.fileName)

      if (!parts) {
        diagnostics.push(
          diagnostic(
            iconMapperDiagnostics.malformedStub,
            `Not a managed icon stub — expected <stubdir>/<prefix>/<name>.icon.`,
          ),
        )
      } else {
        const [prefix, name] = parts
        const expected = `icons:${prefix}/${name}`

        if (params.content.trim() !== expected) {
          diagnostics.push(
            diagnostic(
              iconMapperDiagnostics.staleStub,
              `Icon stub content is stale — expected "${expected}"; rerun syncIconStubs.`,
            ),
          )
        }

        const module = iconModuleText(prefix, name, state)

        diagnostics.push(...module.diagnostics)
        if (module.text) {
          text = module.text
        }
      }

      return {
        text,
        extension: '.ts',
        mappings: [[0, text.length, 0, params.content.length, ATOM, ALL_FEATURES]],
        ...(diagnostics.length ? { diagnostics } : {}),
      }
    },
  }
}
