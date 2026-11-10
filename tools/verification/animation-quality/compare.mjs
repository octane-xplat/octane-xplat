import { readFileSync } from 'node:fs'
import { evaluate } from './metrics.mjs'
const [file, baselineFile] = process.argv.slice(2)
if (!file) {
  throw new Error('Usage: node compare.mjs RUN.json [BASELINE.json]')
}
const read = (path) => JSON.parse(readFileSync(path, 'utf8'))
const baseline = baselineFile ? read(baselineFile) : undefined
if (baseline) {
  evaluate(baseline)
}
const result = evaluate(read(file), baseline)
console.log(JSON.stringify(result, null, 2))
if (result.some((row) => !row.pass)) {
  process.exitCode = 1
}
