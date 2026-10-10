import { CameraCaptureError } from './types'
import type { MovieClip, MovieOutput, MovieOutputHandle } from './types'

const databaseName = 'octane-xplat-camera'
const storeName = 'movies'

type StoredMovie = { id: string; clip?: MovieClip; bytes?: Blob }

const storageError = (cause: unknown) =>
	new CameraCaptureError({
		kind:
			cause instanceof DOMException && cause.name === 'QuotaExceededError'
				? 'insufficientStorage'
				: 'storageFailed',
		operation: 'storage',
		message: 'The movie could not be committed to origin-local storage',
		cause,
	})

/** Each operation closes its database; playback survives session and page lifetimes. */
async function transact<T>(
	mode: IDBTransactionMode,
	operation: (store: IDBObjectStore, result: (value: T) => void) => void,
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		let database: IDBDatabase | undefined
		let transaction: IDBTransaction | undefined
		let result: T
		let done = false
		const finish = (cause?: unknown) => {
			if (done) {
				return
			}

			done = true
			clearTimeout(timer)
			database?.close()
			if (cause) {
				reject(storageError(cause))
			} else {
				resolve(result)
			}
		}

		const timer = setTimeout(() => {
			transaction?.abort()
			finish(new Error('Storage transaction timed out'))
		}, 15_000)

		const request = indexedDB.open(databaseName, 1)
		request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'id' })
		request.onerror = () => finish(request.error)
		request.onblocked = () => finish(new Error('Storage upgrade is blocked by another page'))
		request.onsuccess = () => {
			database = request.result
			if (done) {
				database.close()
				return
			}

			try {
				transaction = database.transaction(storeName, mode, { durability: 'strict' })
				transaction.oncomplete = () => finish()
				transaction.onabort = () =>
					finish(transaction?.error ?? new Error('Storage transaction aborted'))

				transaction.onerror = () =>
					finish(transaction?.error ?? new Error('Storage transaction failed'))

				operation(transaction.objectStore(storeName), (value) => {
					result = value
				})
			} catch (cause) {
				finish(cause)
			}
		}
	})
}

export async function reserveMovie(): Promise<string> {
	const estimate = await navigator.storage.estimate()
	if (
		estimate.quota !== undefined &&
		estimate.usage !== undefined &&
		estimate.quota - estimate.usage < 1_048_576
	) {
		throw new CameraCaptureError({
			kind: 'insufficientStorage',
			operation: 'reserve',
			message: 'Origin storage has less than 1 MiB free',
		})
	}

	const id = crypto.randomUUID()
	await transact<void>('readwrite', (store) => {
		store.add({ id })
	})

	return id
}

export async function commitMovie(id: string, bytes: Blob, clip: MovieClip): Promise<void> {
	if (!(await navigator.storage.persisted())) {
		throw new CameraCaptureError({
			kind: 'destinationUnavailable',
			operation: 'storage',
			message: 'Persistent origin storage is no longer granted',
		})
	}

	await transact<void>('readwrite', (store) => {
		store.put({ id, bytes, clip } satisfies StoredMovie)
	})

	// Reopen the committed entry before handing ownership to the app.
	const stored = await readMovie(id)
	if (!stored.bytes || stored.bytes.size !== bytes.size || !stored.clip) {
		throw storageError(new Error('Committed movie cannot be reopened'))
	}
}

export async function removeReservation(id: string): Promise<void> {
	await transact<void>('readwrite', (store) => {
		store.delete(id)
	})
}

async function readMovie(id: string): Promise<StoredMovie> {
	return transact<StoredMovie>('readonly', (store, result) => {
		const request = store.get(id)
		request.onsuccess = () => result(request.result ?? { id })
	})
}

export async function openStoredMovie(output: MovieOutput): Promise<MovieOutputHandle> {
	if (output.kind !== 'browserStorage' || output.synthetic) {
		throw new CameraCaptureError({
			kind: 'invalidArgument',
			operation: 'openOutput',
			message: 'Expected an origin-local movie reference',
		})
	}

	const stored = await readMovie(output.resourceId)
	if (!stored.bytes || !stored.clip) {
		throw new CameraCaptureError({
			kind: 'destinationUnavailable',
			operation: 'openOutput',
			message: 'Movie is missing or site data was cleared',
		})
	}

	const url = URL.createObjectURL(stored.bytes)
	let released = false
	return {
		url,
		release: () => {
			if (!released) {
				released = true
				URL.revokeObjectURL(url)
			}
		},
	}
}
