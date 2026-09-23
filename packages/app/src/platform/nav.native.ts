import { Frame, Page } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import { getStack } from '@xplat/ui';
import { screens, type RouteName } from '../screens';

/**
 * Frame stack navigation. `navigate(name, params, {into})` resolves the
 * screen from the shared route table and pushes onto the named stack —
 * each pushed Page hosts its own Octane root (modals/pages never share
 * context with their presenter — decision #9). Params land as props; the
 * target stack name is injected as `_stack` so the pushed screen can
 * `goBack({into})` its own stack. Default target: the 'root' stack
 * (registered at app boot), falling back to Frame.topmost().
 */
function resolveStack(into?: string): Frame | undefined {
	return ((into && getStack(into)) || getStack('root') || Frame.topmost()) as Frame | undefined;
}

export function navigate(
	name: RouteName,
	params: Record<string, unknown> = {},
	opts: { into?: string } = {},
) {
	const frame = resolveStack(opts.into);
	if (!frame) {
		console.log('[probe] nav: no stack for ' + (opts.into ?? 'root'));
		return;
	}
	// TabViewItem-hosted frames report isLoaded=false after tab selection
	// lifecycle churn (item views skip the normal view-tree parent/load
	// path); without this, _processNextNavigationEntry defers every push
	// forever. callLoaded is idempotent once the flag holds.
	if (!(frame as any).isLoaded) (frame as any).callLoaded?.();
	try {
		const props = opts.into ? { ...params, _stack: opts.into } : params;
		frame.navigate({
			create: () => {
				const page = new Page();
				page.id = name + '-page';
				page.actionBarHidden = true;
				// .ts → .tsrx component imports type as () => Element; cast to the
				// universal component shape the root expects.
				createNativeScriptRoot(page).render(
					screens[name] as unknown as UniversalComponent, props);
				return page;
			},
		});
		console.log('[probe] nav pushed ' + name + ' into ' + (opts.into ?? 'root'));
	} catch (e) {
		console.log('[probe] nav FAILED: ' + (e as Error).message);
	}
}

export function goBack(opts: { into?: string } = {}) {
	resolveStack(opts.into)?.goBack();
	console.log('[probe] nav goBack ' + (opts.into ?? 'root'));
}
