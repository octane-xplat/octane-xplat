import { useEffect } from 'octane';
import { addBackInterceptor } from './route.native';

/** Component-scoped back interceptor — mounted screens register in
 *  render order, so the topmost screen's handler wins (interceptors run
 *  most-recent-first) before the framework's default stack pop. Return
 *  true to consume the press. Android-only: iOS has no hardware back,
 *  so the handler simply never fires there. */
export function useBackInterceptor(fn: () => boolean): void {
	useEffect(() => addBackInterceptor(fn), [fn]);
}
