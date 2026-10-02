/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef, useState } from 'octane';
import type { UseChatNewMessagesOptions, UseChatNewMessagesReturn } from './props';

/** Flags new chat messages while the scroll is unlocked. `contentRef`
 *  attaches to the message column view and listens to `layoutChanged`
 *  (native's ResizeObserver equivalent): every size change fires
 *  `onResize`, and a changed last child view sets `hasNewMessages`. */
export function useChatNewMessages({
	isLocked,
	onResize,
}: UseChatNewMessagesOptions): UseChatNewMessagesReturn {
	const [hasNewMessages, setHasNewMessages] = useState(false);
	const lastMessageRef = useRef<any>(null);
	const isLockedRef = useRef(isLocked);
	isLockedRef.current = isLocked;

	const onResizeRef = useRef(onResize);
	onResizeRef.current = onResize;

	const elementRef = useRef<any>(null);
	const cleanupRef = useRef<(() => void) | null>(null);

	const attach = useCallback((el: any) => {
		if (!el?.on) return;
		const onLayout = () => {
			onResizeRef.current?.();
			const count = el.getChildrenCount?.() ?? 0;
			const last = count > 0 ? el.getChildAt(count - 1) : null;
			if (last && last !== lastMessageRef.current) {
				lastMessageRef.current = last;
				if (!isLockedRef.current) {
					setHasNewMessages(true);
				}
			}
		};

		el.on('layoutChanged', onLayout);
		cleanupRef.current = () => el.off('layoutChanged', onLayout);
	}, []);

	const detach = useCallback(() => {
		cleanupRef.current?.();
		cleanupRef.current = null;
	}, []);

	const contentRef = useCallback(
		(el: any) => {
			if (el === elementRef.current) return;
			detach();
			elementRef.current = el;
			if (el) attach(el);
		},
		[attach, detach],
	);

	useEffect(() => () => detach(), [detach]);

	const dismiss = useCallback(() => setHasNewMessages(false), []);

	return { hasNewMessages, dismiss, contentRef };
}
