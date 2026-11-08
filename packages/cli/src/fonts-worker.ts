// Font conversion/registration policy stays in the canonical project JS engine.
import { dirname } from 'node:path'
import { realpathSync } from 'node:fs'
import { planFontInputs } from './fonts.ts'

export async function fontOperation(request: Record<string, any>, requestFile: string) {
  if (
    !Array.isArray(request.inputs) ||
    request.inputs.length < 1 ||
    request.inputs.length > 128 ||
    request.inputs.some(
      (value) => typeof value !== 'string' || value.length === 0 || value.length > 8192,
    )
  ) {
    throw new Error('Provide 1–128 font files or Fontsource packages')
  }

  const options = request.options

  if (!options || typeof options !== 'object' || typeof options.install !== 'boolean') {
    throw new Error('Invalid font options')
  }

  for (const key of ['name', 'token', 'subset']) {
    if (
      options[key] !== undefined &&
      (typeof options[key] !== 'string' || options[key].length > 8192)
    ) {
      throw new Error(`Invalid font ${key}`)
    }
  }

  if (
    options.weights !== undefined &&
    (!Array.isArray(options.weights) ||
      options.weights.length > 128 ||
      options.weights.some((value) => !Number.isFinite(value)))
  ) {
    throw new Error('Invalid font weights')
  }

  // Existing converters stage beneath os.tmpdir(). All staging, including library
  // scratch and inherited children, belongs to this managed request lifetime.
  const temporary = realpathSync(dirname(requestFile))

  process.env.TMPDIR = temporary
  process.env.TEMP = temporary
  process.env.TMP = temporary

  const project = realpathSync(process.cwd())

  try {
    return { version: 1, project, plan: await planFontInputs(project, request.inputs, options) }
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('wawoff2')) {
      throw new Error(
        'Install wawoff2@2.0.1 in the selected project for WOFF2 conversion (bun add --dev wawoff2@2.0.1)',
      )
    }

    throw error
  }
}
