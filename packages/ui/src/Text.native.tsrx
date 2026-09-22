/** @jsxImportSource @nativescript-community/octane */
import { createContext, useContext } from 'octane';

/**
 * Nested <Text> renders a <span> (rich-text run) inside the parent's
 * label/formattedstring. Note: span-under-TextBase parenting needs the
 * driver extension from docs/decisions.md #25 — bare-text-only usage is
 * safe today.
 */
// The 'octane' import is compiler-retargeted to the universal runtime on
// native; its DOM Context type signature (2-3 args) doesn't match the
// universal 1-arg callable, so type the value loosely for this leaf.
const InText: any = createContext(false);

/** Function-component wrapper: context callables aren't JSX.ElementType under
 *  the nativescript intrinsics, so provide through a component shape. */
function TextScope(props: { children?: any }) {
	return InText({ value: true, children: props.children });
}

export function Text(props: {
  className?: any;
  style?: any;
  children?: any;
}) @{
	const inText = useContext(InText);
	@if (inText) {
		<span className={props.className} style={props.style}>{props.children}</span>
	} @else {
		<label className={props.className} style={props.style}>
			<TextScope>{props.children}</TextScope>
		</label>
	}
}
