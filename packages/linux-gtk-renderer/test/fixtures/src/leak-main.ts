// Negative fixture entry: a shared importer reaching for a .linux leaf. The
// xplat boundary must reject this at build time.
import { leaked } from './leak.linux.ts'

console.log(leaked)
