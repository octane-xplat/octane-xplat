/** @jsxImportSource @octane-xplat/jsx */
import { useRef } from 'octane'
import {
	Accordion,
	Carousel,
	Collapsible,
	CollapsibleGroup,
	GridList,
	OverflowList,
	Text,
	TreeList,
	useGridList,
	VirtualList,
	View,
} from '@octane-xplat/ui'

export const events: string[] = []
export const state: Record<string, any> = {
	collapsibleOpen: null,
	groupChange: null,
	accordionSingle: null,
	accordionMulti: null,
	gridSelection: null,
	gridAction: null,
	gridSupported: null,
	gridPropsEmpty: null,
	overflowCount: -1,
	overflowIndexes: null,
	treeExpanded: null,
	treeSelection: null,
	treeAction: null,
	carousel: null,
	vlist: null,
}

function GridHookProbe() {
	const gl = useGridList()
	state.gridSupported = gl.isSupported
	state.gridPropsEmpty = gl.gridProps != null && Object.keys(gl.gridProps).length === 0
	return null
}

const carouselItems = ['ALPHA', 'BETA', 'GAMMA', 'DELTA']
const gridItems = [
	{ id: 'g1', name: 'GCELL 1' },
	{ id: 'g2', name: 'GCELL 2' },
	{ id: 'g3', name: 'GCELL 3' },
	{ id: 'g4', name: 'GCELL 4' },
]
const treeNodes = [
	{
		key: 'parent',
		label: 'PARENT NODE',
		children: [
			{ key: 'child1', label: 'CHILD ONE' },
			{ key: 'child2', label: 'CHILD TWO' },
		],
	},
	{ key: 'leaf', label: 'LEAF NODE' },
]
const vlistItems = Array.from({ length: 120 }, (_, i) => ({
	id: 'row-' + i,
	label: 'VROW ' + i,
}))

export function CollectionsProbe() @{
	const carouselRef = useRef<any>(null)
	const vlistRef = useRef<any>(null)
	state.carousel = carouselRef
	state.vlist = vlistRef

	<View style={{ flexDirection: 'column', width: 520 }}>
		<GridHookProbe />
		<Collapsible
			id="coll"
			trigger={<Text>COLL TRIGGER</Text>}
			onOpenChange={(open: boolean) => {
				state.collapsibleOpen = open
			}}
		>
			<Text>COLL BODY</Text>
		</Collapsible>
		<CollapsibleGroup
			id="cgrp"
			type="single"
			onChange={(value: string | string[]) => {
				state.groupChange = value
			}}
		>
			<Collapsible value="ga" trigger={<Text>GA TRIG</Text>}>
				<Text>GA BODY</Text>
			</Collapsible>
			<Collapsible value="gb" trigger={<Text>GB TRIG</Text>}>
				<Text>GB BODY</Text>
			</Collapsible>
		</CollapsibleGroup>
		<Accordion
			id="acc-single"
			items={[
				{ key: 's1', header: <Text>SECT ONE</Text>, content: <Text>SECT1 BODY</Text> },
				{ key: 's2', header: <Text>SECT TWO</Text>, content: <Text>SECT2 BODY</Text> },
			]}
			onOpenChange={(open: string | null) => {
				state.accordionSingle = open
			}}
		/>
		<Accordion
			id="acc-multi"
			multiple
			items={[
				{ key: 'm1', header: <Text>MULTI ONE</Text>, content: <Text>MULTI1 BODY</Text> },
				{ key: 'm2', header: <Text>MULTI TWO</Text>, content: <Text>MULTI2 BODY</Text> },
			]}
			onOpenChange={(open: string[]) => {
				state.accordionMulti = open
			}}
		/>
		<GridList
			id="grid"
			style={{ height: 80 }}
			items={gridItems}
			columns={2}
			selectionMode="single"
			onSelectionChange={(keys: any) => {
				state.gridSelection = keys === 'all' ? 'all' : [...keys]
				events.push('gridSel:' + (keys === 'all' ? 'all' : [...keys].join(',')))
			}}
			onAction={(key: any) => {
				state.gridAction = key
				events.push('gridAct:' + key)
			}}
			renderItem={(item: any) => <Text>{item.name}</Text>}
		/>
		<View style={{ width: 280 }}>
			<OverflowList
				id="ovf"
				style={{ width: 250 }}
				overflowRenderer={(items: any[]) => <Text>{'+' + items.length + ' MORE'}</Text>}
				onOverflowChange={(items: any[]) => {
					state.overflowCount = items.length
					state.overflowIndexes = items.map((item: any) => item.index)
				}}
			>
				{[0, 1, 2, 3, 4, 5, 6, 7].map((i: number) => (
					<Text key={i}>{'OVF ITEM' + i}</Text>
				))}
			</OverflowList>
		</View>
		<Carousel id="car" label="Demo carousel" style={{ height: 80 }} hasButtons hasSnap ref={carouselRef}>
			{carouselItems.map((name: string) => (
				<View key={name} style={{ width: 160, height: 64 }}>
					<Text>{'SLIDE ' + name}</Text>
				</View>
			))}
		</Carousel>
		<TreeList
			id="tree"
			nodes={treeNodes}
			selectionMode="single"
			onExpandedChange={(keys: Set<any>) => {
				state.treeExpanded = [...keys]
			}}
			onSelectionChange={(keys: any) => {
				state.treeSelection = keys === 'all' ? 'all' : [...keys]
			}}
			onAction={(key: any) => {
				state.treeAction = key
			}}
		/>
		<VirtualList
			id="vlist"
			ref={vlistRef}
			style={{ height: 140 }}
			items={vlistItems}
			renderItem={(item: any) => <Text>{item.label}</Text>}
		/>
	</View>
}
