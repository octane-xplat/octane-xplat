import { File, Folder, knownFolders, path as nsPath } from '@nativescript/core'
import {
	appInfo,
	clipboard,
	connectivity,
	device,
	keepAwake,
	random,
	storage,
} from '@octane-xplat/platform'
import { files } from '@octane-xplat/files'
import { Windows } from '@octane-xplat/platform/windows'

type Emit = (event: string, data?: Record<string, unknown>) => void

const PERSIST_KEY = 'core20-service-persist'

async function clipboardSpec(): Promise<Record<string, unknown>> {
	const unicode = 'Core20 café  🔒 §±'
	const absentBefore = clipboard.canCopy ? await clipboard.readText() : null
	const wrote = await clipboard.writeText(unicode)
	const readBack = wrote ? await clipboard.readText() : null
	const wroteEmpty = await clipboard.writeText('')
	const readEmpty = await clipboard.readText()
	return {
		canCopy: clipboard.canCopy,
		wrote,
		readBack,
		matched: readBack === unicode,
		absentBefore: absentBefore ?? null,
		wroteEmpty,
		readEmpty,
		emptyRoundtrips: wroteEmpty && readEmpty === '',
	}
}

async function randomSpec(): Promise<Record<string, unknown>> {
	const supported = random.supported
	const small = supported ? Array.from(random.bytes(32)) : []
	const zero = supported ? random.bytes(0).length : -1
	const a = supported ? Array.from(random.bytes(16)) : []
	const b = supported ? Array.from(random.bytes(16)) : []
	const filled = new Uint8Array(70000)
	if (supported) {
		random.fill(filled)
	}
	let filledDistinct = 0
	if (supported) {
		const seen = new Set<number>()
		for (const byte of filled.subarray(0, 4096)) {
			seen.add(byte)
		}
		filledDistinct = seen.size
	}
	let nonViewError = ''
	try {
		random.fill({} as never)
	} catch (error) {
		nonViewError = error instanceof TypeError ? 'TypeError' : String(error)
	}
	let negativeError = ''
	try {
		random.bytes(-1)
	} catch (error) {
		negativeError = error instanceof RangeError ? 'RangeError' : String(error)
	}
	return {
		supported,
		smallLength: small.length,
		zeroLength: zero,
		smallDistinct: new Set(small).size > 1,
		consecutiveDistinct: a.join(',') !== b.join(','),
		filledDistinct,
		nonViewError,
		negativeError,
	}
}

function storageProbe(): Record<string, unknown> {
	try {
		const values = Windows?.Storage?.ApplicationData?.Current?.LocalSettings?.Values
		if (!values) {
			return { valuesPresent: false }
		}
		return {
			valuesPresent: true,
			hasLookup: typeof values.Lookup === 'function',
			hasInsert: typeof values.Insert === 'function',
			hasRemove: typeof values.Remove === 'function',
			hasHasKey: typeof values.HasKey === 'function',
			hasFirst: typeof values.First === 'function',
			hasSize: typeof values.Size === 'number' || typeof values.Size === 'function',
			ownKeys: Object.getOwnPropertyNames(values).slice(0, 24).join(','),
			protoKeys: Object.getOwnPropertyNames(Object.getPrototypeOf(values) ?? {}).slice(0, 24).join(','),
		}
	} catch (error) {
		return { valuesPresent: false, probeError: String(error) }
	}
}

async function storageSpec(persistValue?: string): Promise<Record<string, unknown>> {
	const key = 'core20-service-rt'
	const hadBefore = storage.getString(key)
	storage.setString(key, 'roundtrip')
	const read = storage.getString(key)
	storage.setString(key, '')
	const emptyRead = storage.getString(key)
	storage.setString(key, 'ctrl')
	const ctrlRead = storage.getString(key)
	storage.remove(key)
	const removedRead = storage.getString(key)
	const persistRead = persistValue === undefined ? storage.getString(PERSIST_KEY) : null
	if (persistValue !== undefined) {
		storage.setString(PERSIST_KEY, persistValue)
	}
	return {
		hadBefore,
		read,
		emptyRead,
		ctrlRead,
		removedRead,
		persistRead,
		persistWrote: persistValue ?? null,
		flush: storage.flush(),
		probe: storageProbe(),
	}
}

