/**
 * Only iOS needs the `measure` wrap; Android and other hosts keep the Page's
 * existing measurement. See `full-screen-page-measure.ios.ts`.
 * @internal
 */
export function wrapFullScreenPageMeasure(_page: unknown): void {}
