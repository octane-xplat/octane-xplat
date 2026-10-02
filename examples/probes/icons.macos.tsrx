/** @jsxImportSource @octane-xplat/macos-renderer */
import { Column, Image, Icon as GlyphIcon, registerIcons, createStore, useStore } from '@octane-xplat/ui'
import { Icon, addCollection } from '@octane-xplat/icons'
import type { ProbeContext } from '../../scripts/probe/context'

const selection = createStore({ name: 'appkit-svg:wide', color: '#123456', size: 24 })
registerIcons({ 'appkit-glyph': { svg: 'M0 0h24v24H0z' } })
addCollection({
	prefix: 'appkit-svg', width: 32, height: 16,
	icons: {
		wide: { body: '<path fill="currentColor" d="M0 0h32v16H0z"/>' },
		gradient: { body: '<defs><linearGradient id="paint"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient></defs><path fill="url(#paint)" d="M0 0h32v16H0z"/>' },
	},
	aliases: { turned: { parent: 'wide', rotate: 1 } },
})

export default function AppKitSvgProbe() {
	const current = useStore(selection)
	return <Column>
		<Icon id="svg-primary" {...current} label="Direction" />
		<Icon id="svg-late" name="probe-late:new" />
		<Icon id="svg-gradient" name="appkit-svg:gradient" />
		<Icon id="svg-alias" name="appkit-svg:turned" />
		<Image id="svg-inline" src='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="9"><path d="M0 0h18v9H0z"/></svg>' alt="Inline SVG" />
		<Image id="svg-uri" src='data:image/svg+xml,%3Csvg%20xmlns="http://www.w3.org/2000/svg"%20width="10"%20height="20"%3E%3Cpath%20d="M0%200h10v20H0z"/%3E%3C/svg%3E' />
		<Image id="svg-base64" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSI3Ij48cGF0aCBkPSJNMCAwaDE0djdIMHoiLz48L3N2Zz4=" />
		<GlyphIcon id="svg-glyph" name="appkit-glyph" size={22} />
	</Column>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('svg-primary')?.image?.valid)
	const first = ctx.find('svg-primary').image
	ctx.assert('inline UI SVG valid', ctx.find('svg-inline').image.valid, true)
	ctx.assert('base64 UI SVG width', ctx.find('svg-base64').image.size.width, 14)
	ctx.assert('unlabeled UI Image decorative', ctx.find('svg-uri').accessibilityElement, false)
	ctx.assert('URI UI SVG height', ctx.find('svg-uri').image.size.height, 20)
	ctx.assert('icon accessible label', ctx.find('svg-primary').accessibilityLabel, 'Direction')
	ctx.assert('UI glyph SVG valid', ctx.find('svg-glyph').image.valid, true)
	ctx.assert('unlabeled icon decorative', ctx.find('svg-gradient').accessibilityElement, false)
	ctx.assert('labeled icon accessible', ctx.find('svg-primary').accessibilityElement, true)
	ctx.assert('native image valid', first.valid, true)
	ctx.assert('wide image width', first.size.width, 48)
	ctx.assert('image height', first.size.height, 24)
	ctx.assert('native image has representation', first.representations.count > 0, true)
	ctx.assert('gradient image valid', ctx.find('svg-gradient').image.valid, true)
	ctx.assert('alias image width', ctx.find('svg-alias').image.size.width, 12)
	ctx.assert('alias image height', ctx.find('svg-alias').image.size.height, 24)
	selection.set({ name: 'appkit-svg:turned', color: '#00ff00', size: 40 })
	await ctx.waitFor(() => ctx.find('svg-primary').image.size.height === 40)
	ctx.assert('updated width', ctx.find('svg-primary').image.size.width, 20)
	ctx.assert('updated image valid', ctx.find('svg-primary').image.valid, true)
	addCollection({ prefix: 'appkit-svg', width: 32, height: 16, icons: {
		turned: { width: 32, height: 16, body: '<circle fill="currentColor" cx="8" cy="8" r="6"/>' },
		gradient: { body: '<path d="M0 0h32v16z"/>' },
	} })

	await ctx.waitFor(() => ctx.find('svg-primary').image.size.width === 80)
	ctx.assert('replacement changes intrinsic width', ctx.find('svg-primary').image.size.width, 80)
	ctx.assert('replacement image valid', ctx.find('svg-primary').image.valid, true)
	ctx.assert('missing icon has no host', !!ctx.find('svg-late'), false)
	addCollection({ prefix: 'probe-late', icons: { new: { body: '<path d="M0 0h16v16z"/>' } } })
	await ctx.waitFor(() => ctx.find('svg-late'))
	ctx.assert('late registration decodes image', ctx.find('svg-late').image.valid, true)
	ctx.record('image representation', String(ctx.find('svg-primary').image))
	ctx.record('geometry', ctx.inspect('svg-primary'))
	ctx.record('evidence boundary', 'Native NSImage validity and host updates only; no screenshots, pixel fidelity, or old-macOS guarantee')
}
