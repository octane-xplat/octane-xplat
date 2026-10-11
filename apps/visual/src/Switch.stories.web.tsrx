import { Switch } from '@octane-xplat/ui'

export function SwitchStage(props: { checked: boolean }) @{
	<div className="visual-stage" data-story-id="switch--unchecked-light">
		<Switch checked={props.checked} ariaLabel="Mock workflow switch" />
	</div>
}

export default {
	id: 'switch',
	title: 'Switch',
	component: SwitchStage,
	args: { checked: false },
	parameters: { appearance: 'light', capture: 'mock', profile: 'switch-light-96x64@1' },
}

export const UncheckedLight = {}
