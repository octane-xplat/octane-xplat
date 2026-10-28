/** @jsxImportSource @nativescript-community/octane */
import { SwiftUIContextMenu } from '@octane-xplat/context-menu/ios'
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'
import { ShaderEffect } from '@octane-xplat/effects/ios'
import { createContext, useContext, useEffect, useState } from 'octane'
import type { ProbeContext } from '../../scripts/probe/context'

type Surface = 'sheet' | 'trigger' | 'preview' | 'shader'

const NameContext = createContext('missing')
const NameProvider: any = NameContext
const rendered: Record<Surface, string[]> = {
	sheet: [],
	trigger: [],
	preview: [],
	shader: [],
}

const mounted = new Set<Surface>()

let updateName: (value: string) => void
let setSheetEnabled: (enabled: boolean) => void
let setPreviewEnabled: (enabled: boolean) => void

function ContextLabel(props: { surface: Surface }) {
	const value = useContext(NameContext)
	rendered[props.surface].push(value)
	useEffect(() => {
		mounted.add(props.surface)
		return () => mounted.delete(props.surface)
	}, [props.surface])

	return <label id={`portal-${props.surface}`} text={`${props.surface}: ${value}`} />
}

export default function SwiftUIComponentPortals() {
	const [name, setName] = useState('Avery')
	const [sheetEnabled, setSheetEnabledState] = useState(true)
	const [preview, setPreview] = useState(true)
	updateName = setName
	setSheetEnabled = setSheetEnabledState
	setPreviewEnabled = setPreview

	return (
		<NameProvider value={name}>
			{sheetEnabled ? (
				<SwiftUIBottomSheet open content={() => <ContextLabel surface="sheet" />} />
			) : null}
			<SwiftUIContextMenu
				items={[]}
				trigger={() => <ContextLabel surface="trigger" />}
				preview={preview ? () => <ContextLabel surface="preview" /> : undefined}
			/>
			<ShaderEffect effect="unregistered-probe-effect" animate={false}>
				<ContextLabel surface="shader" />
			</ShaderEffect>
		</NameProvider>
	)
}

export async function run(ctx: ProbeContext) {
	const initialContextReachedAllHosts = () =>
		(['sheet', 'trigger', 'preview', 'shader'] as const).every(
			(surface) => mounted.has(surface) && rendered[surface].at(-1) === 'Avery',
		)

	await ctx.waitFor(initialContextReachedAllHosts, { timeout: 8000, interval: 25 })
	ctx.assert('sheet reads declaring context', rendered.sheet.at(-1), 'Avery')
	ctx.assert('context-menu trigger reads declaring context', rendered.trigger.at(-1), 'Avery')
	ctx.assert('context-menu preview reads declaring context', rendered.preview.at(-1), 'Avery')
	ctx.assert('shader effect reads declaring context', rendered.shader.at(-1), 'Avery')

	const beforeUpdate = {
		sheet: rendered.sheet.length,
		trigger: rendered.trigger.length,
		preview: rendered.preview.length,
		shader: rendered.shader.length,
	}

	updateName('Jordan')
	await ctx.waitFor(
		() =>
			rendered.sheet.length > beforeUpdate.sheet &&
			rendered.trigger.length > beforeUpdate.trigger &&
			rendered.preview.length > beforeUpdate.preview &&
			rendered.shader.length > beforeUpdate.shader &&
			(['sheet', 'trigger', 'preview', 'shader'] as const).every(
				(surface) => rendered[surface].at(-1) === 'Jordan',
			),
		{ timeout: 5000, interval: 25 },
	)

	ctx.assert('live context update reaches sheet', rendered.sheet.at(-1), 'Jordan')
	ctx.assert('live context update reaches context-menu trigger', rendered.trigger.at(-1), 'Jordan')
	ctx.assert('live context update reaches preview', rendered.preview.at(-1), 'Jordan')
	ctx.assert('live context update reaches shader effect', rendered.shader.at(-1), 'Jordan')

	setSheetEnabled(false)
	await ctx.waitFor(() => !mounted.has('sheet'), { timeout: 5000, interval: 25 })
	ctx.assert(
		'unmounting the SwiftUI sheet detaches its portal subtree',
		mounted.has('sheet'),
		false,
	)

	setSheetEnabled(true)
	await ctx.waitFor(() => mounted.has('sheet') && rendered.sheet.at(-1) === 'Jordan', {
		timeout: 8000,
		interval: 25,
	})

	ctx.assert('remounted sheet portal retains updated context', rendered.sheet.at(-1), 'Jordan')

	setPreviewEnabled(false)
	await ctx.waitFor(() => !mounted.has('preview'), { timeout: 5000, interval: 25 })
	ctx.assert('removing the preview detaches its portal subtree', mounted.has('preview'), false)
	setPreviewEnabled(true)
	await ctx.waitFor(() => mounted.has('preview') && rendered.preview.at(-1) === 'Jordan', {
		timeout: 5000,
		interval: 25,
	})

	ctx.record(
		'portal boundary evidence',
		'iOS SwiftUI sheet, context-menu trigger/preview, and shader effect',
	)
}
