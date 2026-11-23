import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const schemaId = '\0xplat-gtk-schema'
const namespacePrefix = '\0xplat-gtk-gi:'

export const gtkRuntimeBuildMarker = '.xplat-gtk-runtime'

export function nativeGiProjection(schemaPath: string, verifyPackaging: boolean): Plugin {
  const bindingsPath = resolve(import.meta.dirname, 'bindings.mjs')
  return {
    name: 'xplat-gtk-native-gi',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'virtual:gtk-schema') {return schemaId}
      if (id.startsWith('gi://')) {return namespacePrefix + id.slice(5).split('?')[0]}
    },
    load(id) {
      if (id === schemaId) {
        this.addWatchFile(schemaPath)
        const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
        return `export default ${JSON.stringify(schema)};`
      }
      if (id.startsWith(namespacePrefix)) {
        const namespace = id.slice(namespacePrefix.length)
        return `import { namespaces } from ${JSON.stringify(bindingsPath)}; export default namespaces[${JSON.stringify(namespace)}];`
      }
    },
    generateBundle() {
      if (verifyPackaging) {
        this.emitFile({ type: 'asset', fileName: gtkRuntimeBuildMarker, source: '1\n' })
      }
    },
  }
}
