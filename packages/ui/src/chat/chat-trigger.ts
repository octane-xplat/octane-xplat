import type { ChatComposerTrigger, ChatComposerTriggerItem } from '../props'

/**
 * Declare a composer trigger whose item metadata stays typed through
 * `searchSource`, `renderItem`, and `onSelect`. `TItem` is inferred from
 * the search source, so a `@` mention trigger and a `/` command trigger
 * with different `auxiliaryData` can share one `triggers` array without
 * item assertions in the callbacks.
 *
 * @example
 * ```ts
 * const mention = defineChatComposerTrigger({
 * 	character: '@',
 * 	searchSource: createStaticSource(users),
 * 	onSelect: (user) => ({ value: `@${user.id}`, label: user.label }),
 * })
 * ```
 */
export function defineChatComposerTrigger<TItem extends ChatComposerTriggerItem>(
	trigger: ChatComposerTrigger<TItem>,
): ChatComposerTrigger<TItem> {
	return trigger
}
