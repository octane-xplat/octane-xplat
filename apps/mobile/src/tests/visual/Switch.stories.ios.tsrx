/** @jsxImportSource @octane-xplat/jsx */
import './stage.ios.css'
import { Switch } from '@octane-xplat/ui'
import { SWITCH_SCENARIO } from '../../../../../tools/visual/src/scenario'

export function SwitchStage(props: {
	checked: boolean
	stageId: string
	displacement?: number
}) @{
	<masonview
		iosOverflowSafeArea={false}
		style={{ display: 'grid', width: '100%', height: '100%' }}
	>
		<masonview
			style={{
				display: 'flex',
				justifySelf: 'center',
				alignSelf: 'center',
				width: 96,
				height: 64,
			}}
			id={props.stageId}
			className="visual-stage"
			iosOverflowSafeArea={false}
		>
			<masonview translateX={props.displacement ?? 0} style={{ display: 'grid' }}>
				<Switch value={props.checked} testID="visual-switch" label="Visual capture switch" />
			</masonview>
		</masonview>
	</masonview>
}

export default { ...SWITCH_SCENARIO, component: SwitchStage }
export { CheckedLight, UncheckedLight } from '../../../../../tools/visual/src/scenario'
