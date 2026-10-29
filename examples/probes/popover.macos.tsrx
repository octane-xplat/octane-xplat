/** @jsxImportSource @octane-xplat/jsx */
import type { NSView } from '@octane-xplat/platform/macos'
import { createContext, useContext, useRef, useState } from 'octane'
import { Button, Popover, Text, TextInput, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const Project = createContext('missing'), ProjectProvider: any = Project
function ProjectName() { return <Text>{`Current project: ${useContext(Project)}`}</Text> }
export default function PopoverProbe() {
	const anchor = useRef<NSView | null>(null), [open, setOpen] = useState(false), [second, setSecond] = useState(false)
	const [above, setAbove] = useState(false), [outside, setOutside] = useState(true)
	return <ProjectProvider value={second ? 'Second project' : 'First project'}>
		<VStack gap={2}>
			<Button id="popover-anchor" ref={anchor} label="Toggle details" clickAction={() => setOpen((value) => !value)} />
			<Popover anchor={anchor} open={open} placement={above ? 'top' : 'bottom'} alignment="center" offset={12}
				dismissOnOutsideTap={outside} onDismiss={() => setOpen(false)} className="p-4">
				<VStack gap={2}><ProjectName /><TextInput label="Retained draft" />
					<Button label="Change provider" clickAction={() => setSecond((value) => !value)} />
					<Button label="Close details" clickAction={() => setOpen(false)} /></VStack>
			</Popover>
			<Button label="Change placement" clickAction={() => setAbove((value) => !value)} />
			<Button label="Toggle outside dismissal" clickAction={() => setOutside((value) => !value)} />
			<Text>Manually open details, edit its draft and change the provider. Move/resize/scroll the anchor, test Escape and outside dismissal, then close/remount. This fixture does not qualify native input, focus, geometry or accessibility.</Text>
		</VStack>
	</ProjectProvider>
}
// Mount metadata only; no input automation or visual analysis.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('popover-anchor'))
	ctx.record('qualification', 'mounted only; native portal, geometry, input and accessibility remain unqualified')
}
