import type { BaseTypeaheadProps, ContextRenderProps, PopoverProps, SearchableItem } from './props'

/** Internal plumbing — fields used by sibling components/hooks that must not
 *  appear on the public props contracts. Not re-exported by the package
 *  entrypoints; consumers cannot set these through JSX. */

/** `useLayer` renders `Popover` with a logical-geometry adapter carrying the
 *  resolved placement/alignment. Public callers use `placement`/`alignment`. */
export interface PopoverLayerPosition {
	layerPosition?: Pick<ContextRenderProps, 'placement' | 'alignment'>
}

/** `Tokenizer` appends query-derived "Create …" entries to `BaseTypeahead`
 *  results, exempt from `minQueryLength`. */
export interface TypeaheadQueryEntries<T extends SearchableItem = SearchableItem> {
	__queryEntries?: (query: string, results: T[]) => T[]
}

export type PopoverInternalProps = PopoverProps & PopoverLayerPosition
export type BaseTypeaheadInternalProps<T extends SearchableItem = SearchableItem> =
	BaseTypeaheadProps<T> & TypeaheadQueryEntries<T>
