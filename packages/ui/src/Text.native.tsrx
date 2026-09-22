import { createContext, useContext } from 'octane';

/**
 * Nested <Text> renders a <span> (rich-text run) inside the parent's
 * label/formattedstring. Note: span-under-TextBase parenting needs the
 * driver extension from docs/decisions.md #25 — bare-text-only usage is
 * safe today.
 */
const InText = createContext(false);

export function Text(props: {
  className?: unknown;
  style?: unknown;
  children?: unknown;
}) @{
	const inText = useContext(InText);
	@if (inText) {
		<span className={props.className} style={props.style}>{props.children}</span>
	} @else {
		<label className={props.className} style={props.style}>
			<InText value={true}>{props.children}</InText>
		</label>
	}
}
