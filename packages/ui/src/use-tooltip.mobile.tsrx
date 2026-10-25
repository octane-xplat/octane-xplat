/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useId, useRef } from 'octane'
import type { ContextRenderProps, TooltipOptions, TooltipReturn } from './props'

/** Headless tooltip, iOS/Android leaf — matches `Tooltip`'s documented
 *  contract: hover/focus intent has no touch semantic, so the refs bind but
 *  no hint ever mounts. Essential information stays out of tooltip content. */
export function useTooltip(_options: TooltipOptions = {}): TooltipReturn {
	const id = useId()
	const anchor = useRef<any>(null)
	const bind = useCallback((el: any) => { anchor.current = el }, [])
	const renderTooltip = useCallback((_children: any, _props?: Omit<ContextRenderProps, 'positioning'>) => null, [])
	return { ref: bind, positionRef: bind, interactionRef: bind, anchorId: id, describedBy: id, renderTooltip }
}
