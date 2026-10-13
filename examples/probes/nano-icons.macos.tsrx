/** @jsxImportSource @octane-xplat/macos-renderer */
import { VStack, createStore, useStore } from '@octane-xplat/ui'
import { addCollection } from '@octane-xplat/icons'
import { NanoIcon } from '@octane-xplat/nano-icons'
import type { ProbeContext } from '../../scripts/probe/context'

const selection = createStore({ name: 'nano-appkit:wide', color: '#123456', size: 24 })
addCollection({
	prefix: 'nano-appkit', width: 32, height: 16,
	icons: {
		wide: { body: '<path fill="currentColor" d="M0 0h32v16H0z"/>' },
		gradient: { body: '<defs><linearGradient id="paint"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient></defs><path fill="url(#paint)" d="M0 0h32v16H0z"/>' },
	},
	aliases: { turned: { parent: 'wide', rotate: 1 } },
})

export default function NanoIconsMacosProbe() {
	const current = useStore(selection)
	return <VStack>
		<NanoIcon id="nano-primary" {...current} label="Direction" />
		<NanoIcon id="nano-repeat-a" name="nano-appkit:gradient" />
		<NanoIcon id="nano-repeat-b" name="nano-appkit:gradient" />
		<NanoIcon id="nano-alias" name="nano-appkit:turned" />
		<NanoIcon id="nano-late" name="probe-late:new" />
	</VStack>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('nano-primary')?.image?.valid)
	const first = ctx.find('nano-primary').image
	ctx.assert('native image valid', first.valid, true)
	ctx.assert('wide image width', first.size.width, 48)
	ctx.assert('image height', first.size.height, 24)
	ctx.assert('icon accessible label', ctx.find('nano-primary').accessibilityLabel, 'Direction')
	ctx.assert('labeled icon accessible', ctx.find('nano-primary').accessibilityElement, true)
	ctx.assert('unlabeled icon decorative', ctx.find('nano-repeat-a').accessibilityElement, false)
	ctx.assert('repeat image valid', ctx.find('nano-repeat-b').image.valid, true)
	ctx.assert('alias image width', ctx.find('nano-alias').image.size.width, 12)
	// Equal instances produce identical markup; if the renderer's source cache
	// shares decoded images, this records true. Recorded, not asserted — sharing
	// is a host cache detail, not a correctness contract.
	ctx.record('repeat instances share image', ctx.find('nano-repeat-a').image === ctx.find('nano-repeat-b').image)

	ctx.assert('missing icon has no host', !!ctx.find('nano-late'), false)
	addCollection({ prefix: 'probe-late', icons: { new: { body: '<path d="M0 0h16v16z"/>' } } })
	await ctx.waitFor(() => ctx.find('nano-late')?.image?.valid)
	ctx.assert('late registration mounts icon', ctx.find('nano-late').image.valid, true)

	selection.set({ name: 'nano-appkit:turned', color: '#00ff00', size: 40 })
	await ctx.waitFor(() => ctx.find('nano-primary').image.size.height === 40)
	ctx.assert('updated width', ctx.find('nano-primary').image.size.width, 20)
	ctx.assert('updated image valid', ctx.find('nano-primary').image.valid, true)
	ctx.record('evidence boundary', 'NSImage validity and property updates; no pixel or VoiceOver claim')
}
