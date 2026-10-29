/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

type PendingAction = { resolve(): void; reject(error: unknown): void }

export default function ButtonActionsProbe() {
	const [shown, setShown] = useState(true), [disabled, setDisabled] = useState(false)
	const [loading, setLoading] = useState(false), [interruptible, setInterruptible] = useState(false)
	const [revision, setRevision] = useState(1), [linked, setLinked] = useState(false)
	const [hinted, setHinted] = useState(true)
	const [history, setHistory] = useState<string[]>([])
	const pending = useRef<PendingAction[]>([]), alive = useRef(true)
	const record = (entry: string) => { if (alive.current) setHistory((entries) => [...entries.slice(-11), entry]) }
	useEffect(() => () => {
		alive.current = false
		const tasks = pending.current; pending.current = []
		tasks.forEach((task) => task.resolve())
	}, [])
	return <VStack gap={2}>
		<label text="Manually press Save, settle or fail pending work, and change props while it is pending. Link mode opens the documentation URL before starting the action. Hover Save to inspect its native hint after revision, loading and disabled changes. No OS action is automatic." />
		{shown ? <Button id="button-action-owner" label={`Save revision ${revision}`}
			tooltip={hinted ? `Save document revision ${revision}` : undefined}
			isDisabled={disabled} isLoading={loading} isInterruptible={interruptible}
			href={linked ? 'https://octane-xplat.goddardai.org/app/components#appkit-button-actions-and-links' : undefined}
			clickAction={() => {
				record(`accepted:${revision}`)
				return new Promise<void>((resolve, reject) => pending.current.push({ resolve, reject }))
					.then(() => record(`completed:${revision}`))
			}}
			onActionError={() => record(`failed:${revision}`)} /> : <label text="Save button removed" />}
		<Button label="Complete oldest action" clickAction={() => pending.current.shift()?.resolve()} />
		<Button label="Fail oldest action" clickAction={() => pending.current.shift()?.reject(new Error('Fixture save failed'))} />
		<Button label="Change callback revision" clickAction={() => setRevision((value) => value + 1)} />
		<Button label="Toggle disablement" clickAction={() => setDisabled((value) => !value)} />
		<Button label="Toggle external loading" clickAction={() => setLoading((value) => !value)} />
		<Button label="Toggle interruptible overlap" clickAction={() => setInterruptible((value) => !value)} />
		<Button label="Toggle pointer hint" clickAction={() => setHinted((value) => !value)} />
		<Button label="Toggle documentation link" clickAction={() => setLinked((value) => !value)} />
		<Button label="Remove or remount Save" clickAction={() => setShown((value) => !value)} />
		<label text={`disabled:${disabled}; loading:${loading}; interruptible:${interruptible}; link:${linked}`} />
		<label id="button-action-history" text={history.join(' → ')} />
	</VStack>
}

// Mount metadata only; manual clicks, URL opening, busy presentation and OS input remain unqualified.
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('button-action-owner'))
	ctx.record('qualification', 'mounted only; action lifecycle trials remain human-operated and unrun')
}
