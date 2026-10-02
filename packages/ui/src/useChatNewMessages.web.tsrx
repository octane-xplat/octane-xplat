import { useCallback, useEffect, useRef, useState } from 'octane';
import type { UseChatNewMessagesOptions, UseChatNewMessagesReturn } from './props';

/** Flags new chat messages while the scroll is unlocked. `contentRef`
 *  attaches a ResizeObserver to the message column: every size change fires
 *  `onResize` (so the scroll hook can follow streaming growth), and a
 *  changed last `.vx-chatmsg` element sets `hasNewMessages`. */
export function useChatNewMessages({
	isLocked,
	onResize,
}: UseChatNewMessagesOptions): UseChatNewMessagesReturn {
	const [hasNewMessages, setHasNewMessages] = useState(false);
	const lastMessageRef = useRef<Element | null>(null);
	const isLockedRef = useRef(isLocked);
	isLockedRef.current = isLocked;

	const onResizeRef = useRef(onResize);
	onResizeRef.current = onResize;

	const elementRef = useRef<HTMLElement | null>(null);
	const cleanupRef = useRef<(() => void) | null>(null);

	const attach = useCallback((el: HTMLElement) => {
		const observer = new ResizeObserver(() => {
			onResizeRef.current?.();
			const messages = el.getElementsByClassName('vx-chatmsg');
			const last = messages.length > 0 ? messages[messages.length - 1] : null;
			if (last && last !== lastMessageRef.current) {
				lastMessageRef.current = last;
				if (!isLockedRef.current) {
					setHasNewMessages(true);
				}
			}
		});

		observer.observe(el);
		cleanupRef.current = () => observer.disconnect();
	}, []);

	const detach = useCallback(() => {
		cleanupRef.current?.();
		cleanupRef.current = null;
	}, []);

	const contentRef = useCallback(
		(el: HTMLElement | null) => {
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
