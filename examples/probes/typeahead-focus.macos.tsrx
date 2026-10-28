/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { BaseTypeahead, Typeahead, Button, Text, TextInput, VStack, createStaticSource } from '@octane-xplat/ui'
import type { SearchableItem, TypeaheadInputHandle } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
const source = createStaticSource([{ id: 'ada', label: 'Ada' }, { id: 'grace', label: 'Grace' }, { id: 'alan', label: 'Alan' }])
export default function TypeaheadFocusProbe() {
	const input = useRef<TypeaheadInputHandle | null>(null), [selected, setSelected] = useState<SearchableItem | null>(null)
	const [mounted, setMounted] = useState(true), [blocked, setBlocked] = useState(false), [auto, setAuto] = useState(false), [last, setLast] = useState('none')
	return <VStack gap={2}>
		<Text>Check focus bootstrap, native text/debounce, field-leave cancellation, ref focus/owned blur, current selection and removal during searches. Compare initial autofocus and read-only state. Results remain inline; keyboard option selection and native listbox accessibility are separate gaps. This runner synthesizes no native events.</Text>
		<TextInput label="Other editor" placeholder="Move focus here to leave the search field" />
		{mounted ? <BaseTypeahead id="typeahead-preview" ref={input} searchSource={source} value={selected} onChange={setSelected}
			hasEntriesOnFocus hasAutoFocus={auto} isReadOnly={blocked} debounceMs={250} accessibilityLabel="Find a person"
			onChangeQuery={(text) => setLast(text)} /> : null}
		<Button label="Focus search" clickAction={() => input.current?.focus()} /><Button label="Blur owned search" clickAction={() => input.current?.blur()} />
		<Button label="Set query to Ada" clickAction={() => input.current?.setQuery('Ada')} /><Button label="Toggle mounted" clickAction={() => setMounted(!mounted)} />
		<Button label="Toggle read-only" clickAction={() => setBlocked(!blocked)} /><Button label="Toggle autofocus request" clickAction={() => setAuto(!auto)} />
		<Text>Last query: {last}; selected: {selected?.label ?? 'none'}</Text>
		<Typeahead label="Field-wrapped person" searchSource={source} value={selected} onChange={setSelected} hasEntriesOnFocus isReadOnly={blocked} />
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('typeahead-preview'))
	ctx.record('qualification', 'fixture mounted only; native focus/blur/editor/IME/notification/tap/debounce/inline layout/AX and packaging remain unqualified')
}
