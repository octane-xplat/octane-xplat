import assert from 'node:assert/strict'
import test from 'node:test'
import { runGtkEvalFixture } from './gjs-ui-fixture.mts'

test('GTK shared owner cancels nested press, permits a fresh click and preserves keyboard activation', async (t) => {
  if (!process.env.LINUX_RUNTIME_EVAL_ENGINE) {
    t.skip('Run the GTK integration suite on Andromeda')
    return
  }

  const {
    fixture: { events },
  } = await runGtkEvalFixture(t, {
    stem: 'shared-gestures',
    entry: 'src/ui-shared-gestures-main.ts',
    title: 'solid-birch-shared-gestures',
    marker: 'SHARED_GESTURE_RESULT',
    readyMarker: 'SHARED_READY',
    input: true,
    minChecks: 2,
  })

  assert.deepEqual(
    events.filter((event) => event.kind !== 'move').map((event) => [event.kind, event.detail]),
    [
      ['press', 'pointer'],
      ['start', undefined],
      ['finish', 'ended'],
      ['press', 'pointer'],
      ['press', 'keyboard'],
      ['start', undefined],
      ['finish', 'cancelled'],
      ['press', 'pointer'],
    ],
    JSON.stringify(events),
  )

  assert(events.some((event) => event.kind === 'move' && Math.abs(event.detail.x - 100) < 1))
})
