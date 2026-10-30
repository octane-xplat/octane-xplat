/** @jsxImportSource @octane-xplat/jsx/dom */
import { useMemo } from 'octane'
import type { LinkProviderProps } from '../../props'
import { LinkContext } from './link-context'

import type { JSX } from 'octane/jsx-runtime'
/** Bare Context objects aren't valid JSX element types under the shared
 *  typings (same workaround as ThemeProviderEl in theme/Theme.tsrx). */
const LinkProviderEl: any = LinkContext

/** LinkProvider — sets the default link component for every link-capable
 *  component in the subtree (Astryx `LinkProvider`). A per-component `as`
 *  prop still wins. On web the component replaces the `<a>` element; on
 *  native it supplies the link surface where one is rendered — nav items
 *  already route through the canonical router via `followHref`. */
export function LinkProvider(props: LinkProviderProps): JSX.Element @{
	const value = useMemo(() => ({ component: props.component }), [props.component])

	<LinkProviderEl value={value}>{props.children}</LinkProviderEl>
}
