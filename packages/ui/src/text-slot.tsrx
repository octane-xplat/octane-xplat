/** @jsxImportSource @nativescript-community/octane */
import { toChildArray, mapChildren } from './child-array'

/** Native layouts need a text host for primitive children. Adjacent primitives
 * share one label; supplied components keep their own hosts and styling. */
export function TextSlot(props: { children?: any; className?: string }) @{
	const runs: any[] = [];
	let text: string | null = null;
	for (const child of toChildArray(props.children)) {
		if (typeof child === 'string' || typeof child === 'number' || typeof child === 'bigint') {
			text = (text ?? '') + String(child);
		} else {
			if (text !== null) runs.push(text);
			text = null;
			runs.push(child);
		}
	}

	if (text !== null) runs.push(text);

	<>{mapChildren(runs, (child: any) =>
		typeof child === 'string'
			? <label className={props.className} whiteSpace="normal">{child}</label>
			: child
	)}</>
}
