/** @jsxImportSource @nativescript-community/octane */
import { expect, it } from 'vitest'
import { signal$ } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

function SignalReader(props: { value$: ReturnType<typeof signal$<number>> }) @{
	<label text={String(props.value$.get())} />
}

function SignalOwner(props: { initial: number; capture: (value$: ReturnType<typeof signal$<number>>) => void }) @{
	const value$ = signal$(props.initial);
	props.capture(value$);

	<SignalReader value$={value$} />
}

function SignalInstances(props: { capture: (value$: ReturnType<typeof signal$<number>>) => void }) @{
	<stacklayout>
		<SignalOwner initial={1} capture={props.capture} />
		<SignalOwner initial={10} capture={props.capture} />
	</stacklayout>
}

function LocalSignal(props: { capture: (value$: ReturnType<typeof useSignal$<number>>) => void }) @{
	const value$ = useSignal$(4);
	props.capture(value$);

	<label text={String(value$.get())} />
}

it('preserves declaring ownership across child readers and isolates instances', () => {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const values: ReturnType<typeof signal$<number>>[] = []
	try {
		flushUniversalSync(() => root.render(SignalInstances, { capture: (value$) => values.push(value$) }))
		const texts = () => container.children[0].children.map((child) => child.props.text)
		expect(texts()).toEqual(['1', '10'])
		flushUniversalSync(() => values[0].set(2))
		expect(texts()).toEqual(['2', '10'])
		flushUniversalSync(() => values[1].set(11))
		expect(texts()).toEqual(['2', '11'])
	} finally {
		root.unmount()
	}
})

it('uses universal hook slots for local signals and observes their writes', () => {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	let value$: ReturnType<typeof useSignal$<number>>
	try {
		flushUniversalSync(() => root.render(LocalSignal, { capture: (value) => { value$ = value } }))
		expect(container.children[0].props.text).toBe('4')
		flushUniversalSync(() => value$.set(5))
		expect(container.children[0].props.text).toBe('5')
	} finally {
		root.unmount()
	}
})
