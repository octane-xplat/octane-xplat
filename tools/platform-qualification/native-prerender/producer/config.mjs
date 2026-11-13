import { dirname, resolve } from 'node:path'

// Private producer contract, separate from the installed native artifact schema.
export function parseProducerConfig(text, file) {
  if (Buffer.byteLength(text, 'utf8') > 1024 * 1024)
    throw new Error('Producer configuration exceeds 1MiB')
  const value = JSON.parse(text)
  const object = (candidate) =>
    candidate !== null && typeof candidate === 'object' && !Array.isArray(candidate)
  if (!object(value)) throw new Error('Producer configuration must be an object')
  const fields = ['version', 'entry', 'exportName', 'seed', 'environment']
  if (
    Object.keys(value).length !== fields.length ||
    fields.some((key) => !Object.hasOwn(value, key))
  )
    throw new Error('Producer configuration requires exactly ' + fields.join(', '))
  if (value.version !== 1) throw new Error('Unsupported producer configuration version')
  if (typeof value.entry !== 'string' || !value.entry || value.entry.includes('\0'))
    throw new Error('Producer entry must be a source file path')
  if (typeof value.exportName !== 'string' || !/^[$A-Z_a-z][$\w]*$/.test(value.exportName))
    throw new Error('Producer exportName must name a component export')
  if (!object(value.seed)) throw new Error('Producer seed must be a JSON object')
  const environment = value.environment
  if (
    !object(environment) ||
    Object.keys(environment).length !== 3 ||
    !Number.isFinite(environment.width) ||
    environment.width <= 0 ||
    !Number.isFinite(environment.height) ||
    environment.height <= 0 ||
    typeof environment.reducedMotion !== 'boolean'
  )
    throw new Error('Producer environment requires positive width/height and boolean reducedMotion')
  return {
    entry: resolve(dirname(file), value.entry),
    exportName: value.exportName,
    seed: value.seed,
    environment,
  }
}
