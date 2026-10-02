import { deleteDatabase, openDatabase } from '@octane-xplat/sqlite'

const output = document.createElement('output')
output.id = 'sqlite-readiness-result'
document.body.append(output)

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) {
		throw new Error(message)
	}
}

const expectNames = (actual: { name: string }[], expected: string[], label: string) => {
	assert(
		JSON.stringify(actual.map((row) => row.name)) === JSON.stringify(expected),
		`${label}: expected ${expected.join(',')}, got ${actual.map((row) => row.name).join(',')}`,
	)
}

const run = async () => {
	const url = new URL(location.href)
	const caseId = url.searchParams.get('case')
	assert(caseId, 'missing readiness case id')

	const firstName = `xplat-sqlite-readiness-${caseId}-first.db`
	const secondName = `xplat-sqlite-readiness-${caseId}-second.db`
	const storageKey = `xplat-sqlite-readiness-${caseId}`

	if (url.searchParams.get('phase') === 'worker-error') {
		let timeoutId: ReturnType<typeof setTimeout> | undefined
		const outcome = await Promise.race([
			openDatabase(firstName).then(
				() => ({ type: 'opened' as const }),
				(error) => ({ type: 'rejected' as const, message: String(error) }),
			),
			new Promise<{ type: 'timeout' }>((resolve) => {
				timeoutId = setTimeout(() => resolve({ type: 'timeout' }), 5000)
			}),
		])

		if (timeoutId) {
			clearTimeout(timeoutId)
		}

		assert(outcome.type === 'rejected', `worker startup must reject instead of ${outcome.type}`)
		assert(outcome.message.includes('sqlite Web worker failed'), outcome.message)
		return 'worker startup failure rejects pending open'
	}

	if (url.searchParams.get('phase') === 'write') {
		await deleteDatabase(firstName)
		await deleteDatabase(secondName)

		const [first, second] = await Promise.all([openDatabase(firstName), openDatabase(secondName)])

		const persistent = first.persistent
		await first.execute('CREATE TABLE records(name TEXT NOT NULL)')
		await first.execute('INSERT INTO records(name) VALUES (?)', ['first'])

		await second.execute('CREATE TABLE records(name TEXT NOT NULL)')
		await second.execute('INSERT INTO records(name) VALUES (?)', ['second'])

		expectNames(
			await first.select<{ name: string }>('SELECT name FROM records'),
			['first'],
			'first database remains independent',
		)

		expectNames(
			await second.select<{ name: string }>('SELECT name FROM records'),
			['second'],
			'second database remains independent',
		)

		let rejectedInvalidSql = false
		try {
			await first.execute('THIS IS NOT SQL')
		} catch {
			rejectedInvalidSql = true
		}

		assert(rejectedInvalidSql, 'invalid SQL must reject its request')
		expectNames(
			await first.select<{ name: string }>('SELECT name FROM records'),
			['first'],
			'worker remains usable after SQL error',
		)

		let rolledBack = false
		try {
			await first.transaction(async (db) => {
				await db.execute('INSERT INTO records(name) VALUES (?)', ['rolled-back'])
				throw new Error('rollback probe')
			})
		} catch {
			rolledBack = true
		}

		assert(rolledBack, 'transaction callback error must reject')
		assert(
			(await first.getArray('SELECT COUNT(*) FROM records'))?.[0] === 1,
			'transaction must roll back writes',
		)

		const visited: string[] = []
		const eachCount = await first.each(
			'SELECT name FROM records',
			null,
			(_error, row) => visited.push(String(row.name)),
			(error, count) => assert(!error && count === 1, 'each completion count must match rows'),
		)

		assert(eachCount === 1 && visited[0] === 'first', 'each must visit selected rows')

		const versionBefore = await first.getUserVersion()
		await first.setUserVersion(7)
		assert(
			versionBefore === 0 && (await first.getUserVersion()) === 7,
			'user_version must round-trip',
		)

		await first.close()
		assert(!first.isOpen, 'closed database reports isOpen=false')
		expectNames(
			await second.select<{ name: string }>('SELECT name FROM records'),
			['second'],
			'closing first database leaves second open',
		)

		await second.close()

		const deleteName = `xplat-sqlite-readiness-${caseId}-delete.db`
		const deleted = await openDatabase(deleteName)
		assert(deleted.isOpen, 'new database handle reports isOpen=true')
		await deleteDatabase(deleteName)
		assert(!deleted.isOpen, 'deleteDatabase invalidates matching open handles')
		let rejectedDeletedHandle = false
		try {
			await deleted.select('SELECT 1')
		} catch {
			rejectedDeletedHandle = true
		}

		assert(rejectedDeletedHandle, 'deleted database handle rejects later operations')

		sessionStorage.setItem(`${storageKey}:persistent`, String(persistent))
		return `write phase passed; persistent=${persistent}`
	}

	const wasPersistent = sessionStorage.getItem(`${storageKey}:persistent`) === 'true'
	const reopened = await openDatabase(firstName)
	assert(
		reopened.persistent === wasPersistent,
		'persistence capability must remain stable across reload',
	)

	if (wasPersistent) {
		expectNames(
			await reopened.select<{ name: string }>('SELECT name FROM records'),
			['first'],
			'OPFS data survives reload',
		)
	} else {
		await reopened.execute('CREATE TABLE records(name TEXT NOT NULL)')
		await reopened.execute('INSERT INTO records(name) VALUES (?)', ['transient'])
		expectNames(
			await reopened.select<{ name: string }>('SELECT name FROM records'),
			['transient'],
			'transient fallback remains usable',
		)
	}

	await reopened.close()
	await deleteDatabase(firstName)
	await deleteDatabase(secondName)
	sessionStorage.removeItem(`${storageKey}:persistent`)
	return wasPersistent
		? 'OPFS reload persistence passed'
		: 'transient fallback passed; persistence was unavailable'
}

void run().then(
	(message) => {
		output.textContent = message
		document.documentElement.dataset.sqliteReadiness = 'ok'
	},
	(error) => {
		output.textContent = error instanceof Error ? (error.stack ?? error.message) : String(error)
		document.documentElement.dataset.sqliteReadiness = 'error'
		console.error('SQLite Web readiness failed', error)
	},
)
