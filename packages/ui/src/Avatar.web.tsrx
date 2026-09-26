import type { AvatarProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Avatar — circular image with a text fallback when `src` is absent.
 *  `size` sets the square + border-radius inline so the circle is identical
 *  across targets. Image load failures still show the fallback only when
 *  `src` was never provided — no error detection, by design. */
export function Avatar(props: AvatarProps) @{
	const size = props.size ?? 32;
	const box = { width: size, height: size, borderRadius: size / 2 };

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-avatar', props.className]}
		style={{ ...props.style, ...box }}
		role="img"
		aria-label={props.alt}
	>
		{props.src
			? <img className="vx-avatar-img" src={props.src} alt={props.alt} style={{ width: size, height: size, borderRadius: size / 2 }} />
			: <span className="vx-avatar-fallback">{props.fallback ?? ''}</span>}
	</div>
}
