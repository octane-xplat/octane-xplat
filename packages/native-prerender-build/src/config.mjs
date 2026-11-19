import { dirname, resolve } from 'node:path'

// Private producer contract, separate from the installed native artifact schema.
export function parseProducerConfig(text, file) {
  if (Buffer.byteLength(text, 'utf8') > 1024 * 1024) {
    throw new Error('Producer configuration exceeds 1MiB')
  }

  const value = JSON.parse(text)
  const object = (candidate) =>
    candidate !== null && typeof candidate === 'object' && !Array.isArray(candidate)

  if (!object(value)) {
    throw new Error('Producer configuration must be an object')
  }

  const fields = ['version', 'entry', 'exportName', 'seed', 'environment']

  if (
    fields.some((key) => !Object.hasOwn(value, key)) ||
    Object.keys(value).some((key) => ![...fields, 'launchInputs'].includes(key))
  ) {
    throw new Error(
      'Producer configuration requires exactly ' +
        fields.join(', ') +
        ' plus optional launchInputs',
    )
  }

  if (value.version !== 1) {
    throw new Error('Unsupported producer configuration version')
  }

  if (typeof value.entry !== 'string' || !value.entry || value.entry.includes('\0')) {
    throw new Error('Producer entry must be a source file path')
  }

  if (typeof value.exportName !== 'string' || !/^[$A-Z_a-z][$\w]*$/.test(value.exportName)) {
    throw new Error('Producer exportName must name a component export')
  }

  if (!object(value.seed)) {
    throw new Error('Producer seed must be a JSON object')
  }

  const environment = value.environment

  if (
    !object(environment) ||
    Object.keys(environment).some(
      (key) => !['width', 'height', 'reducedMotion', 'safeAreaInsets'].includes(key),
    ) ||
    !Number.isFinite(environment.width) ||
    environment.width <= 0 ||
    !Number.isFinite(environment.height) ||
    environment.height <= 0 ||
    typeof environment.reducedMotion !== 'boolean'
  ) {
    throw new Error('Producer environment requires positive width/height and boolean reducedMotion')
  }

  const insets = environment.safeAreaInsets
  if (insets !== undefined) {
    if (
      !object(insets) ||
      Object.keys(insets).length !== 4 ||
      !['top', 'right', 'bottom', 'left'].every(
        (edge) => Number.isFinite(insets[edge]) && insets[edge] >= 0,
      )
    ) {
      throw new Error(
        'Producer environment safeAreaInsets requires finite top/right/bottom/left values',
      )
    }
  }

  const launchInputs = parseLaunchInputs(value.launchInputs)

  return {
    entry: resolve(dirname(file), value.entry),
    exportName: value.exportName,
    seed: value.seed,
    environment,
    ...(launchInputs ? { launchInputs } : {}),
  }
}

/**
 * Declared persisted inputs the producer renders launch trees for. The first
 * cut is bounded: enum-string reads from the ApplicationSettings store only,
 * at most four declared values per input, and the Cartesian product across
 * inputs (including each null default's absent-key point) must stay at or
 * below four declared bind points — every point is then crossed with the
 * implicit systemAppearance input (light/dark), for at most eight trees.
 * `systemAppearance` is a reserved bind name: it has no persisted store, so
 * a declared launch input may not use it.
 */
function parseLaunchInputs(input) {
  if (input === undefined) {
    return undefined
  }

  if (!Array.isArray(input) || input.length < 1 || input.length > 8) {
    throw new Error('Producer launchInputs must declare 1..8 inputs')
  }

  const names = new Set()
  const launchInputs = input.map((candidate) => {
    if (
      candidate === null ||
      typeof candidate !== 'object' ||
      Array.isArray(candidate) ||
      Object.keys(candidate).sort().join(',') !== 'default,name,source,values'
    ) {
      throw new Error('Producer launch input requires name, source, values and default')
    }

    const name = candidate.name
    if (typeof name !== 'string' || !/^[\x20-\x7e]{1,128}$/.test(name) || names.has(name)) {
      throw new Error('Producer launch input names must be unique printable ASCII strings')
    }
    if (name === 'systemAppearance') {
      throw new Error(
        'Producer launch input name systemAppearance is reserved for the implicit appearance bind',
      )
    }
    names.add(name)

    if (candidate.source !== 'appSettings.string') {
      throw new Error("Producer launch input source must be 'appSettings.string'")
    }

    const values = candidate.values
    if (
      !Array.isArray(values) ||
      values.length < 1 ||
      values.length > 4 ||
      values.some((value) => typeof value !== 'string' || value.length > 256) ||
      new Set(values).size !== values.length
    ) {
      throw new Error('Producer launch input values must be 1..4 unique strings')
    }

    const fallback = candidate.default
    if (fallback !== null && !values.includes(fallback)) {
      throw new Error('Producer launch input default must be one of values or null')
    }

    return { name, source: 'appSettings.string', values: [...values], default: fallback }
  })

  const product = launchInputs.reduce(
    (count, item) => count * (item.values.length + (item.default === null ? 1 : 0)),
    1,
  )
  if (product > 4) {
    throw new Error(
      'Producer launch input Cartesian product exceeds four declared binds ' +
        '(each crossed with light/dark systemAppearance, eight trees maximum)',
    )
  }

  return launchInputs
}
