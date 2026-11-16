import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function nativeGiProjection(schemaPath) {
  return {
    name: 'native-gi-projection',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'virtual:gtk-schema') return '\0gtk-schema'
      if (id.startsWith('gi://')) return '\0gi:' + id.slice(5).split('?')[0]
    },
    load(id) {
      if (id === '\0gtk-schema') {
        this.addWatchFile(schemaPath)
        return 'export default ' + readFileSync(schemaPath, 'utf8')
      }
      if (id.startsWith('\0gi:')) {
        return `import {namespaces} from ${JSON.stringify(resolve(import.meta.dirname, 'bindings.mjs'))};export default namespaces[${JSON.stringify(id.slice(4))}];`
      }
    },
  }
}