async function keepAwakeSpec(): Promise<Record<string, unknown>> {
	const activated = await keepAwake.activate()
	const deactivated = await keepAwake.deactivate()
	const activatedTwo = await Promise.all([
		keepAwake.activate('spec-a'),
		keepAwake.activate('spec-b'),
	])
	const releaseA = await keepAwake.deactivate('spec-a')
	const releaseB = await keepAwake.deactivate('spec-b')
	return { activated, deactivated, activatedTwo, releaseA, releaseB }
}

async function connectivitySpec(): Promise<Record<string, unknown>> {
	const current = connectivity.getState()
	const events: unknown[] = []
	const unsubscribe = connectivity.subscribe((next) => events.push(next))
	const resample = connectivity.getState()
	unsubscribe()
	return { current, resample, eventCount: events.length }
}

async function deviceSpec(): Promise<Record<string, unknown>> {
	return { ...device }
}

async function appInfoSpec(): Promise<Record<string, unknown>> {
	return { ...appInfo }
}

async function filesSpec(): Promise<Record<string, unknown>> {
	const draft = await files.writeText('core20-draft.txt', 'Passport ✓')
	const text = await files.readText(draft)
	const bin = await files.writeBytes('core20-bin.dat', new Uint8Array([0, 1, 2, 250, 255]))
	const bytes = await files.readBytes(bin)
	let pickError = ''
	try {
		await files.pick()
	} catch (error) {
		pickError = String(error)
	}
	const exported = await files.export('core20-export.txt', new Uint8Array([1,2,3]))
	let released = false
	try {
		files.release(draft)
		released = true
	} catch {}
	let releasedAgain = false
	try {
		files.release(draft)
		releasedAgain = true
	} catch {}
	return {
		draftUri: draft.uri,
		matchedText: text === 'Passport ✓',
		matchedBytes: bytes.length === 5 && bytes[3] === 250 && bytes[4] === 255,
		differentUris: draft.uri !== bin.uri,
		pickError,
		exported,
		released,
		releasedAgain,
	}
}

async function coreFsSpec(): Promise<Record<string, unknown>> {
	const documents = knownFolders.documents().path
	const dir = nsPath.join(documents, 'core20-service-fs')
	const folder = Folder.fromPath(dir)
	const filePath = nsPath.join(dir, 'core20-fs.txt')
	const target = File.fromPath(filePath)
	const existsBefore = File.exists(filePath)
	await target.writeText('chunk αβγ')
	const existsAfter = File.exists(filePath)
	const text = await target.readText()
	// Evidence for the upstream fake-sync gap: PathIO ops return before completing.
	const syncText = target.readTextSync()
	const nestedPath = nsPath.join(dir, 'nested', 'inner')
	const nested = Folder.fromPath(nestedPath)
	const nestedExists = nested !== null && Folder.exists(nestedPath)
	const temp = knownFolders.temp()
	const tempFile = temp.getFile('core20-temp-unique.txt')
	const tempPath = tempFile.path
	const tempExists = File.exists(tempPath)
	try {
		target.removeSync()
		nested.removeSync()
		folder.removeSync()
		tempFile.removeSync()
	} catch {}
	return {
		documentsPresent: typeof documents === 'string' && documents.length > 0,
		existsBefore,
		existsAfter,
		matchedText: text === 'chunk αβγ',
		syncText,
		nestedExists,
		tempPath,
		tempExists,
	}
}

export async function runServiceSpec(spec: string, record: Emit): Promise<void> {
	try {
		let result: Record<string, unknown>
		switch (spec) {
			case 'clipboard': result = await clipboardSpec(); break
			case 'random': result = await randomSpec(); break
			case 'storage': result = await storageSpec(); break
			case 'storage-persist': result = await storageSpec('persisted-across-launches'); break
			case 'storage-verify': result = await storageSpec(); break
			case 'keepawake': result = await keepAwakeSpec(); break
			case 'connectivity': result = await connectivitySpec(); break
			case 'device': result = await deviceSpec(); break
			case 'appinfo': result = await appInfoSpec(); break
			case 'files': result = await filesSpec(); break
			case 'corefs': result = await coreFsSpec(); break
			default:
				record('service-error', { spec, message: 'Unknown service spec' })
				return
		}
		record('service-result', { spec, ...result })
	} catch (error) {
		record('service-error', { spec, message: String(error) })
	}
}
