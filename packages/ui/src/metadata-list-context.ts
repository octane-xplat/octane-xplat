import { createContext } from 'octane'

/** Resolved layout config a MetadataListItem reads to decide between the
 *  inline (label+value grid cells) and stacked (one wrapper per item) shape. */
export interface MetadataListContextValue {
	labelPosition: 'start' | 'top'
	labelWidth?: number | string
	orientation: 'vertical' | 'horizontal'
}

export const MetadataListContext = createContext<MetadataListContextValue | null>(null)
// Universal-context callability — the runtime resolves the callable form
// (same loose-typed provider idiom as field-context.ts).
export const MetadataListProvider: any = MetadataListContext
