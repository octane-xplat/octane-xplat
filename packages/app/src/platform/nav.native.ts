import { Frame, Page } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { Detail } from '../Detail.tsrx';

/**
 * Frame stack navigation. Each pushed Page hosts its own Octane root —
 * modals/pages never share context with their presenter (decision #9).
 */
export function openDetail() {
	const frame = Frame.topmost();
	if (!frame) {
		console.log('[probe] nav: no topmost frame');
		return;
	}
	frame.navigate({
		create: () => {
			const page = new Page();
			page.actionBarHidden = true;
			// .ts → .tsrx component imports type as () => Element; cast to the
			// universal component shape the root expects.
			createNativeScriptRoot(page).render(Detail as unknown as UniversalComponent, {});
			return page;
		},
	});
	console.log('[probe] nav pushed detail');
}

export function goBack() {
	Frame.topmost()?.goBack();
	console.log('[probe] nav goBack');
}
