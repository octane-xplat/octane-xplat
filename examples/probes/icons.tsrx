import { Column, createStore, useStore } from '@octane-xplat/ui'
import { Icon, addCollection } from '@octane-xplat/icons'
import type { ProbeContext } from '../../scripts/probe/context'
import { iconFixture, otherIconFixture } from './icons-data'
import { iconSnapshot } from './icons-host'

const selection = createStore({ name: 'probe-icons:wide', color: '#123456', size: 24 })
addCollection(iconFixture)
addCollection(otherIconFixture)

export default function IconsProbe() {
	const current = useStore(selection)
	return <Column>
		<Icon id="icon-main" {...current} label="Direction" />
		<Icon id="icon-alias" name="probe-icons:turned" color="#123456" />
		<Icon id="icon-other" name="probe-other:dot" />
		<Icon id="icon-gradient-a" name="probe-icons:gradient" />
		<Icon id="icon-gradient-b" name="probe-icons:gradient" />
		<Icon id="icon-late" name="probe-late:new" />
	</Column>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => iconSnapshot(ctx.find('icon-main')).body.includes('#123456'))
	const main = iconSnapshot(ctx.find('icon-main'))
	ctx.assert('wide icon width', main.width, 48)
	ctx.assert('icon height', main.height, 24)
	ctx.assert('accessible label', main.label, 'Direction')
	ctx.assert('labeled icon is accessible', main.decorative, false)
	ctx.assert('unlabeled icon is decorative', iconSnapshot(ctx.find('icon-other')).decorative, true)
	ctx.assert('alias width', iconSnapshot(ctx.find('icon-alias')).width, 12)
	ctx.assert('second collection multicolor body', iconSnapshot(ctx.find('icon-other')).body.includes('#ff0000'), true)
	const first = iconSnapshot(ctx.find('icon-gradient-a')).body.match(/id="(paint[^"]*)"/)?.[1]
	const second = iconSnapshot(ctx.find('icon-gradient-b')).body.match(/id="(paint[^"]*)"/)?.[1]
	ctx.assert('gradient definition exists', typeof first, 'string')
	ctx.assert('instance IDs differ', first !== second, true)
	ctx.assert('missing icon has no host', !!ctx.find('icon-late'), false)

	addCollection({ prefix: 'probe-late', icons: { new: { body: '<path d="M0 0h16v16z"/>' } } })
	await ctx.waitFor(() => ctx.find('icon-late'))
	ctx.assert('late registration mounts icon', !!ctx.find('icon-late'), true)

	selection.set({ name: 'probe-icons:turned', color: '#00ff00', size: 40 })
	await ctx.waitFor(() => iconSnapshot(ctx.find('icon-main')).body.includes('#00ff00'))
	ctx.assert('prop update width', iconSnapshot(ctx.find('icon-main')).width, 20)
	ctx.assert('prop update height', iconSnapshot(ctx.find('icon-main')).height, 40)

	addCollection({ ...iconFixture, icons: { ...iconFixture.icons, wide: { body: '<path fill="currentColor" d="M1 1h30v14H1z"/>' } } })
	await ctx.waitFor(() => iconSnapshot(ctx.find('icon-main')).body.includes('M1 1h30'))
	ctx.assert('replacement updates retained child', iconSnapshot(ctx.find('icon-alias')).body.includes('M1 1h30'), true)
	ctx.record('host geometry', ctx.inspect('icon-main'))
	ctx.record('evidence boundary', 'SVG host/source and updates; no visual drawing or OS accessibility traversal claim')
}
