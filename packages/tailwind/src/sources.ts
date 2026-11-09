import { extname } from 'node:path'
import type { TailwindTarget } from './target.ts'

// Match Xplat's platform-leaf contract, including visionOS's iOS leaves and
// the Linux DOM host's web fallback. There is no .native filename tier.
const suffixes: Record<TailwindTarget, readonly string[]> = {
  web: ['web', ''],
  ios: ['ios', 'mobile', ''],
  android: ['android', 'mobile', ''],
  visionos: ['ios', 'mobile', ''],
  macos: ['macos', ''],
  windows: ['windows', ''],
  linux: ['linux', 'web', ''],
  gtk: ['gtk', ''],
  native: [''],
}

const platformSuffix = /\.(web|mobile|ios|android|macos|windows|linux|gtk)$/

/** Select platform leaves within the official scanner's source inventory. */
export function selectSourceFiles(files: readonly string[], target: TailwindTarget): string[] {
  const available = new Set(files)
  const preference = suffixes[target]

  return files.filter((file) => {
    const extension = extname(file)
    const stem = file.slice(0, file.length - extension.length)
    const suffix = platformSuffix.exec(stem)
    const base = suffix ? stem.slice(0, -suffix[0].length) : stem
    const tier = preference.indexOf(suffix?.[1] ?? '')

    if (tier === -1) {
      return false
    }

    // Keep other source extensions independent: explicit .tsrx imports and
    // .tsx imports may coexist, and scanning is not module-graph tree shaking.
    return !preference
      .slice(0, tier)
      .some((higher) => available.has(`${base}${higher ? `.${higher}` : ''}${extension}`))
  })
}
