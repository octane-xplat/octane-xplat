import { useCallback, useState } from 'octane';
import type {
	LightboxMedia,
	LightboxTriggerProps,
	UseLightboxOptions,
	UseLightboxReturn,
} from './props';

import { Lightbox } from './Lightbox.web.tsrx';

/** Imperative lightbox control (Astryx `useLightbox`): `open(index)`
 *  shows the viewer; `triggerProps`/`getTriggerProps` spread onto a
 *  trigger element. `element` renders the lightbox — keep it mounted. */
export function useLightbox(options: UseLightboxOptions): UseLightboxReturn {
	const [isOpen, setIsOpen] = useState(false);
	const [internal, setInternal] = useState(options.defaultIndex ?? 0);
	const index = options.index ?? internal;
	const setIndex = useCallback(
		(i: number) => {
			if (options.index == null) {
				setInternal(i);
			}

			options.onIndexChange?.(i);
		},
		[options.index, options.onIndexChange],
	);

	const open = useCallback(
		(i = 0) => {
			setIndex(i);
			setIsOpen(true);
		},
		[setIndex],
	);

	const close = useCallback(() => setIsOpen(false), []);

	const getTriggerProps = useCallback(
		(i: number): LightboxTriggerProps => ({
			onPress: () => open(i),
			web: { style: { cursor: 'zoom-in' } },
		}),
		[open],
	);

	const element = (
		<Lightbox
			isOpen={isOpen}
			onOpenChange={(o: boolean) => {
				if (!o) setIsOpen(false);
			}}
			media={options.media}
			index={index}
			onIndexChange={setIndex}
			hasZoom={options.hasZoom}
			hasAutoPlay={options.hasAutoPlay}
			finalFocusRef={options.finalFocusRef}
		/>
	);

	return {
		open,
		close,
		isOpen,
		index,
		element,
		triggerProps: getTriggerProps(0),
		getTriggerProps,
	};
}
