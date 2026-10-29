/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useRef, useState } from 'octane'
import { Button, Heading, Outline, ScrollableArea, Text, VStack, type HostElement, type ScrollableAreaHandle } from '@octane-xplat/ui'
import { getOutlineFromViewCapabilities, useOutlineFromView } from '@octane-xplat/ui/macos'
import type { ProbeContext } from '../../scripts/probe/context'

export default function OutlineSnapshotProbe() {
	const content = useRef<ScrollableAreaHandle | null>(null), scroll = useRef<HostElement | null>(null), items = useOutlineFromView(content)
	const [controlled, setControlled] = useState(false), [active, setActive] = useState('intro'), [seek, setSeek] = useState(true), [offset, setOffset] = useState(0), [events, setEvents] = useState<string[]>([])
	const bind = useCallback((handle: ScrollableAreaHandle | null) => { content.current = handle; scroll.current = handle?.native ?? null }, [])
	const report = (event: string) => setEvents((previous) => [...previous.slice(-5), event])
	return <VStack gap={2}>
		<Text>Discovery: {getOutlineFromViewCapabilities().mode}; {items.length} headings</Text>
		<ScrollableArea id="outline-snapshot" ref={bind} height={180} label="Guide content">
			<VStack gap={2}>
				<Heading id="intro" level={1}>Introduction</Heading><VStack style={{ height: 160 }}><Text>Guide contents.</Text></VStack>
				<Heading id="account" level={2}>Your <Text weight="bold">account</Text></Heading><VStack style={{ height: 160 }}><Text>Account details.</Text></VStack>
				<Heading id="settings" level={2}>Settings</Heading><VStack style={{ height: 160 }}><Text>Settings details.</Text></VStack>
			</VStack>
		</ScrollableArea>
		<Outline items={items} scrollContainerRef={scroll} hasScrollOnClick={seek} offset={offset} activeId={controlled ? active : undefined}
			onActiveIdChange={(id) => { setActive(id); report(`active:${id}`) }} onNavigateStart={(id) => report(`start:${id}`)} onNavigateEnd={(id) => report(`end:${id}`)} />
		<Button label="Toggle controlled selection" clickAction={() => setControlled((value) => !value)} />
		<Button label="Toggle click scrolling" clickAction={() => setSeek((value) => !value)} />
		<Button label="Toggle header offset" clickAction={() => setOffset((value) => value ? 0 : 24)} />
		<Text>{events.join('; ') || 'No navigation requested'}</Text>
		<Text>Manual native qualification only. Verify discovery, seek/header offset, user scroll spy, interruption, reduced motion, keyboard/VoiceOver and cleanup separately; mounting proves none.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('outline-snapshot'))
	ctx.record('qualification', 'Outline controls mounted; native discovery/navigation unqualified')
}
