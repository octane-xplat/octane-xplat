/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useId, useRef, useState } from 'octane';
import type { ChatComposerTrigger, ChatComposerTriggerItem } from './props';
import { Popover } from './Popover.tsrx';
import { Pressable } from './Pressable.tsrx';
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
	/** Host adapter installed by the native input — reads the field text and
	 *  caret, splices trigger text out, and anchors the menu to the field. */
	hostRef: { current: ChatTriggerHost | null };
	onInsertToken: (token: any) => void;
	onInsertText: (text: string) => void;
	onEmitChange: () => void;
	debounceMs?: number;
}

/** What the trigger menu needs from the native text host. */
export interface ChatTriggerHost {
	getText(): string;
	getCaretOffset(): number;
	spliceText(start: number, end: number, insert: string): void;
	anchorView: any;
}

interface TriggerMenuItemsProps {
	state: TriggerMenuState;
	selectItem(item: ChatComposerTriggerItem): void;
}

interface TriggerMenuOverlayProps extends TriggerMenuItemsProps {
	anchor: any;
	onDismiss(): void;
}

function TriggerMenuItems(props: TriggerMenuItemsProps) @{
	let flatIndex = 0;
	@for (const group of groupChatItems(props.state.items); index groupIndex; key groupIndex) {
		<flexboxlayout flexDirection="column">
			{group.heading ? <label className="vx-chattrig-heading" text={group.heading} /> : null}
			@for (const item of group.items; key item.id) {
				const idx = flatIndex++;
				<Pressable
					className={idx === props.state.highlightedIndex ? 'vx-chattrig-item vx-chattrig-item--active' : 'vx-chattrig-item'}
					accessibilityLabel={item.label}
					accessibilityState={{ selected: idx === props.state.highlightedIndex }}
					onPress={() => props.selectItem(item)}
				>
					{item.element ?? (props.state.activeTrigger?.renderItem ? props.state.activeTrigger.renderItem(item) : <label className="vx-chattrig-label" text={item.label} />)}
				</Pressable>
			}
		</flexboxlayout>
	}
}

export function ChatTriggerMenuOverlay(props: TriggerMenuOverlayProps) @{
	<Popover
		anchor={props.anchor}
		open={props.state.isActive}
		placement="top"
		dismissOnOutsideTap
		onDismiss={props.onDismiss}
		className="vx-chattrig"
	>
		<flexboxlayout flexDirection="column" accessibilityLabel={props.state.activeTrigger?.menuLabel ?? 'Suggestions'}>
			{props.state.isLoading ? (
				<label className="vx-chattrig-loading" text={props.state.activeTrigger?.loadingText ?? 'Searching…'} />
			) : props.state.items.length === 0 && props.state.isActive ? (
				<label className="vx-chattrig-empty" text={props.state.activeTrigger?.emptySearchResultsText ?? 'No results'} />
			) : (
				<TriggerMenuItems state={props.state} selectItem={props.selectItem} />
			)}
		</flexboxlayout>
	</Popover>
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

/** Trigger-character menus for the native composer input — same contract as
 *  the web version: detect a trigger run before the caret, search the
 *  trigger's source (debounced when async), anchor a Popover to the field,
 *  tap to select. Hardware-keyboard arrow navigation isn't wired — the
 *  highlighted index still tracks for consumers that drive it. */
export function useTriggerMenu(options: UseTriggerMenuOptions) {
	const {
		triggers,
		hostRef,
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
	const anchorRef = useRef<{ current: unknown }>({ current: null });

	const reset = useCallback(() => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
			searchTimeoutRef.current = null;
		}
		state.activeTrigger?.searchSource.cancel?.();
		triggerStartRef.current = -1;
		setState({
			isActive: false,
			activeTrigger: null,
			query: '',
			items: [],
			highlightedIndex: 0,
			isLoading: false,
		});
	}, [state.activeTrigger]);

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
			const host = hostRef.current;
			if (!trigger || !host) return;

			// Remove the trigger text, then insert the pick at that offset.
			host.spliceText(triggerStartRef.current, host.getCaretOffset(), '');

			const result = trigger.onSelect(item);
			if (typeof result === 'string') {
				onInsertText(result);
			} else {
				onInsertToken(result);
			}
			onEmitChange();
			reset();
		},
		[state.activeTrigger, hostRef, onInsertText, onInsertToken, onEmitChange, reset],
	);

	/** Call from the input's text-change handler. */
	const handleInput = useCallback(() => {
		const host = hostRef.current;
		if (!triggers || triggers.length === 0 || !host) return;

		const textBefore = host.getText().slice(0, host.getCaretOffset());
		const found = findActiveTrigger(textBefore, triggers);

		if (!found) {
			if (state.isActive) reset();
			return;
		}

		const { trigger, query, triggerStart } = found;
		anchorRef.current.current = host.anchorView;
		if (!state.isActive || state.activeTrigger !== trigger) {
			triggerStartRef.current = triggerStart;
			setState((prev) => ({ ...prev, isActive: true, activeTrigger: trigger, query, highlightedIndex: 0 }));
			searchItems(trigger, query);
		} else if (state.query !== query) {
			setState((prev) => ({ ...prev, query }));
			searchItems(trigger, query);
		}
	}, [triggers, hostRef, state.isActive, state.activeTrigger, state.query, reset, searchItems]);

	const handleKeyDown = useCallback(
		(e: any): boolean => {
			if (!state.isActive) return false;
			switch (e.key) {
				case 'ArrowDown':
					e.preventDefault?.();
					setState((prev) => ({
						...prev,
						highlightedIndex: prev.highlightedIndex < prev.items.length - 1 ? prev.highlightedIndex + 1 : 0,
					}));
					return true;
				case 'ArrowUp':
					e.preventDefault?.();
					setState((prev) => ({
						...prev,
						highlightedIndex: prev.highlightedIndex > 0 ? prev.highlightedIndex - 1 : prev.items.length - 1,
					}));
					return true;
				case 'Enter':
				case 'Tab':
					if (state.highlightedIndex >= 0 && state.highlightedIndex < state.items.length) {
						e.preventDefault?.();
						selectItem(state.items[state.highlightedIndex]);
						return true;
					}
					return false;
				case 'Escape':
					reset();
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
		},
		[],
	);

	const getItemId = (index: number) => `${listboxId}-option-${index}`;
	const menuOpen = state.isActive;
	const hasTriggers = (triggers?.length ?? 0) > 0;
	const ariaProps = !hasTriggers
		? ({ role: 'textbox', 'aria-multiline': 'true' } as const)
		: menuOpen
			? ({ role: 'combobox', 'aria-expanded': true, 'aria-controls': listboxId } as const)
			: ({ role: 'combobox', 'aria-expanded': false, 'aria-haspopup': 'listbox' } as const);

	return {
		state,
		handleInput,
		handleKeyDown,
		anchor: anchorRef.current,
		selectItem,
		reset,
		ariaProps,
	};
}
