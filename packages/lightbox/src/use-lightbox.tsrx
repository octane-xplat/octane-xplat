/** @jsxImportSource @octane-xplat/jsx */
import { useCallback, useState } from 'octane'
import type { LightboxTriggerProps, UseLightboxOptions, UseLightboxReturn } from './props'
import { Lightbox } from './Lightbox.tsrx'
import { InternalTriggersProvider } from './root.tsrx'

export function useLightbox(options: UseLightboxOptions): UseLightboxReturn @{
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
	const open = useCallback((i = 0) => { setIndex(i); setIsOpen(true) }, [setIndex])
	const close = useCallback(() => setIsOpen(false), [])

	const triggers = useState(() => new Map<number, Set<any>>())[0]
	const refFor = (i: number) => (el: unknown) => {
		let set = triggers.get(i)
		if (!set) { set = new Set(); triggers.set(i, set) }
		if (el) set.add(el)
		else set.clear()
	}
	const getTriggerProps = useCallback(
		(i: number): LightboxTriggerProps => ({
			onPress: () => open(i),
			ref: refFor(i),
		}),
		[open],
	)
	const element = (
		<InternalTriggersProvider value={triggers}>
		<Lightbox
			media={options.media}
			isOpen={isOpen}
			index={index}
			onOpenChange={(o) => { setIsOpen(o); options.onOpenChange?.(o) }}
			onIndexChange={setIndex}
			maxZoom={options.maxZoom}
			hasZoom={options.hasZoom}
			hasBackdropDismiss={options.hasBackdropDismiss}
			hasWheelZoom={options.hasWheelZoom}
			triggerScroll={options.triggerScroll}
			transition={options.transition}
			hasAutoPlay={options.hasAutoPlay}
			finalFocusRef={options.finalFocusRef}
		/>
		</InternalTriggersProvider>
	)
	return { element, open, close, isOpen, index, triggerProps: getTriggerProps(0), getTriggerProps }
}
