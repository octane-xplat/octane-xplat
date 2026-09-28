/** Compile-time platform flag — `false` in every web build. Prefer
 *  `.web`/unsuffixed native defaults leaves for real divergence; `isNative` covers the
 *  render-time cases (conditional JSX, prop selection) where a whole
 *  leaf file is heavier than the difference. Bundlers constant-fold it,
 *  so `!isNative` branches tree-shake out of web output. */
export const isNative = false
