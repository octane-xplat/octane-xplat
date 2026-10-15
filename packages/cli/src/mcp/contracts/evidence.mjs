// Evidence and retention contract — see evidence.d.ts.

import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join, resolve, sep } from 'node:path'
import { contractError } from './errors.mjs'

export const EVIDENCE_KINDS = [
	'log',
	'screenshot',
	'inspection',
	'interaction',
	'measurement',
	'assertion',
	'job',
	'note',
]

export const INTERACTION_MECHANISMS = ['handler-dispatch', 'dom-event', 'os-input', 'none']

export const TRANSCRIPT_LIMITATION_NOTE =
	'This artifact is deleted or retained only on the MCP server side. Any agent-client transcript that already recorded it is outside the server\u2019s control and is not erased by deleting it here.'

export function isOsInputEvidence(record) {
	return record.provenance.mechanism === 'os-input'
}

const SESSION_DIR = 'session'
const RETAINED_DIR = 'retained'

const safeName = (name) =>
	basename(name)
		.replace(/[^\w.-]+/g, '_')
		.slice(0, 80) || 'artifact'

export function createEvidenceStore({ root }) {
	const sessionDir = join(root, SESSION_DIR)
	const retainedDir = join(root, RETAINED_DIR)
	mkdirSync(sessionDir, { recursive: true })
	mkdirSync(retainedDir, { recursive: true })

	const records = new Map()

	// Deletion is ownership-safe: only ever removes paths under this root.
	const removeArtifact = (record) => {
		if (!record.artifactPath) {
			return
		}

		const abs = resolve(record.artifactPath)
		if (abs.startsWith(resolve(root) + sep) && existsSync(abs)) {
			rmSync(abs, { force: true })
		}
	}

	const toRecord = (input) => {
		const id = `ev_${randomUUID()}`
		let artifactPath
		if (input.artifact !== undefined) {
			const name = `${id}-${safeName(input.artifactName ?? input.kind)}`
			artifactPath = join(sessionDir, name)
			writeFileSync(artifactPath, input.artifact)
		}

		return {
			id,
			kind: input.kind,
			summary: input.summary,
			provenance: {
				...input.provenance,
				capturedAt: input.provenance.capturedAt ?? new Date().toISOString(),
			},
			artifactPath,
			data: input.data,
			retention: { scope: 'session' },
			createdAt: new Date().toISOString(),
		}
	}

	return {
		root,

		record(input) {
			const record = toRecord(input)
			records.set(record.id, record)
			return { ...record }
		},

		list(filter = {}) {
			return [...records.values()]
				.filter(
					(r) =>
						(!filter.sessionId || r.provenance.sessionId === filter.sessionId) &&
						(!filter.kind || r.kind === filter.kind),
				)
				.map((r) => ({ ...r }))
		},

		retain(id, options = {}) {
			const record = records.get(id)
			if (!record) {
				return {
					error: contractError('not_found', `No evidence record "${id}".`, {
						recovery: { action: 'List evidence with xplat_evidence op=list.' },
					}),
				}
			}

			if (
				options.expiresAt !== undefined &&
				options.expiresAt !== null &&
				Number.isNaN(Date.parse(options.expiresAt))
			) {
				return {
					error: contractError(
						'invalid_selection',
						`expiresAt "${options.expiresAt}" is not a valid timestamp — retention needs a stated expiration or an explicit null for manual deletion.`,
					),
				}
			}

			if (record.artifactPath) {
				const dest = join(retainedDir, basename(record.artifactPath))
				if (existsSync(record.artifactPath)) {
					renameSync(record.artifactPath, dest)
				}

				record.artifactPath = dest
			}

			record.retention = { scope: 'retained', expiresAt: options.expiresAt ?? null }
			return {
				record: { ...record },
				transcriptNote: TRANSCRIPT_LIMITATION_NOTE,
			}
		},

		delete(id) {
			const record = records.get(id)
			if (!record) {
				return {
					error: contractError('not_found', `No evidence record "${id}".`),
				}
			}

			removeArtifact(record)
			records.delete(id)
			return { deleted: true, transcriptNote: TRANSCRIPT_LIMITATION_NOTE }
		},

		sweepExpired(now = new Date()) {
			let deleted = 0
			for (const record of records.values()) {
				if (
					record.retention.scope === 'retained' &&
					record.retention.expiresAt &&
					Date.parse(record.retention.expiresAt) <= now.getTime()
				) {
					removeArtifact(record)
					records.delete(record.id)
					deleted++
				}
			}

			return deleted
		},

		closeSession() {
			let deleted = 0
			for (const record of records.values()) {
				if (record.retention.scope === 'session') {
					removeArtifact(record)
					records.delete(record.id)
					deleted++
				}
			}

			return { deleted }
		},
	}
}
