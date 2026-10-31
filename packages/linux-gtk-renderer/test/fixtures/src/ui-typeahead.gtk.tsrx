/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	BaseTypeahead,
	ComplexSelector,
	Pressable,
	SelectableCard,
	Text,
	Token,
	Tokenizer,
	Typeahead,
	TypeaheadItem,
	View,
	createStaticSource,
} from '@octane-xplat/ui'

export const events: string[] = []
export const state: Record<string, any> = {
	typeaheadPick: null,
	typeaheadQuery: null,
	basePick: null,
	tokenRemove: 0,
	tokenClick: 0,
	tokenizerChanges: [] as string[],
	complexValue: null,
	complexOpened: 0,
	cardSelects: [] as boolean[],
}

const fruits = [
	{ id: 'apple', label: 'Apple' },
	{ id: 'apricot', label: 'Apricot' },
	{ id: 'banana', label: 'Banana' },
	{ id: 'cherry', label: 'Cherry' },
]
const fruitSource = createStaticSource(fruits)

const CS_OPTIONS = ['CS-OPTION-A', 'CS-OPTION-B', 'CS-OPTION-C']

export function TypeaheadProbe() @{
	const [taValue, setTaValue] = useState<any>(null)
	const [tokens, setTokens] = useState<any[]>([{ id: 'seed', label: 'Seed' }])
	const [csValue, setCsValue] = useState<string | null>(null)

	<View style={{ display: 'flex', flexDirection: 'column', width: 560 }}>
		<Typeahead
			id="ta"
			label="Fruit"
			searchSource={fruitSource}
			value={taValue}
			onChange={(item) => {
				setTaValue(item)
				state.typeaheadPick = item?.id ?? null
			}}
			onChangeQuery={(q) => {
				state.typeaheadQuery = q
			}}
			placeholder="Pick a fruit"
		/>
		<BaseTypeahead
			inputId="bta-input"
			searchSource={fruitSource}
			value={null}
			onChange={(item) => {
				state.basePick = item?.id ?? null
			}}
			placeholder="Base search"
		/>
		<TypeaheadItem id="ta-item" item={{ id: 'solo', label: 'STANDALONE ITEM' }} />
		<View style={{ display: 'flex', flexDirection: 'row' }}>
			<Token
				id="tok-remove"
				label="REMOVABLE"
				onRemove={() => {
					state.tokenRemove += 1
				}}
			/>
			<Token
				id="tok-click"
				label="CLICKABLE"
				onClick={() => {
					state.tokenClick += 1
				}}
			/>
			<Token id="tok-link" label="LINKTOKEN" href="https://example.com/x" />
		</View>
		<Tokenizer
			id="tkz"
			label="Tags"
			searchSource={fruitSource}
			value={tokens}
			hasCreate={true}
			onChange={(items, change) => {
				setTokens([...items])
				state.tokenizerChanges.push(`${change.type}:${'item' in change ? change.item.id : ''}`)
			}}
			placeholder="Add tags"
		/>
		<ComplexSelector
			id="cs"
			label="Options"
			placeholder="Select option"
			value={csValue}
			onChange={(v) => {
				setCsValue(v)
				state.complexValue = v
			}}
			onOpenChange={(open) => {
				if (open) {
					state.complexOpened += 1
				}
			}}
		>
			{(ctx) => (
				<View style={{ display: 'flex', flexDirection: 'column' }}>
					{CS_OPTIONS.map((opt) => (
						<Pressable
							key={opt}
							id={`cs-row-${opt}`}
							accessibilityRole="button"
							onPress={() => {
								ctx.onChange(opt)
								ctx.close()
							}}
						>
							<Text>{opt}</Text>
						</Pressable>
					))}
				</View>
			)}
		</ComplexSelector>
		<SelectableCard
			id="card"
			label="Selectable card"
			isSelected={false}
			onChange={(selected) => {
				state.cardSelects.push(selected)
			}}
		>
			<Text>CARD BODY</Text>
		</SelectableCard>
	</View>
}
