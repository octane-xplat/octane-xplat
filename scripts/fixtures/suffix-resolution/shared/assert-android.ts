import { osLeaf } from './use-os-leaf'
import { probe } from './use-probe'

const a: 'android' = probe
const b: 'android' = osLeaf
export { a, b }
