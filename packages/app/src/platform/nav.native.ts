import { Frame, Page } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { screens, type RouteName } from '../screens';

/**
 * Frame stack navigation. `navigate(name, params)` resolves the screen from
 * the shared route table; each pushed Page hosts its own Octane root —
 * modals/pages never share context with their presenter (decision #9).
 * Params land as the screen component's props.
 */
export function navigate(name: RouteName, params: Record<string, unknown> = {}) {
	const frame = Frame.topmost();
	if (!frame) {
		console.log('[probe] nav: no topmost frame');
		return;
	}
	try {
		frame.navigate({
			create: () => {
				const page = new Page();
				page.id = name + '-page';
				page.actionBarHidden = true;
				// .ts → .tsrx component imports type as () => Element; cast to the
				// universal component shape the root expects.
				createNativeScriptRoot(page).render(
					screens[name] as unknown as UniversalComponent, params);
				return page;
			},
		});
		console.log('[probe] nav pushed ' + name);
	} catch (e) {
		console.log('[probe] nav FAILED: ' + (e as Error).message);
	}
}

export function goBack() {
	Frame.topmost()?.goBack();
	console.log('[probe] nav goBack');
}
