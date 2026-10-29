/** @jsxImportSource @octane-xplat/jsx */
import { expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { DateTimeInput } from './DateTimeInput.macos.tsrx'
vi.mock('../overlays/Popover.macos.tsrx', () => ({ Popover: () => null }))
function mount(extra: any = {}) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const base = { id: 'appointment', value: '2026-03-05T14:30', locale: 'en-US', hourFormat: '24h', hasClear: true, onChange: vi.fn(), ...extra }
	const all = (): any[] => { const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]; return container.children.flatMap(walk) }
	const field = (part: 'date' | 'time') => all().find((node) => node.type === 'textfield' && node.props.id === (part === 'date' ? 'appointment' : 'appointment-time'))
	const clear = () => all().find((node) => String(node.props?.className).split(' ').includes('vx-datetimeinput-clear'))?.props.onTap
	const flush = () => flushUniversalSync(() => {})
	const render = (props: any) => { root.render(DateTimeInput, props); flush() }
	const edit = (part: 'date' | 'time', text: string) => { field(part).props.onTextChange(text); flush() }
	const settle = async () => { await Promise.resolve(); flush(); await Promise.resolve(); flush() }
	render(base)
	return { root, base, field, clear, flush, render, edit, settle }
}
it('both fields retain marked drafts and use the existing AppKit editor guard until submit can commit', () => {
	const f = mount(), dateEditor = { hasMarkedText: true }, timeEditor = { hasMarkedText: () => true }
	try {
		f.field('date').currentEditor = () => dateEditor; f.field('time').currentEditor = timeEditor
		f.edit('date', '2026-03-06'); f.edit('time', '15:45'); f.field('date').props.onSubmit(); f.field('time').props.onSubmit(); f.flush()
		expect(f.base.onChange).not.toHaveBeenCalled(); expect(f.field('date').props.value).toBe('2026-03-06'); expect(f.field('time').props.value).toBe('15:45')
		dateEditor.hasMarkedText = false; timeEditor.hasMarkedText = () => false
		f.field('date').props.onSubmit(); f.flush(); f.field('time').props.onSubmit(); f.flush()
		expect(f.base.onChange.mock.calls.map((call: any[]) => call[0])).toEqual(['2026-03-06T14:30', '2026-03-05T15:45'])
	} finally { f.root.unmount() }
})
it('current disabled/readonly/loading state preserves both drafts against held text/submit/clear callbacks', () => {
	for (const blocked of [{ isDisabled: true }, { isReadOnly: true }, { isLoading: true }]) {
		const f = mount()
		try {
			f.edit('date', 'unfinished date'); f.edit('time', 'unfinished time')
			const date = f.field('date').props, time = f.field('time').props, clear = f.clear()
			f.render({ ...f.base, ...blocked }); date.onTextChange('2026-03-06'); time.onTextChange('16:00'); date.onSubmit(); time.onSubmit(); clear(); f.flush()
			expect(f.field('date').props.value).toBe('unfinished date'); expect(f.field('time').props.value).toBe('unfinished time'); expect(f.base.onChange).not.toHaveBeenCalled()
		} finally { f.root.unmount() }
	}
})
it('one pending save owns both fields before the busy render and through settlement', async () => {
	let finish!: () => void
	const action = vi.fn(() => new Promise<void>((resolve) => { finish = resolve })), f = mount({ changeAction: action })
	try {
		const date = f.field('date').props, time = f.field('time').props, clear = f.clear()
		date.onTextChange('2026-03-06'); time.onTextChange('16:00'); date.onSubmit(); time.onSubmit(); clear(); f.flush()
		expect(f.base.onChange).toHaveBeenCalledTimes(1); expect(action).toHaveBeenCalledTimes(1); expect(f.field('date').props.value).toBe('2026-03-06'); expect(f.field('time').props.value).toBe('14:30')
		finish(); await f.settle(); expect(f.field('date').props.value).toBe('2026-03-06'); expect(f.field('time').props.editable).toBe(true)
	} finally { f.root.unmount() }
})
it('retained callbacks use current date/seconds/endpoints and reject old allowed dates after bounds change', () => {
	const f = mount({ min: '2026-03-05T00:00', max: '2026-03-10T23:59' })
	try {
		const date = f.field('date').props, time = f.field('time').props, editor = { hasMarkedText: true }
		f.field('time').currentEditor = () => editor
		f.render({ ...f.base, value: '2026-03-07T09:00:00', hasSeconds: true, min: '2026-03-07T09:00:00', max: '2026-03-07T10:00:59' })
		time.onTextChange('09:15:07'); f.flush(); editor.hasMarkedText = false; time.onSubmit(); f.flush(); expect(f.base.onChange).toHaveBeenLastCalledWith('2026-03-07T09:15:07')
		f.base.onChange.mockClear(); date.onTextChange('2026-03-08'); time.onTextChange('10:30:00'); f.flush(); expect(f.base.onChange).not.toHaveBeenCalled()
		f.field('time').props.onSubmit(); f.flush(); expect(f.field('time').props.value).toBe('09:00:00'); expect(f.base.onChange).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
it('a date-less time draft is available before render and can be cleared without inventing a parent value', () => {
	const f = mount({ value: null })
	try {
		f.field('time').props.onTextChange('15:45'); f.field('date').props.onTextChange('2026-03-06'); f.flush(); expect(f.base.onChange).toHaveBeenLastCalledWith('2026-03-06T15:45')
	} finally { f.root.unmount() }
	const g = mount({ value: null })
	try {
		g.edit('time', '15:45'); g.field('time').props.onSubmit(); g.flush(); expect(g.field('time').props.value).toBe('15:45')
		g.edit('time', ''); g.field('time').props.onSubmit(); g.flush(); expect(g.field('time').props.value).toBe(''); expect(g.base.onChange).not.toHaveBeenCalled()
	} finally { g.root.unmount() }
})
it('constraint/application callbacks cannot reenter draft intents and metadata replaced during validation rejects the old request', () => {
	let active = false, f: ReturnType<typeof mount>, heldDate: any, heldTime: any, heldClear: any
	const constraint = vi.fn(() => { if (active) { heldTime.onTextChange('16:00'); heldDate.onSubmit(); heldClear() }; return false })
	f = mount({ dateConstraints: [constraint] })
	try {
		heldDate = f.field('date').props; heldTime = f.field('time').props; heldClear = f.clear(); active = true
		heldDate.onTextChange('2026-03-06'); active = false; f.flush(); expect(f.base.onChange).toHaveBeenCalledTimes(1); expect(f.field('time').props.value).toBe('14:30')
	} finally { f.root.unmount() }
	let replace = false, g: ReturnType<typeof mount>
	const constraints = [() => { if (replace) { replace = false; g.render({ ...g.base, min: '2026-03-07T00:00' }) }; return false }]
	g = mount({ dateConstraints: constraints })
	try { replace = true; g.edit('date', '2026-03-06'); expect(g.base.onChange).not.toHaveBeenCalled() }
	finally { g.root.unmount() }
})
it('callback correction and teardown own the post-commit display; held callbacks remain inert', () => {
	const f = mount(), correction = vi.fn(() => f.render({ ...f.base, value: '2026-03-09T10:00', onChange: correction }))
	try { f.render({ ...f.base, onChange: correction }); f.edit('time', '15:45'); expect(f.field('time').props.value).toBe('10:00'); expect(correction).toHaveBeenCalledTimes(1) }
	finally { f.root.unmount() }
	const g = mount(), change = vi.fn(() => g.root.unmount()); const date = g.field('date').props, time = g.field('time').props, clear = g.clear()
	try { g.render({ ...g.base, onChange: change }); date.onTextChange('2026-03-06'); time.onTextChange('16:00'); date.onSubmit(); time.onSubmit(); clear(); g.flush(); expect(change).toHaveBeenCalledTimes(1) }
	finally { g.root.unmount() }
})
it('an accepted parent echo does not cause another change/save when the same draft submits', () => {
	const f = mount(), action = vi.fn(), nextAction = vi.fn(), changed = vi.fn((value) => f.render({ ...f.base, value, onChange: changed, changeAction: nextAction }))
	try {
		f.render({ ...f.base, onChange: changed, changeAction: action }); f.edit('time', '15:45'); f.field('time').props.onSubmit(); f.flush()
		expect(changed).toHaveBeenCalledTimes(1); expect(action).toHaveBeenCalledTimes(1); expect(nextAction).not.toHaveBeenCalled()
	} finally { f.root.unmount() }
})
