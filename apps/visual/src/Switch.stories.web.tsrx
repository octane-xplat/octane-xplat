import { SWITCH_SCENARIO } from './scenario'
import { Switch } from '@octane-xplat/ui'

export function SwitchStage(props: { checked: boolean; stageId: string; displacement?: number }) @{
	<div className="visual-stage" data-story-id={props.stageId}>
		<div style={{ transform: `translateX(${props.displacement ?? 0}px)` }}><Switch checked={props.checked} ariaLabel="Visual capture switch" /></div>
	</div>
}

export default { ...SWITCH_SCENARIO, component: SwitchStage }
export { CheckedLight, UncheckedLight } from './scenario'
