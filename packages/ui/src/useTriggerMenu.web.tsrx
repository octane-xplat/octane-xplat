import { dispatchLayerKey } from './layer-stack';
import { useCallback, useEffect, useId, useRef, useState } from 'octane';
import type { ChatComposerTrigger, ChatComposerTriggerItem } from './props';
import { Popover } from './Popover.web.tsrx';
import { groupChatItems } from './chat-group-items';

export interface TriggerMenuState {
	isActive: boolean;
	activeTrigger: ChatComposerTrigger | null;
	query: string;
	items: ChatComposerTriggerItem[];
	highlightedIndex: number;
	isLoading: boolean;
}

export interface UseTriggerMenuOptions {
	triggers?: ChatComposerTrigger[];
	editableRef: { current: HTMLDivElement | null };
	onInsertToken: (token: any) => void;
	onInsertText: (text: string) => void;
	onEmitChange: () => void;
	debounceMs?: number;
}

function getTextBeforeCursor(editable: HTMLDivElement): string | null {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return null;
	const range = selection.getRangeAt(0);
	if (!range.collapsed || !editable.contains(range.startContainer)) return null;
	const node = range.startContainer;

	if (node.nodeType === Node.TEXT_NODE) {
		return (node.textContent ?? '').slice(0, range.startOffset);
	}

	return null;
}

function findActiveTrigger(
	textBeforeCursor: string,
	triggers: ChatComposerTrigger[],
): { trigger: ChatComposerTrigger; query: string; triggerStart: number } | null {

	for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
		const char = textBeforeCursor[i];
		if (char === ' ' || char === '\n') return null;
		for (const trigger of triggers) {
			if (char === trigger.character) {
				const prevChar = i > 0 ? textBeforeCursor[i - 1] : null;
				if (prevChar === null || prevChar === ' ' || prevChar === '\n') {
					return { trigger, query: textBeforeCursor.slice(i + 1), triggerStart: i };
				}
			}
		}
	}

	return null;
}

function deleteTriggerText(editable: HTMLDivElement, triggerStart: number): void {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;
	const range = selection.getRangeAt(0);
	const node = range.startContainer;
	if (node.nodeType !== Node.TEXT_NODE) return;
	const text = node.textContent ?? '';
	const cursorOffset = range.startOffset;
	node.textContent = text.slice(0, triggerStart) + text.slice(cursorOffset);
	const newRange = document.createRange();
	newRange.setStart(node, triggerStart);
	newRange.collapse(true);
	selection.removeAllRanges();
	selection.addRange(newRange);
}

/** Trigger-character menus inside the composer input — `@`/`/` detection at
 *  the caret, a Popover anchored to a caret-sized fixed span, async/sync
 *  SearchSource with debounce + cancel, and listbox keyboard navigation
 *  (arrows/Enter/Tab/Escape). */
