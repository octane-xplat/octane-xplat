import { deriveRouteManifest } from '@octane-xplat/ui';

/** Shared route dir (docs/navigation-notes.md): every component file under
 *  app/ becomes a route — name = file path with [param] → :param, so
 *  app/demo/[id].tsrx registers 'demo/:id'. Platform suffixes apply to
 *  route files like anywhere else; the per-platform glob list is how a
 *  *directory* splits (invariant 1) — web keeps .web + shared, drops
 *  .native/.ios/.android. */
const files = import.meta.glob(
	[
		'./app/**/*.{tsrx,tsx}',
		'!./app/**/*.native.{tsrx,tsx}',
		'!./app/**/*.ios.{tsrx,tsx}',
		'!./app/**/*.android.{tsrx,tsx}',
	],
	{ eager: true },
);

export const routes = deriveRouteManifest(files, ['web']);
