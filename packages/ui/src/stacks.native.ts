import { Frame } from '@nativescript/core';

/** Named parallel stacks. A shell (Tabs with `stack` on a spec, the app
 *  entry's root frame) registers its Frame here; `navigate(name, params,
 *  {into})` resolves the target by name. Native-only concept — on web,
 *  parallel stacks map to nested routes (one linear URL stack). */
const stacks = new Map<string, Frame>();

export function registerStack(name: string, frame: Frame): void {
	stacks.set(name, frame);
}

export function getStack(name: string): Frame | undefined {
	return stacks.get(name);
}

/** All registered stacks in registration order — for hardware-back
 *  resolution (pop whichever stack is visibly on top). */
export function stackEntries(): IterableIterator<[string, Frame]> {
	return stacks.entries();
}
