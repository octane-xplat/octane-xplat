// Typecheck shim — index.ts imports `./breakpoints` extensionless, and
// moduleSuffixes only probes .ts/.tsx, not .tsrx. Bundlers resolve the
// .tsrx leaf directly; tsrx-tsc lands here and follows the literal name.
export { useBreakpoints } from './breakpoints.web.tsrx'
