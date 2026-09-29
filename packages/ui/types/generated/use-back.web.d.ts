/**  Component-scoped back interceptor — mounted screens register in
 *  render order, so the topmost screen's handler wins (interceptors run
 *  most-recent-first) before the framework's default stack pop. Return
 *  true to consume the press. On web there is nothing to intercept —
 *  the browser owns back — so this registers a never-firing handler and
 *  addBackInterceptor warns once. */
export declare function useBackInterceptor(fn: () => boolean): void;
