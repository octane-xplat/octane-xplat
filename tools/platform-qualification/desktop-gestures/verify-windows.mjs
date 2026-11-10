import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const output = readFileSync(process.argv[2], 'utf8')
assert.match(output, /TASK=0/)
const events = output
  .split(/\r?\n/)
  .filter((line) => line.startsWith('{'))
  .map((line) => JSON.parse(line))
assert(!events.some((event) => event.error), output)
assert(
  events.some((event) => event.disposed) && events.some((event) => event.postDisposeInvoked),
  'Native cleanup gate did not run',
)
assert(
  !events.slice(events.findIndex((event) => event.disposed) + 1).some((event) => event.kind),
  'Retired callbacks reached the owner',
)
const ready = events.find((event) => event.ready && event.owner)
assert(ready && ready.scale > 0, 'Native fixture did not attach')
assert.deepEqual(
  events
    .filter((event) => event.kind && event.kind !== 'move')
    .map((event) => [event.kind, event.source ?? event.outcome]),
  [
    ['press', 'pointer'],
    ['start', undefined],
    ['press', 'virtual'],
    ['finish', 'ended'],
    ['press', 'pointer'],
    ['press', 'keyboard'],
    ['long', undefined],
    ['press', 'pointer'],
    ['press', 'pointer'],
    ['double', undefined],
  ],
  output,
)
const physicalWidth = events.find((event) => event.driverWidth)?.driverWidth
assert(physicalWidth > 0 && ready.width > 0, 'Native/physical bounds calibration missing')
const scale = physicalWidth / ready.width
assert(
  events.some((event) => event.kind === 'move' && Math.abs(event.translation.x - 100 / scale) < 2),
  'Physical input must normalize to logical units',
)
assert.doesNotMatch(output, /JSERROR=.+|System\.[A-Za-z]+Exception|"error":/)
console.log(
  'Windows native transport/owner mouse, nested press, UIA Invoke and keyboard gate passed. Packed/public-component qualification is separate.',
)
