/** @jsxImportSource @octane-xplat/jsx */
import { Text, VStack, useMediaQuery } from '@octane-xplat/ui'
import { useWindowSize } from '@octane-xplat/platform'
import type { ProbeContext } from '../../scripts/probe/context'

export default function ResponsiveLayoutProbe() {
	const wide = useMediaQuery('(min-width: 800px)')
	const desktop = useMediaQuery('(pointer: fine) and (hover: hover)')
	const size = useWindowSize()
	return <VStack id="responsive-root" gap={2}>
		<Text id="responsive-mode">{wide ? 'wide' : 'compact'}</Text>
		<Text id="responsive-pointer">{desktop ? 'fine-hover' : 'other'}</Text>
		<Text id="responsive-width">{String(size.width)}</Text>
	</VStack>
}

// Programmatic native resize checks host notification/rendering only, not OS
// pointer input or visual parity. Run only after human authorization.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('responsive-root')?.window)
	const window = ctx.find('responsive-root').window
	const size = window.contentView.bounds.size
	const original = { width: Number(size.width), height: Number(size.height) }
	try {
		window.setContentSize({ width: 700, height: 500 })
		await ctx.waitFor(() => String(ctx.find('responsive-mode')?.stringValue) === 'compact')
		await ctx.waitFor(() => String(ctx.find('responsive-width')?.stringValue) === '700')
		window.setContentSize({ width: 1000, height: 600 })
		await ctx.waitFor(() => String(ctx.find('responsive-mode')?.stringValue) === 'wide')
		await ctx.waitFor(() => String(ctx.find('responsive-width')?.stringValue) === '1000')
		ctx.assert('desktop pointer traits', String(ctx.find('responsive-pointer')?.stringValue), 'fine-hover')
	} finally {
		window.setContentSize(original)
	}
}
