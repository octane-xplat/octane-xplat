import { mobileTs } from './use-mobile-ts'
import { osLeaf } from './use-os-leaf'
import { probe } from './use-probe'
import { mobileOnly } from './use-mobile-only'

const a: 'web' = probe
const b: 'web' = mobileOnly
const c: 'web' = mobileTs
const d: 'web' = osLeaf
export { a, b, c, d }
