import type { WebAssetManifest, WebAssets } from './props'

/** Resolve a Vite build manifest (`build.manifest: true`) into the document's
 * script and stylesheet URLs. Imported chunks load through the module graph, so
 * only the entry becomes a script; stylesheets from statically imported chunks
 * come first — dependencies before the entry's own CSS — each visited once. */
export function manifestAssets(
  manifest: WebAssetManifest,
  entry: string,
  options?: { base?: string },
): WebAssets {
  const base = options?.base ?? '/'

  if (!base.startsWith('/') || !base.endsWith('/')) {
    throw new TypeError('Asset base must start and end with /')
  }

  const chunk = manifest[entry]

  if (!chunk?.isEntry) {
    throw new TypeError(`Asset manifest has no entry chunk: ${entry}`)
  }

  const styles: string[] = []
  // The entry's own CSS is appended last, so mark it before traversing.
  const seen = new Set<string>([entry])
  const visit = (key: string) => {
    if (seen.has(key)) {
      return
    }

    seen.add(key)

    const imported = manifest[key]

    if (!imported) {
      return
    }

    for (const next of imported.imports ?? []) {
      visit(next)
    }

    for (const href of imported.css ?? []) {
      styles.push(base + href)
    }
  }

  for (const key of chunk.imports ?? []) {
    visit(key)
  }

  for (const href of chunk.css ?? []) {
    styles.push(base + href)
  }

  return { scripts: [base + chunk.file], styles: [...new Set(styles)] }
}
