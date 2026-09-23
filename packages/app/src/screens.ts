import { Detail } from './Detail.tsrx';

/**
 * Shared route table (navigation.md: the *table* is shared; web assigns URLs,
 * native assigns Pages). Params land as the screen's props.
 */
export const screens = {
	detail: Detail,
} as const;

export type RouteName = keyof typeof screens;
