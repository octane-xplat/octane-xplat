import type { CssPlatform } from './css-platform.types.ts'

function target(value: unknown, source: string): CssPlatform {
  switch (value) {
    case 'web':
    case 'ios':
    case 'android':
    case 'visionos':
    case 'windows':
    case 'macos':
    case 'linux':
    case 'gtk':
    case 'native':
      return value
    default:
      throw new Error(`Unknown ${source} target: ${String(value)}`)
  }
}

// NativeScript also starts Vite directly (ns run/build/test), outside xplat.
function nativeInvocationTarget(): CssPlatform | undefined {
  const source = process.env.NATIVESCRIPT_BUNDLER_ENV

  if (source) {
    const env: unknown = JSON.parse(source)

    if (!env || typeof env !== 'object' || Array.isArray(env)) {
      throw new Error('NATIVESCRIPT_BUNDLER_ENV must be an object')
    }

    if ('platform' in env && env.platform !== undefined) {
      return target(env.platform, 'NativeScript')
    }

    for (const platform of ['android', 'windows', 'visionos', 'ios'] as const) {
      if (Object.entries(env).some(([key, value]) => key === platform && value)) {
        return platform
      }
    }
  }

  const args = process.argv.slice(2)

  for (const platform of ['visionos', 'android', 'ios', 'windows'] as const) {
    if (
      args.some(
        (arg) =>
          arg === `--${platform}` ||
          arg === `--env.${platform}` ||
          arg.startsWith(`--env.${platform}=`),
      )
    ) {
      return platform
    }
  }

  const index = args.indexOf('--platform')
  const value =
    args.find((arg) => arg.startsWith('--platform='))?.slice('--platform='.length) ??
    (index >= 0 ? args[index + 1] : undefined)

  return value === undefined ? undefined : target(value, '--platform')
}

/** @internal An absent target lets explicit native presets retain their generic chain. */
export function invocationTarget(): CssPlatform | undefined {
  const selected = process.env.XPLAT_TARGET
  const engine = nativeInvocationTarget()

  if (!selected) {
    return engine
  }

  const platform = target(selected, 'XPLAT_TARGET')

  if (engine && engine !== platform) {
    throw new Error(`Xplat target ${platform} conflicts with NativeScript target ${engine}`)
  }

  return platform
}

/** Resolve the invocation's build target. Direct Vite invocation defaults to web.
 * @example
 * import { buildTarget } from '@octane-xplat/cli/vite'
 * console.log(buildTarget())
 */
export function buildTarget(): CssPlatform {
  return invocationTarget() ?? 'web'
}
