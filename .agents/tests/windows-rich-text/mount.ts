import type { ViewBase } from '@nativescript/core'
import type {
	UniversalHostBatch,
	UniversalHostCommand,
	UniversalRoot,
} from 'octane/universal/native'

import {
	createNativeScriptContainer,
	type NativeScriptContainer,
	nativeScriptDriver,
	releaseNativeScriptContainer,
} from '@rich-text/driver'

import type { MockView } from './core-mock.js'

export type Command = UniversalHostCommand
export type Listener = { id: number; priority: 'discrete' }

export const create = (id: number, type: string, props: Record<string, unknown> = {}): Command => ({
	op: 'create',
	id,
	type,
	props,
})

export const insert = (
	id: number,
	parent: number | null = null,
	before: number | null = null,
): Command => ({ op: 'insert', id, parent, before })

export const update = (id: number, props: Record<string, unknown>): Command => ({
	op: 'update',
	id,
	props,
})

export const remove = (id: number, parent: number | null = null): Command => ({
	op: 'remove',
	id,
	parent,
})

export const destroy = (id: number): Command => ({ op: 'destroy', id })
export const event = (id: number, type: string, listener: Listener | null): Command => ({
	op: 'event',
	id,
	type,
	listener,
})

export const listener = (id: number): Listener => ({
	id,
	priority: 'discrete',
})

const live: NativeScriptContainer[] = []

/** Release every container `mount` created; for an `afterEach`. */
export function releaseMounted(): void {
	for (const container of live.splice(0)) {
		releaseNativeScriptContainer(container)
	}
}

/** A driver container over a mock host whose root records dispatched events. */
export function mount<H extends MockView>(host: H) {
	const container = createNativeScriptContainer(host as unknown as ViewBase)
	live.push(container)
	const dispatched: Array<{ listener: number; data: unknown }> = []
	container.root = {
		eventScope: <T>(_priority: unknown, run: () => T) => run(),
		dispatchEvent: (id: number, data: unknown) => {
			dispatched.push({ listener: id, data })
		},
	} as unknown as UniversalRoot

	return {
		container,
		host,
		dispatched,
		apply(...commands: Command[]) {
			const batch: UniversalHostBatch = {
				renderer: 'nativescript',
				version: 1,
				commands,
			}

			nativeScriptDriver.prepareBatch(container, batch, {} as never).apply()
		},
		view<T>(id: number): T {
			return nativeScriptDriver.getPublicInstance(container, id) as unknown as T
		},
	}
}
