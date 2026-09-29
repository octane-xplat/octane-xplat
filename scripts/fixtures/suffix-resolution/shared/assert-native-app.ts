import { mobileTs } from './use-mobile-ts'
import { osLeaf } from './use-os-leaf'
import { probe } from './use-probe'
import { mobileOnly } from './use-mobile-only'

// App-native tsconfig chain ['.ios','.android','.mobile',''] lands on .ios
// first for Probe (if .tsrx probing existed) and on .ios/.mobile for the
// .ts leaves.
const a: 'ios' = probe
const b: 'mobile' = mobileOnly
const c: 'mobile' = mobileTs
const d: 'ios' = osLeaf
export { a, b, c, d }
