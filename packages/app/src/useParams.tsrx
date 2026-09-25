import { useRoute } from '@octane-xplat/ui';
import type { RouteName, RouteParams } from './routes';

/** Read the active route's params with the generated shape for its name. */
export function useParams<Name extends RouteName = RouteName>(stack = 'root'): RouteParams[Name] {
	return (useRoute(stack)?.params ?? {}) as RouteParams[Name];
}
