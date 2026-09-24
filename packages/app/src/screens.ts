import { registerScreens } from '@octane-xplat/ui';
import { Detail } from './Detail.tsrx';
import { DemoDetail } from './DemoDetail.tsrx';

/**
 * Shared route table (navigation.md: the *table* is shared; web assigns URLs,
 * native assigns Pages). Params land as the screen's props.
 */
export const screens = {
	detail: Detail,
	demo: DemoDetail,
} as const;

export type RouteName = keyof typeof screens;

// Importing the table registers it — native pushRoute resolves route.name
// through this, web outlets use it when Tabs has no resolveScreen prop.
registerScreens(screens);
