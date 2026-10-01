/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef, useState } from 'octane';
import type {
	ChatScrollToBottomOptions,
	UseChatStreamScrollOptions,
	UseChatStreamScrollReturn,
} from './props';

/** Native follow-the-stream scroll behavior. `scrollRef.current` is the NS
 *  ScrollView (ChatLayout binds it). Lock/unlock semantics match web:
 *  scrolling up unlocks, settling near the bottom re-locks. The spring maps
 *  to the platform's animated scroll (`scrollToVerticalOffset(_, true)`);
 *  `behavior:'instant'` jumps. */
export function useChatStreamScroll({
	scrollRef,
	enabled = true,
	lockThreshold = 10,
	buttonThreshold = 100,
}: UseChatStreamScrollOptions): UseChatStreamScrollReturn {
	const [isScrolledUp, setIsScrolledUp] = useState(false);
	const [isLocked, setIsLocked] = useState(true);
	const lockedRef = useRef(true);
	const lastOffsetRef = useRef(0);
	const initialFillPendingRef = useRef(true);

	const setLocked = useCallback((locked: boolean) => {
		lockedRef.current = locked;
		setIsLocked(locked);
	}, []);

	const bottomOffset = useCallback(() => {
		const el = scrollRef.current;
		return el ? Math.max(0, (el.scrollableHeight ?? 0)) : 0;
	}, [scrollRef]);

	const jumpToBottom = useCallback(() => {
		const el = scrollRef.current;
		if (!el?.scrollToVerticalOffset) return;
		const target = bottomOffset();
		el.scrollToVerticalOffset(target, false);
		lastOffsetRef.current = target;
	}, [scrollRef, bottomOffset]);

	const scrollToBottom = useCallback(
		(options?: ChatScrollToBottomOptions) => {
			setLocked(true);
			setIsScrolledUp(false);
			initialFillPendingRef.current = false;
			const el = scrollRef.current;
			if (!el?.scrollToVerticalOffset) return;
			const target = bottomOffset();
			el.scrollToVerticalOffset(target, options?.behavior !== 'instant');
			lastOffsetRef.current = target;
		},
		[setLocked, scrollRef, bottomOffset],
	);

	const scrollToMessage = useCallback(
		(el: any) => {
			const container = scrollRef.current;
			if (!container?.scrollToVerticalOffset || !el?.getLocationRelativeTo) return;
			const point = el.getLocationRelativeTo(container);
			if (!point) return;
			const target = container.verticalOffset + point.y;
			container.scrollToVerticalOffset(Math.max(0, target), false);
			lastOffsetRef.current = target;
		},
		[scrollRef],
	);

	const scrollToLastMessage = useCallback(() => {
		const container = scrollRef.current;
		const content = container?.getChildAt ? container.getChildAt(0) : null;
		if (!content?.getChildrenCount) return;
		const count = content.getChildrenCount();
		const last = count > 0 ? content.getChildAt(count - 1) : null;
		if (last) scrollToMessage(last);
	}, [scrollRef, scrollToMessage]);

	const lock = useCallback(() => {
		setLocked(true);
		setIsScrolledUp(false);
		scrollToBottom();
	}, [setLocked, scrollToBottom]);

	const unlock = useCallback(() => {
		setLocked(false);
	}, [setLocked]);

	const scrollIfLocked = useCallback(() => {
		if (!enabled || !lockedRef.current) return;
		const el = scrollRef.current;
		if (!el?.scrollToVerticalOffset) return;
		if (initialFillPendingRef.current && el.scrollableHeight > 0) {
			initialFillPendingRef.current = false;
			jumpToBottom();
			return;
		}
		el.scrollToVerticalOffset(bottomOffset(), true);
	}, [enabled, scrollRef, jumpToBottom, bottomOffset]);

	useEffect(() => {
		const el = scrollRef.current;
		if (!el?.on || !enabled) return;

		lastOffsetRef.current = el.verticalOffset ?? 0;

		const onScroll = () => {
			const offset = el.verticalOffset ?? 0;
			const dist = (el.scrollableHeight ?? 0) - offset;
			setIsScrolledUp(dist > buttonThreshold);
			const isScrollingUp = offset < lastOffsetRef.current;
			lastOffsetRef.current = offset;
			if (isScrollingUp && dist > 1 && lockedRef.current) {
				setLocked(false);
			}
			if (dist <= lockThreshold) {
				setLocked(true);
			}
		};

		el.on('scroll', onScroll);

		// Content already present at mount → position at the bottom.
		setTimeout(() => {
			if ((el.scrollableHeight ?? 0) > 0 && lockedRef.current) {
				jumpToBottom();
				initialFillPendingRef.current = false;
			}
		}, 0);

		return () => el.off('scroll', onScroll);
	}, [scrollRef, enabled, lockThreshold, buttonThreshold, setLocked, jumpToBottom]);

	return {
		isScrolledUp,
		isLocked,
		scrollToBottom,
		scrollToMessage,
		lock,
		unlock,
		scrollIfLocked,
		scrollToLastMessage,
	};
}
