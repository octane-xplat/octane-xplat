// Conservative for the current cascade engine: viewport dimensions are read
// only by media queries. Native backend preflight rejects unsupported computed
// values (including unresolved viewport/safe-area expressions) before mounting.
export function compileLaunchConstraints(queries, environment) {
  const dimensionQueries = queries.filter((query) =>
    /\b(?:width|height|orientation)\b/i.test(query),
  )
  return {
    dimensionQueries,
    constraints: [
      { input: 'fontScale', equals: 1 },
      { input: 'reducedMotion', equals: environment.reducedMotion },
      ...(dimensionQueries.length
        ? [
            { input: 'width', min: environment.width, max: environment.width },
            { input: 'height', min: environment.height, max: environment.height },
          ]
        : []),
    ],
  }
}