export function useTriggerMenu(options: UseTriggerMenuOptions) {
	const {
		triggers,
		editableRef,
		onInsertToken,
		onInsertText,
		onEmitChange,
		debounceMs = 150,
	} = options;

	const listboxId = useId();
	const [state, setState] = useState<TriggerMenuState>({
		isActive: false,
		activeTrigger: null,
		query: '',
		items: [],
		highlightedIndex: 0,
		isLoading: false,
	});

	const triggerStartRef = useRef(-1);
	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const anchorSpanRef = useRef<HTMLSpanElement | null>(null);
	const anchorRef = useRef<{ current: unknown }>({ current: null });

	const removeAnchorSpan = useCallback(() => {

		if (anchorSpanRef.current) {
			anchorSpanRef.current.remove();
			anchorSpanRef.current = null;
		}

		anchorRef.current.current = null;
	}, []);

	const reset = useCallback(() => {

		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
			searchTimeoutRef.current = null;
		}

		state.activeTrigger?.searchSource.cancel?.();
		removeAnchorSpan();
		triggerStartRef.current = -1;
		setState({
			isActive: false,
			activeTrigger: null,
			query: '',
			items: [],
			highlightedIndex: 0,
			isLoading: false,
		});
	}, [state.activeTrigger, removeAnchorSpan]);

	// Anchor the popover to the caret rect: a zero-size fixed span outside the
	// contenteditable (inside would split text nodes and break offsets).
	const setAnchor = useCallback(() => {
		const editable = editableRef.current;
		if (!editable) return;

		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			anchorRef.current.current = editable;
			return;
		}

		removeAnchorSpan();
		const range = selection.getRangeAt(0).cloneRange();
		range.collapse(true);
		const rect =
			typeof range.getBoundingClientRect === 'function'
				? range.getBoundingClientRect()
				: null;

		if (!rect || (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0)) {
			anchorRef.current.current = editable;
			return;
		}

		const span = document.createElement('span');
		span.setAttribute('aria-hidden', 'true');
		span.setAttribute('data-vx-trigger-anchor', '');
		span.style.position = 'fixed';
		span.style.left = `${rect.left}px`;
		span.style.top = `${rect.top}px`;
		span.style.width = `${Math.max(rect.width, 1)}px`;
		span.style.height = `${rect.height}px`;
		span.style.pointerEvents = 'none';
		span.style.opacity = '0';
		document.body.appendChild(span);
		anchorSpanRef.current = span;
		anchorRef.current.current = span;
	}, [editableRef, removeAnchorSpan]);

	const searchItems = useCallback(
		(trigger: ChatComposerTrigger, query: string) => {

			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
				searchTimeoutRef.current = null;
			}

			const doSearch = () => {
				trigger.searchSource.cancel?.();
				setState((prev) => ({ ...prev, isLoading: true }));
				Promise.resolve(trigger.searchSource.search(query)).then(
					(items) => {
						setState((prev) => ({
							...prev,
							items,
							highlightedIndex: items.length > 0 ? 0 : -1,
							isLoading: false,
						}));
					},
					() => {
						setState((prev) => ({ ...prev, items: [], highlightedIndex: -1, isLoading: false }));
					},
				);
			};

			const testResult = trigger.searchSource.search('');
			const isAsync = testResult instanceof Promise;
			if (isAsync && debounceMs > 0) {
				setState((prev) => ({ ...prev, isLoading: true }));
				searchTimeoutRef.current = setTimeout(doSearch, debounceMs);
			} else {
				doSearch();
			}
		},
		[debounceMs],
	);

	const selectItem = useCallback(
		(item: ChatComposerTriggerItem) => {
			const trigger = state.activeTrigger;
			const editable = editableRef.current;
			if (!trigger || !editable) return;

			removeAnchorSpan();
			deleteTriggerText(editable, triggerStartRef.current);

			const result = trigger.onSelect(item);

			if (typeof result === 'string') {
				onInsertText(result);
			} else {
				onInsertToken(result);
			}

			onEmitChange();
			reset();
		},
		[state.activeTrigger, editableRef, removeAnchorSpan, onInsertText, onInsertToken, onEmitChange, reset],
	);

	const handleInput = useCallback(() => {
		if (!triggers || triggers.length === 0) return;
		const editable = editableRef.current;
		if (!editable) return;

		const textBefore = getTextBeforeCursor(editable);
		const found = textBefore === null ? null : findActiveTrigger(textBefore, triggers);

		if (!found) {
			if (state.isActive) reset();
			return;
		}

		const { trigger, query, triggerStart } = found;
		if (!state.isActive || state.activeTrigger !== trigger) {
			triggerStartRef.current = triggerStart;
			setState((prev) => ({ ...prev, isActive: true, activeTrigger: trigger, query, highlightedIndex: 0 }));
			setAnchor();
			searchItems(trigger, query);
		} else if (state.query !== query) {
			setState((prev) => ({ ...prev, query }));
			searchItems(trigger, query);
		}
	}, [triggers, editableRef, state.isActive, state.activeTrigger, state.query, reset, setAnchor, searchItems]);

	const handleKeyDown = useCallback(
		(e: any): boolean => {
			if (!state.isActive) return false;
			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault();

					setState((prev) => ({
						...prev,
						highlightedIndex: prev.highlightedIndex < prev.items.length - 1 ? prev.highlightedIndex + 1 : 0,
					}));

					return true;
				case 'ArrowUp':
					e.preventDefault();

					setState((prev) => ({
						...prev,
						highlightedIndex: prev.highlightedIndex > 0 ? prev.highlightedIndex - 1 : prev.items.length - 1,
					}));

					return true;
				case 'Enter':
				case 'Tab':

					if (state.highlightedIndex >= 0 && state.highlightedIndex < state.items.length) {
						e.preventDefault();
						selectItem(state.items[state.highlightedIndex]);
						return true;
					}

					return false;
				case 'Escape':
					dispatchLayerKey(e);
					if (!e.defaultPrevented && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); reset(); }
					return true;
				default:
					return false;
			}
		},
		[state.isActive, state.highlightedIndex, state.items, selectItem, reset],
	);

	useEffect(
		() => () => {
			if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
			removeAnchorSpan();
		},
		[removeAnchorSpan],
	);

	const getItemId = (index: number) => `${listboxId}-option-${index}`;

	const hasTriggers = (triggers?.length ?? 0) > 0;
	const menuOpen = state.isActive;
	const ariaProps = !hasTriggers
		? ({ role: 'textbox', 'aria-multiline': 'true' } as const)
		: menuOpen
			? ({
					role: 'combobox',
					'aria-expanded': true,
					'aria-controls': listboxId,
					'aria-activedescendant': state.highlightedIndex >= 0 ? getItemId(state.highlightedIndex) : undefined,
					'aria-haspopup': 'listbox',
				} as const)
			: ({ role: 'combobox', 'aria-expanded': false, 'aria-haspopup': 'listbox' } as const);

	// The list render needs the running flat index across groups — build it
	// with a plain loop, not map closures.
	const renderItems = () => {
		const trigger = state.activeTrigger;
		let flatIndex = 0;
		const out: any[] = [];

		for (const group of groupChatItems(state.items)) {
			const rows: any[] = [];

			for (const item of group.items) {
				const idx = flatIndex++;
				rows.push(
					<div
						key={item.id}
						id={getItemId(idx)}
						role="option"
						aria-selected={idx === state.highlightedIndex}
						className={['vx-chattrig-item', idx === state.highlightedIndex ? 'vx-chattrig-item--active' : undefined]}
						onMouseDown={(e: any) => {
							e.preventDefault(); // keep focus in the editable
							selectItem(item);
						}}
						onMouseEnter={() =>
							setState((prev) => ({ ...prev, highlightedIndex: idx }))
						}
					>
						{item.element ?? (trigger?.renderItem ? trigger.renderItem(item) : <span className="vx-chattrig-label">{item.label}</span>)}
					</div>,
				);
			}

			out.push(
				group.heading ? (
					<div key={`group-${group.heading}`} role="group" aria-label={group.heading}>
						<div aria-hidden="true" className="vx-chattrig-heading">{group.heading}</div>
						{rows}
					</div>
				) : (
					rows
				),
			);
		}

		return out;
	};

	const menu = (
		<Popover
			anchor={anchorRef.current}
			open={menuOpen}
			placement="top"
			dismissOnOutsideTap
			onDismiss={reset}
			className="vx-chattrig"
		>
			<div role="listbox" id={listboxId} aria-label={state.activeTrigger?.menuLabel ?? 'Suggestions'}>
				{state.isLoading ? (
					<div role="status" className="vx-chattrig-loading">
						{state.activeTrigger?.loadingText ?? 'Searching…'}
					</div>
				) : state.items.length === 0 && state.isActive ? (
					<div className="vx-chattrig-empty">{state.activeTrigger?.emptySearchResultsText ?? 'No results'}</div>
				) : (
					renderItems()
				)}
			</div>
		</Popover>
	);

	return {
		state,
		handleInput,
		handleKeyDown,
		renderMenu: () => menu,
		reset,
		ariaProps,
	};
}
