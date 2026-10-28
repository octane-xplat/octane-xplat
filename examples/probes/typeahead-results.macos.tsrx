/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useState } from 'octane'
import { BaseTypeahead, Button, InternationalizationProvider, Text, TextInput, VStack, createStaticSource } from '@octane-xplat/ui'
import type { SearchableItem } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
const Team = createContext('missing provider'), TeamProvider: any = Team
const source = createStaticSource(Array.from({ length: 40 }, (_, index) => ({ id: String(index), label: `Person ${index + 1}` })))
const alternate = createStaticSource([{ id: 'current', label: 'Current replacement person' }])
function Result(props: { item: SearchableItem }) { return <Text>{useContext(Team)}: {props.item.label}</Text> }
export default function TypeaheadResultsProbe() {
	const [person, setPerson] = useState<SearchableItem | null>(null), [team, setTeam] = useState('Design')
	const [wide, setWide] = useState(false), [rtl, setRTL] = useState(false), [blocked, setBlocked] = useState(false), [shown, setShown] = useState(true), [changed, setChanged] = useState(false)
	return <VStack gap={2}>
		<Text>Manual qualification only. Focus search to open 40 suggestions outside the clipped field. Keep typing/IME active, scroll results and move the highlight. Change provider/width/RTL/source, resize and scroll the window, enter custom result content, then leave the whole field. Check anchor clicks, outside dismissal, Tab/Escape, window retirement, removal and AX. No native behavior is qualified by mounting.</Text>
		<TextInput label="Before search" />
		<InternationalizationProvider locale="en" dir={rtl ? 'rtl' : 'ltr'}>
			<TeamProvider value={team}>
				<masonview style={{ display: 'flex', flexDirection: 'column', width: 220, height: 48, overflow: 'hidden' }}>
					{shown ? <BaseTypeahead id="typeahead-results-preview" searchSource={changed ? alternate : source} value={person} onChange={setPerson}
						hasEntriesOnFocus menuWidth={wide ? 360 : undefined} placement="bottom" isReadOnly={blocked} accessibilityLabel="Choose a person"
						renderItem={(item) => <Result item={item} />} /> : null}
				</masonview>
			</TeamProvider>
		</InternationalizationProvider>
		<TextInput label="After search" />
		<Button label="Change provider" clickAction={() => setTeam(team === 'Design' ? 'Engineering' : 'Design')} />
		<Button label="Toggle width" clickAction={() => setWide(!wide)} /><Button label="Toggle RTL" clickAction={() => setRTL(!rtl)} />
		<Button label="Replace source" clickAction={() => setChanged(!changed)} /><Button label="Toggle read-only" clickAction={() => setBlocked(!blocked)} />
		<Button label="Toggle search" clickAction={() => setShown(!shown)} /><Text>Committed: {person?.label ?? 'none'}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('typeahead-results-preview'))
	ctx.record('qualification', 'mounted only; source portal/context/commit/native geometry/scroll/RTL/input/focus/IME/blur/dismissal/AX and packaging remain unqualified')
}
