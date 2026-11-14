import { isUnsupportedNativeHover } from './mobile-media-query.mjs'

// Core9.1.3 supplies physical Screen pixels to media queries, whereas the AOT
// engine receives logical viewport dimensions. It also omits reduced motion.
// Exact logical launch guards cannot establish equivalent live CSS behavior.
export function compileLaunchConstraints(queries, environment) {
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

  return {
    dimensionQueries: [],
    constraints: [
      { input: 'fontScale', equals: 1 },
      { input: 'reducedMotion', equals: environment.reducedMotion },
    ],
  }
}
