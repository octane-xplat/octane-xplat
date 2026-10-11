import { Switch } from '@octane-xplat/ui'

export function SwitchStage(props: { checked: boolean; stageId: string }) @{
	<div className="visual-stage" data-story-id={props.stageId}>
		<Switch checked={props.checked} ariaLabel="Visual capture switch" />
	</div>
}

export default {
	id: 'switch',
	title: 'Switch',
	component: SwitchStage,
	args: { checked: false, stageId: 'switch--unchecked-light' },
	parameters: { appearance: 'light', profile: 'switch-light-96x64@1' },
}

export const UncheckedLight = {}

export const CheckedLight = {
	args: { checked: true, stageId: 'switch--checked-light' },
}
