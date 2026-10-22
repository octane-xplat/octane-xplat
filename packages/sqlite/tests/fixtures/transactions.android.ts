import { deleteDatabase, openDatabase, type SqliteDb } from '@octane-xplat/sqlite'
import type { ProbeContext } from '../../../../scripts/probe/context'

type OwnedDatabase = { name: string; db: SqliteDb; pending: number }

function track<T>(owned: OwnedDatabase, operation: () => Promise<T>): Promise<T> {
	owned.pending++
	return Promise.resolve().then(operation).then(
		(value) => { owned.pending--; return value },
		(error) => { owned.pending--; throw error },
	)
}

async function observe<T>(operation: Promise<T>, milliseconds = 5000) {
	const started = Date.now()
	let timer: ReturnType<typeof setTimeout> | undefined
	try {
		return await Promise.race([
			operation.then(
				(value) => ({ status: 'completed' as const, value, elapsedMs: Date.now() - started }),
				(error: unknown) => ({ status: 'rejected' as const, error: String(error), elapsedMs: Date.now() - started }),
			),
			new Promise<{ status: 'timeout'; elapsedMs: number }>((resolve) => {
				timer = setTimeout(() => resolve({ status: 'timeout', elapsedMs: Date.now() - started }), milliseconds)
			}),
		])
	} finally {
		clearTimeout(timer)
	}
}

export async function run(ctx: ProbeContext) {
	ctx.assert('SQLite runtime target is Android', ctx.target, 'android')
	const identity = `${Date.now()}-${Math.random().toString(36).slice(2)}`
	const owned: OwnedDatabase[] = []
	let phase = 'opening controls'
	let ticks = 0
	const heartbeat = setInterval(() => ticks++, 100)
	ctx.onCleanup(async () => {
		for (const connection of [...owned].reverse()) {
			// A queued close would wait on the same stalled transaction. The
			// isolated probe launcher force-stops its own app after the result.
			if (connection.pending) {
				continue
			}
			await connection.db.close()
			await deleteDatabase(connection.name)
		}
	})

	try {
		const control: OwnedDatabase = {
			name: `sqlite-runtime-${identity}-control.db`,
			db: await openDatabase(`sqlite-runtime-${identity}-control.db`, { threading: false }),
			pending: 0,
		}
		owned.push(control)
		phase = 'threading:false commit and rollback controls'
		const controls = await observe(track(control, async () => {
			await control.db.execute('CREATE TABLE entries (value INTEGER NOT NULL)')
			await control.db.transaction(async (tx) => {
				await tx.execute('INSERT INTO entries (value) VALUES (?)', [1])
			})
			const rollback = new Error('intentional rollback control')
			try {
				await control.db.transaction(async (tx) => {
					await tx.execute('INSERT INTO entries (value) VALUES (?)', [2])
					throw rollback
				})
				throw new Error('rollback control unexpectedly committed')
			} catch (error) {
				if (error !== rollback) {
					throw error
				}
			}
			return control.db.select<{ value: number }>('SELECT value FROM entries ORDER BY value')
		}))
		ctx.record('controls', controls)
		ctx.assert('threading:false controls complete successfully', controls.status, 'completed')
		if (controls.status !== 'completed') { return }
		ctx.assert('threading:false commit persists and rollback removes its write', JSON.stringify(controls.value), '[{"value":1}]')

		phase = 'opening default-threading database'
		const threaded: OwnedDatabase = {
			name: `sqlite-runtime-${identity}-default.db`,
			// Omit options to exercise the public default, not a test override.
			db: await openDatabase(`sqlite-runtime-${identity}-default.db`),
			pending: 0,
		}
		owned.push(threaded)
		phase = 'default-threading worker warmup outside a transaction'
		const warmup = await observe(track(threaded, async () => {
			await threaded.db.execute('CREATE TABLE entries (value INTEGER NOT NULL)')
			await threaded.db.execute('INSERT INTO entries (value) VALUES (?)', [10])
			return threaded.db.select<{ value: number }>('SELECT value FROM entries')
		}))
		ctx.record('defaultWorkerWarmup', warmup)
		ctx.assert('default-threading worker completes ordinary INSERT and SELECT', warmup.status, 'completed')
		if (warmup.status !== 'completed') { return }
		ctx.assert('default-threading worker returns its warmup row', JSON.stringify(warmup.value), '[{"value":10}]')

		phase = 'default-threading transaction'
		const progress = { callbackEntered: false, insertIssued: false, insertCompleted: false }
		const outcome = await observe(track(threaded, () => threaded.db.transaction(async (tx) => {
			progress.callbackEntered = true
			const insertion = tx.execute('INSERT INTO entries (value) VALUES (?)', [20])
			progress.insertIssued = true
			await insertion
			progress.insertCompleted = true
		})))
		ctx.record('defaultTransaction', { ...outcome, ...progress, watchdogFired: outcome.status === 'timeout' })
		ctx.assert('default-threading transaction reaches its callback', progress.callbackEntered, true)
		ctx.assert('default-threading transaction completes an awaited INSERT and commits', outcome.status, 'completed')
		if (outcome.status !== 'completed') { return }
		phase = 'default-threading committed rows'
		const readback = await observe(track(threaded, () => threaded.db.select<{ value: number }>('SELECT value FROM entries ORDER BY value')))
		ctx.record('defaultTransactionReadback', readback)
		ctx.assert('default-threading committed rows can be read', readback.status, 'completed')
		if (readback.status === 'completed') {
			ctx.assert('default-threading transaction persists its insert', JSON.stringify(readback.value), '[{"value":10},{"value":20}]')
		}
	} finally {
		clearInterval(heartbeat)
		ctx.record('lastPhase', phase)
		ctx.record('javascriptHeartbeatTicks', ticks)
		ctx.record('databaseCleanup', owned.map(({ name, pending }) => ({
			name,
			pending,
			ownership: pending ? 'process-stop releases pending connection; owned database file retained' : 'probe cleanup closes and deletes owned database',
		})))
	}
}
