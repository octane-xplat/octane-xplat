/** Image — a plain <img>. `src` takes any URL or data: URI. */
export function Image(props: {
	className?: any;
	style?: any;
	id?: string;
	src: string;
	alt?: string;
}) @{
	<img
		id={props.id}
		className={props.className}
		style={props.style}
		src={props.src}
		alt={props.alt}
	/>
}
