import { useEffect, useRef } from 'octane';
import type { HoverCardProps } from './props';
import { useHoverCard } from './use-hover-card.web.tsrx';
import { cx } from './cx';

const isTextOnly = (children: any) =>
	typeof children === 'string' || typeof children === 'number';

/**
 * Hover/focus/tap-triggered floating card (Astryx `HoverCard`), web leaf.
 * The trigger is `children`; the card floats via the shared Popover
 * layer. Element children keep their own refs — listeners and position
 * anchor land on the first element child through a display:contents
 * wrapper.
 */
export function HoverCard(props: HoverCardProps) @{
	const card = useHoverCard({
		placement: props.placement,
		alignment: props.alignment,
		delay: props.delay,
		hideDelay: props.hideDelay,
		focusTrigger: props.focusTrigger,
		touchTrigger: props.touchTrigger,
		isEnabled: props.isEnabled,
		label: props.label,
		isOpen: props.isOpen,
		isDefaultOpen: props.isDefaultOpen,
		onShow: () => props.onOpenChange?.(true),
		onHide: () => props.onOpenChange?.(false),
	});

	const wrapper = useRef<HTMLElement | null>(null);
	const textOnly = isTextOnly(props.children);
	const showIndication =
		props.hasHoverIndication === true ||
		((props.hasHoverIndication ?? 'auto') === 'auto' && textOnly);

	// Position + interaction land on the first element child (the
	// display:contents wrapper has no box to anchor against).
	useEffect(() => {
		if (textOnly) return;
		const el = wrapper.current?.firstElementChild as HTMLElement | null;
		card.ref(el);
		if (!el || !props.label) {
			return;
		}

		const prevHaspopup = el.getAttribute('aria-haspopup');
		el.setAttribute('aria-haspopup', 'dialog');
		if (card.isOpen) {
			el.setAttribute('aria-controls', card.id);
		}

		return () => {
			card.ref(null);
			if (prevHaspopup == null) {
				el.removeAttribute('aria-haspopup');
			} else {
				el.setAttribute('aria-haspopup', prevHaspopup);
			}

			el.removeAttribute('aria-controls');
		};
	}, [textOnly, card.isOpen, props.label, card.id]);

	const rendered = card.renderHoverCard(props.content, {
		className: props.className,
		style: props.style,
	});

	<>
		{textOnly ? (
			<span
				ref={card.ref}
				id={props.id}
				tabIndex={0}
				className={cx(showIndication && 'vx-hovercard-indication')}
				aria-haspopup={props.label ? 'dialog' : undefined}
				aria-controls={props.label && card.isOpen ? card.id : undefined}
				aria-describedby={props.label ? undefined : card.describedBy}
				{...props.web}
			>
				{props.children}
			</span>
		) : (
			<span
				ref={(el: HTMLElement | null) => {
					wrapper.current = el;
				}}
				id={props.id}
				style={{ display: 'contents' }}
				{...props.web}
			>
				{props.children}
			</span>
		)}
		{rendered}
	</>;
}
