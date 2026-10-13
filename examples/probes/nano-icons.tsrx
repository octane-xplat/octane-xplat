import { VStack, createStore, useStore } from '@octane-xplat/ui'
import { addCollection } from '@octane-xplat/icons'
import { NanoIcon } from '@octane-xplat/nano-icons'
import type { ProbeContext } from '../../scripts/probe/context'
import { iconFixture, otherIconFixture } from './icons-data'
import { iconSnapshot, instancesShareMarkup } from './nano-icons-host'

const selection = createStore({ name: 'probe-icons:wide', color: '#123456', size: 24 })
addCollection(iconFixture)
addCollection(otherIconFixture)

export default function NanoIconsProbe() {
	const current = useStore(selection)
	return <VStack>
		<NanoIcon id="nano-main" {...current} label="Direction" />
		<NanoIcon id="nano-alias" name="probe-icons:turned" color="#123456" />
		<NanoIcon id="nano-repeat-a" name="probe-icons:gradient" />
		<NanoIcon id="nano-repeat-b" name="probe-icons:gradient" />
		<NanoIcon id="nano-tint-a" name="probe-icons:wide" color="#aa0000" />
		<NanoIcon id="nano-tint-b" name="probe-icons:wide" color="#00aa00" />
		<NanoIcon id="nano-late" name="probe-late:new" />
	</VStack>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => iconSnapshot(ctx.find('nano-main')).body.includes('#123456'))
	const main = iconSnapshot(ctx.find('nano-main'))
	ctx.assert('wide icon width', main.width, 48)
	ctx.assert('icon height', main.height, 24)
	ctx.assert('accessible label', main.label, 'Direction')
	ctx.assert('labeled icon is accessible', main.decorative, false)

	const repeatA = iconSnapshot(ctx.find('nano-repeat-a')).body
	const repeatB = iconSnapshot(ctx.find('nano-repeat-b')).body
	if (instancesShareMarkup) {
		ctx.assert('equal instances emit identical markup', repeatA === repeatB, true)
	} else {
		const first = repeatA.match(/id="(paint[^"]*)"/)?.[1]
		const second = repeatB.match(/id="(paint[^"]*)"/)?.[1]
		ctx.assert('gradient definition exists', typeof first, 'string')
		ctx.assert('live DOM ids stay unique per instance', first !== second, true)
	}

	// Tint-only variants differ in markup but keep identical geometry.
	const tintA = iconSnapshot(ctx.find('nano-tint-a'))
	const tintB = iconSnapshot(ctx.find('nano-tint-b'))
	ctx.assert('tint variants share width', tintA.width, tintB.width)
	ctx.assert('tint variants share height', tintA.height, tintB.height)
	ctx.assert('tint variants differ in markup', tintA.body !== tintB.body, true)
	ctx.assert('tinted markup carries color', tintA.body.includes('#aa0000'), true)

	ctx.assert('missing icon has no host', !!ctx.find('nano-late'), false)
	addCollection({ prefix: 'probe-late', icons: { new: { body: '<path d="M0 0h16v16z"/>' } } })
	await ctx.waitFor(() => ctx.find('nano-late'))
	ctx.assert('late registration mounts icon', !!ctx.find('nano-late'), true)

	selection.set({ name: 'probe-icons:turned', color: '#00ff00', size: 40 })
	await ctx.waitFor(() => iconSnapshot(ctx.find('nano-main')).body.includes('#00ff00'))
	ctx.assert('prop update width', iconSnapshot(ctx.find('nano-main')).width, 20)
	ctx.assert('prop update height', iconSnapshot(ctx.find('nano-main')).height, 40)

	addCollection({ ...iconFixture, icons: { ...iconFixture.icons, wide: { body: '<path fill="currentColor" d="M1 1h30v14H1z"/>' } } })
	await ctx.waitFor(() => iconSnapshot(ctx.find('nano-main')).body.includes('M1 1h30'))
	ctx.assert('replacement updates retained child', iconSnapshot(ctx.find('nano-alias')).body.includes('M1 1h30'), true)
	ctx.record('host geometry', ctx.inspect('nano-main'))
	ctx.record('evidence boundary', 'SVG host/source and updates; no visual drawing or OS accessibility traversal claim')
}
