import { expect, it } from 'vitest'
import { observeFocusedInput, focusRechecks } from '../src/focus-source.web'

import { focusWebFixture as fixture } from './helpers/focus-web'

it('reports box/selection and nearest scroll owners without reading text', () => {
	const f = fixture(),
		snapshots: any[] = []
	const stop = observeFocusedInput(f.document, (state) => snapshots.push(state))
	const first = snapshots.at(-1)
	expect(first.input).toBe(f.field)
	expect(first.inputRect).toEqual(f.field.box)
	expect(first.selection).toEqual({ start: 1, end: 3 })
	expect(first.caretRect).toBeNull()
	expect(first.capabilities.caretBounds).toBe('none')
	expect(first.scrollOwners.map((owner: any) => owner.id)).toEqual([f.scroll, f.root])
	expect(first.scrollOwners[0].rect).toEqual({ x: 21, y: 101, width: 300, height: 200 })
	expect(first.scrollOwners[0].maxOffsetY).toBe(400)
	expect(first.scrollOwners[1].rect).toEqual({ x: 0, y: 0, width: 400, height: 800 })
	focusRechecks.get(f.document)!()
	expect(snapshots).toHaveLength(1)
	f.field.selectionEnd = 4
	focusRechecks.get(f.document)!()
	expect(snapshots.at(-1).selection.end).toBe(4)
	f.field.box = { ...f.field.box, y: 300, height: 90 }
	focusRechecks.get(f.document)!()
	expect(snapshots.at(-1).inputRect.y).toBe(300)
	f.field.isConnected = false
	focusRechecks.get(f.document)!()
	expect(snapshots.at(-1).input).toBeNull()
	const stale = [...f.queue.values()][0],
		count = snapshots.length
	stop()
	stop()
	stale()
	expect(snapshots).toHaveLength(count)
	expect(f.queue.size).toBe(0)
	expect(focusRechecks.has(f.document)).toBe(false)
})

it('tracks identity changes even when geometry and selection are equal', () => {
	const f = fixture(),
		snapshots: any[] = []
	const stop = observeFocusedInput(f.document, (state) => snapshots.push(state))
	f.document.activeElement = { ...f.field }
	focusRechecks.get(f.document)!()
	expect(snapshots).toHaveLength(2)
	expect(snapshots.at(-1).input).toBe(f.document.activeElement)
	stop()
})
