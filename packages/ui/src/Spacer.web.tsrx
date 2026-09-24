import type { SpacerProps } from './props';
import { applyEscapeProps } from './escape-props';

export function Spacer(props: SpacerProps) @{
	<div className={['vx-spacer', props.className]} style={props.style} ref={(el: any) => applyEscapeProps(el, props)} />
}
