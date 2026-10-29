/** @jsxImportSource @octane-xplat/jsx */
import { View, CheckboxIndicator, CheckIndicator, RadioIndicator, defaultIndicators, getIndicator,
	registerIndicator, registerIndicators, indicatorScope, useIndicator } from '@octane-xplat/ui'
import type { IndicatorName, IndicatorProps, IndicatorSize } from '@octane-xplat/ui'
export { defaultIndicators, getIndicator, registerIndicator, registerIndicators, indicatorScope }
export const refs: Array<object | null> = []
const bindBox = (view: object | null) => { refs[0] = view }
const bindRadio = (view: object | null) => { refs[1] = view }
const bindCheck = (view: object | null) => { refs[2] = view }
export const reads: Record<string, number> = {}
function Watch(props: { name: IndicatorName }) @{
	const Ind = useIndicator(props.name)
	reads[props.name] = (reads[props.name] ?? 0) + 1
	@if (Ind) {
		<Ind id={'registered-' + props.name} state="checked" />
	}
}
export function CustomBox(props: IndicatorProps<'multiSelection'>) @{
	<label id={props.id} text={'box:' + props.state} />
}
export function CustomRadio(props: IndicatorProps<'singleSelection'>) @{
	<label id={props.id} text={'radio:' + props.state} />
}
export function CustomCheck(props: IndicatorProps<'singleSelection'>) @{
	<label id={props.id} text={'check:' + props.state} />
}
export function Indicators(props: {
	state: 'unchecked' | 'checked' | 'indeterminate'; size: IndicatorSize;
	disabled?: boolean; custom?: boolean;
}) @{
	<View className={indicatorScope} style={{ width: 400, height: 300, gap: 8 }}>
		<CheckboxIndicator id="box" state={props.state} size={props.size}
			isDisabled={props.disabled} ref={bindBox} className="custom-box"
			{...(props.custom ? { children: <label id="box-busy" text="Working" /> } : {})} />
		<RadioIndicator id="radio" state={props.state === 'checked' ? 'checked' : 'unchecked'}
			size={props.size} isDisabled={props.disabled} ref={bindRadio}
			{...(props.custom ? { children: <label id="radio-busy" text="Working" /> } : {})} />
		<CheckIndicator id="check" state={props.state === 'checked' ? 'checked' : 'unchecked'}
			size={props.size} isDisabled={props.disabled} ref={bindCheck}
			{...(props.custom ? { children: <label id="check-busy" text="Working" /> } : {})} />
		<Watch name="checkbox" />
		<Watch name="radio" />
		<Watch name="check" />
	</View>
}
