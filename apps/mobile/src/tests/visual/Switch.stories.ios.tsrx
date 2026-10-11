/** @jsxImportSource @nativescript-community/octane */
import './stage.ios.css'
import { Switch } from '@octane-xplat/ui'
import { SWITCH_SCENARIO } from '../../../../visual/src/scenario'

export function SwitchStage(props: { checked: boolean; stageId: string; displacement?: number }) @{
	<gridlayout width="100%" height="100%" iosOverflowSafeArea={false}>
		<flexboxlayout horizontalAlignment="center" verticalAlignment="middle" id={props.stageId} className="visual-stage" width={96} height={64} iosOverflowSafeArea={false}>
			<gridlayout translateX={props.displacement ?? 0}>
				<Switch checked={props.checked} testID="visual-switch" label="Visual capture switch" />
			</gridlayout>
		</flexboxlayout>
	</gridlayout>
}

export default { ...SWITCH_SCENARIO, component: SwitchStage }
export { CheckedLight, UncheckedLight } from '../../../../visual/src/scenario'
