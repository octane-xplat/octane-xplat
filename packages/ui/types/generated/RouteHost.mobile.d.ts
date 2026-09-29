/**  @jsxImportSource @nativescript-community/octane */
import type { Route } from './props.js';
type RouteHostProps = {
    screen: any;
    layouts: any[];
    params: Record<string, unknown>;
};
/**  Props a pushed screen receives inside a swap-pane host — the same shape
 *  commitRoute stamps on a native frame.navigate (params + context + _stack
 *  for self-pops + _pushed + loader results). Shared by the self-drawn Tabs
 *  pane and the platform tab bars' pane roots. */
export declare function screenParamsFor(route: Route): Record<string, unknown>;
export declare function RouteHost(props: RouteHostProps): unknown;
export {};
