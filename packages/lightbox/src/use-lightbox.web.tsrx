/** @jsxImportSource @octane-xplat/jsx/dom */
import { useCallback, useState } from 'octane'
import type { LightboxTriggerProps, UseLightboxOptions, UseLightboxReturn } from './props'
import { Lightbox } from './Lightbox.web.tsrx'
import { InternalTriggersContext } from './root.web.tsrx'

/** Imperative lightbox control (Astryx `useLightbox`): `open(index)`
 *  shows the viewer; `triggerProps`/`getTriggerProps` spread onto a
 *  trigger element. `element` renders the lightbox — keep it mounted. */
export function useLightbox(options: UseLightboxOptions): UseLightboxReturn {
	const [isOpen, setIsOpen] = useState(false)
	const [internal, setInternal] = useState(options.defaultIndex ?? 0)
	const index = options.index ?? internal
	const setIndex = useCallback(
		(i: number) => {
			if (options.index == null) setInternal(i)
			options.onIndexChange?.(i)
		},
		[options.index, options.onIndexChange],
	)
	const open = useCallback(
		(i = 0) => {
			setIndex(i)
			setIsOpen(true)
		},
		[setIndex],
	)
	const close = useCallback(() => setIsOpen(false), [])

	const triggers = useState(() => new Map<number, Set<HTMLElement>>())[0]
	const refFor = (i: number) => (el: unknown) => {
		let set = triggers.get(i)
		if (!set) {
			set = new Set()
			triggers.set(i, set)
		}
		if (el) set.add(el as HTMLElement)
		else set.clear()
	}
	const getTriggerProps = useCallback(
		(i: number): LightboxTriggerProps => ({
			onPress: () => open(i),
			ref: refFor(i),
			web: { style: { cursor: 'zoom-in' } },
		}),
		[open],
	)

	const element = (
		<InternalTriggersContext value={triggers}>
		<Lightbox
			isOpen={isOpen}
			onOpenChange={(o: boolean) => {
				setIsOpen(o)
				options.onOpenChange?.(o)
			}}
			media={options.media}
			index={index}
			onIndexChange={setIndex}
			hasZoom={options.hasZoom}
			maxZoom={options.maxZoom}
			hasBackdropDismiss={options.hasBackdropDismiss}
			hasWheelZoom={options.hasWheelZoom}
			triggerScroll={options.triggerScroll}
			transition={options.transition}
			hasAutoPlay={options.hasAutoPlay}
			finalFocusRef={options.finalFocusRef}
		/>
		</InternalTriggersContext>
	)

	return { open, close, isOpen, index, element, triggerProps: getTriggerProps(0), getTriggerProps }
}
