/** @jsxImportSource @octane-xplat/jsx */
import { View, Text, TextInput, Pressable, Selector, MultiSelector, Field } from '@octane-xplat/ui'
import type { SelectOption } from '../../../../ui/src/props'

export const refs: Record<string, any> = {}
export const counts = { changes: [] as any[], multi: [] as string[], opens: [] as boolean[], outside: 0, queries: [] as string[], errors: 0 }
const capture = (name: string) => (view: any) => { refs[name] = view }

export const OPTIONS: SelectOption[] = [
	{ value: 'a', label: 'Alpha' },
	{ value: 'b', label: 'Beta', description: 'Second choice' },
	{ value: 'c', label: 'Gamma', isDisabled: true },
	{ value: 'd', label: 'Delta', group: 'Later' },
	{ value: 'e', label: 'Echo', group: 'Later' },
]

export function Scene(props: {
	open?: boolean
	defaultOpen?: boolean
	value?: string | null
	defaultValue?: string
	placeholder?: string
	searchable?: boolean
	hasClear?: boolean
	disabled?: boolean
	variant?: 'uncontrolled'
	nonce?: number
	multiOpen?: boolean
	multiValue?: string[]
	selectAll?: boolean
	showField?: boolean
	fieldLabel?: string
	fieldError?: string
	fieldRequired?: boolean
}) @{
	<>
		<TextInput id="sel-peer" ref={capture('peer')} defaultValue="Peer" style={{ width: 180 }} />
		{props.variant === 'uncontrolled'
			? (props.nonce ? <View><Selector
				id="sel"
				options={OPTIONS}
				placeholder={props.placeholder}
				searchable={props.searchable}
				hasClear={props.hasClear}
				isDisabled={props.disabled}
				defaultOpen
				defaultValue={props.defaultValue}
				onOpenChange={(o: boolean) => counts.opens.push(o)}
				onValueChange={(v: any) => counts.changes.push(v)}
				onChangeQuery={(q: string) => counts.queries.push(q)}
				style={{ width: 220 }}
			/></View>
			: <View><View><Selector
				id="sel"
				options={OPTIONS}
				placeholder={props.placeholder}
				searchable={props.searchable}
				hasClear={props.hasClear}
				isDisabled={props.disabled}
				defaultOpen
				defaultValue={props.defaultValue}
				onOpenChange={(o: boolean) => counts.opens.push(o)}
				onValueChange={(v: any) => counts.changes.push(v)}
				onChangeQuery={(q: string) => counts.queries.push(q)}
				style={{ width: 220 }}
			/></View></View>)
		: props.showField
			? <Field id="sel-field" label={props.fieldLabel ?? 'Assignee'} status={props.fieldError ? { type: 'error' as const, message: props.fieldError } : undefined} isRequired={props.fieldRequired}>
				<Selector
					id="sel"
					options={OPTIONS}
					placeholder={props.placeholder}
					searchable={props.searchable}
					hasClear={props.hasClear}
					isDisabled={props.disabled}
					open={props.open}
					defaultOpen={props.defaultOpen}
					value={props.value}
					defaultValue={props.defaultValue}
					onOpenChange={(o: boolean) => counts.opens.push(o)}
					onValueChange={(v: any) => counts.changes.push(v)}
					onChangeQuery={(q: string) => counts.queries.push(q)}
					style={{ width: 220 }}
				/>
			</Field>
			: <Selector
				id="sel"
				options={OPTIONS}
				placeholder={props.placeholder}
				searchable={props.searchable}
				hasClear={props.hasClear}
				isDisabled={props.disabled}
				open={props.open}
				defaultOpen={props.defaultOpen}
				value={props.value}
				defaultValue={props.defaultValue}
				onOpenChange={(o: boolean) => counts.opens.push(o)}
				onValueChange={(v: any) => counts.changes.push(v)}
				onChangeQuery={(q: string) => counts.queries.push(q)}
				style={{ width: 220 }}
			/>}
		<MultiSelector
			id="multi"
			options={OPTIONS}
			hasSelectAll={props.selectAll}
			defaultValue={props.multiValue}
			open={props.multiOpen}
			onValueChange={(v: string[]) => counts.multi.push(v.join(','))}
			style={{ width: 220, marginTop: 24 }}
		/>
		<Pressable id="sel-outside" accessibilityRole="button" style={{ width: 100, height: 32, marginTop: 24 }} onPress={() => { counts.outside++ }}><Text>Outside</Text></Pressable>
	</>
}
