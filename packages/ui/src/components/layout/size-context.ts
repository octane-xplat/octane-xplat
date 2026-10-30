import { createContext, useContext, type Context } from 'octane'
import type { FieldControlSize } from '../../props'

/** Generic size cascade (Astryx `SizeContext`): containers such as `Toolbar`,
 *  `ButtonGroup`, and `InputGroup` provide a default size that interactive
 *  children inherit through `useSize`. `null` means no container is providing
 *  a size — controls use their own default. An explicit `size` prop always
 *  wins over the inherited value. Layer surfaces (Popover, Dialog, sheets)
 *  reset the cascade for their content, matching Astryx's layer-scoped
 *  context. */
export const SizeContext: Context<FieldControlSize | null> = createContext<FieldControlSize | null>(
	null,
)

/** Resolve the effective size from an explicit prop, the inherited context,
 *  or the given default — Astryx `useSize`. */
export function useSize<T extends string = FieldControlSize>(
	sizeProp?: T,
	defaultSize: T = 'md' as T,
): T {
	const inherited = useContext(SizeContext)
	return sizeProp ?? (inherited as T | null) ?? defaultSize
}

/** Provider alias typed `any` — Octane renders the context object itself as
 *  the provider (`<SizeContext value>`); native JSX typing rejects a bare
 *  Context as an element type, so the convention (nav-contexts.ts) is an
 *  `any`-typed alias under Astryx's `SizeProvider` name. */
export const SizeProvider: any = SizeContext
