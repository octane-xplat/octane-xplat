import type { SpacerProps } from './props';
import { applyEscapeProps } from './escape-props';

export function Spacer(props: SpacerProps) @{
	<div id={props.id} className={['vx-spacer', props.className]} style={props.style} ref={(el: any) => applyEscapeProps(el, props)} />
}
