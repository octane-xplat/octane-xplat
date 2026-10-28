/** @jsxImportSource @nativescript-community/octane */
import './stage.ios.css'
import { Switch } from '@octane-xplat/ui'
import { SWITCH_SCENARIO } from '../../../../visual/src/scenario'

export function SwitchStage(props: {
	checked: boolean
	stageId: string
	displacement?: number
}) @{
	<masonview width="100%" height="100%" iosOverflowSafeArea={false} style={{ display: 'grid' }}>
		<masonview
			style={{
				display: 'flex',
				justifySelf: 'center',
				alignSelf: 'center',
			}}
			id={props.stageId}
			className="visual-stage"
			width={96}
			height={64}
			iosOverflowSafeArea={false}
		>
			<masonview translateX={props.displacement ?? 0} style={{ display: 'grid' }}>
				<Switch value={props.checked} testID="visual-switch" label="Visual capture switch" />
			</masonview>
		</masonview>
	</masonview>
}

export default { ...SWITCH_SCENARIO, component: SwitchStage }
export { CheckedLight, UncheckedLight } from '../../../../visual/src/scenario'
