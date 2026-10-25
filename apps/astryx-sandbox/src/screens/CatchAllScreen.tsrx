// Catch-all screen — the canonical match order ranks /*rest above the empty
// index pattern, so this route also wins '/': an empty splat delegates to
// the home screen; anything else is the pinned 404 surface.

import { HomeScreen } from './HomeScreen'
import { NotFoundScreen } from './NotFoundScreen'

export function CatchAllScreen(props: { params: { rest?: string } }) @{
	if (!props.params?.rest) {
		return <HomeScreen />
	}
	return <NotFoundScreen />
}
