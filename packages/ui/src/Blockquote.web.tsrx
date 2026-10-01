import type { BlockquoteProps } from './props';
import { applyEscapeProps } from './escape-props';

/** Blockquote — semantic <blockquote> with an inline-start rule and an
 *  optional <cite> attribution line. A bare <cite>, never wrapped in
 *  <footer>: <blockquote> is a sectioning root, so a footer inside it maps
 *  to a contentinfo document landmark (Astryx contract). */
export function Blockquote(props: BlockquoteProps) @{
	<blockquote
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-blockquote', props.className]}
		style={props.style}
	>
		{props.children}
		{props.cite != null && props.cite !== false ? <cite className="vx-blockquote-cite">{props.cite}</cite> : null}
	</blockquote>
}
