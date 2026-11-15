import { isUnsupportedNativeHover } from './mobile-media-query.mjs'

// Core9.1.3 supplies physical Screen pixels to media queries, whereas the AOT
// engine receives logical viewport dimensions. It also omits reduced motion.
// Exact logical launch guards cannot establish equivalent live CSS behavior.
export function compileLaunchConstraints(queries, environment, options = {}) {
  const supportedPart =
    /^\s*(?:(?:only\s+)?(?:screen|all)\s+and\s+)?\(\s*prefers-color-scheme\s*:\s*(?:light|dark)\s*\)\s*$/i

  const unsupported = queries.filter(
    (query) =>
      !query
        .split(',')
        .every(
          (part) =>
            supportedPart.test(part) ||
            /^\s*(?:screen|all)\s*$/i.test(part) ||
            (query.indexOf(',') < 0 && isUnsupportedNativeHover(part)),
        ),
  )

  if (unsupported.length) {
    throw new Error(
      'NativeScript AOT media-query inputs are not aligned with live CSS: ' +
        unsupported.join('; '),
    )
  }

  // Insets only bound adoption when the prepared tree read them; the native
  // mount then must observe the same values its baked padding assumed.
  const insets = environment.safeAreaInsets
  const safeArea =
    options.consumesSafeAreaInsets && insets
      ? [
          { input: 'safeAreaTop', equals: insets.top },
          { input: 'safeAreaRight', equals: insets.right },
          { input: 'safeAreaBottom', equals: insets.bottom },
          { input: 'safeAreaLeft', equals: insets.left },
        ]
      : []

  return {
    dimensionQueries: [],
    constraints: [
      { input: 'fontScale', equals: 1 },
      { input: 'reducedMotion', equals: environment.reducedMotion },
      ...safeArea,
    ],
  }
}
