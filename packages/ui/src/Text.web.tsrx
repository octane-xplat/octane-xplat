import type { TextProps } from "./props";
export function Text(props: TextProps) @{
	<span className={props.className} style={props.style}>{props.children}</span>
}
