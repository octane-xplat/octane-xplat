import { Frame } from '@nativescript/core';
export declare function registerStack(name: string, frame: Frame): void;
export declare function getStack(name: string): Frame | undefined;
/** All registered stacks in registration order — for hardware-back
 *  resolution (pop whichever stack is visibly on top). */
export declare function stackEntries(): IterableIterator<[string, Frame]>;
/** Internal: route.native attaches frame listeners as stacks appear —
 *  named frames can register after a useRoute subscription ran. */
export declare function onStackRegistered(cb: (name: string, frame: Frame) => void): void;
