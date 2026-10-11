/**
 * Evidence and retention contract.
 *
 * Evidence is session-scoped by default: when the MCP session ends, its
 * artifacts are deleted. The developer may explicitly retain selected
 * artifacts with a stated expiration or until manual deletion, and may delete
 * retained evidence sooner. Deleting server artifacts cannot erase an
 * external agent-client transcript that recorded them — that note travels
 * with every retain/delete result (`TRANSCRIPT_LIMITATION_NOTE`).
 *
 * Every observation carries provenance: app, platform, target, session,
 * build/source identity, capture time, and — for interactions — the
 * mechanism. `handler-dispatch` and `dom-event` evidence must never be
 * presented as OS-input verification (`isOsInputEvidence`).
 */

import type { BuildIdentity } from './sessions'
import type { Platform } from './identity'
import type { ContractError } from './errors'

export const EVIDENCE_KINDS: readonly EvidenceKind[]
export const INTERACTION_MECHANISMS: readonly InteractionMechanism[]
/** Included in retain/delete results: deletion here never touches the client transcript. */
export const TRANSCRIPT_LIMITATION_NOTE: string

export type EvidenceKind =
	| 'log'
	| 'screenshot'
	| 'inspection'
	| 'interaction'
	| 'measurement'
	| 'assertion'
	| 'job'
	| 'note'

export type InteractionMechanism =
	/** App handler invoked directly — proves handler behavior only. */
	| 'handler-dispatch'
	/** Synthesized DOM/platform events — proves event-path behavior, not OS hit-testing. */
	| 'dom-event'
	/** Real OS input path — can support OS-level claims. */
	| 'os-input'
	/** Not an interaction record. */
	| 'none'

export interface EvidenceProvenance {
	appId?: string
	platform?: Platform
	targetId?: string
	sessionId?: string
	buildIdentity?: BuildIdentity
	/** ISO capture time. */
	capturedAt: string
	mechanism?: InteractionMechanism
}

export type EvidenceRetention =
	/** Deleted when the MCP session ends (the default). */
	| { scope: 'session' }
	/** Kept until `expiresAt` (null = until manual deletion). */
	| { scope: 'retained'; expiresAt: string | null }

export interface EvidenceRecord {
	id: string
	kind: EvidenceKind
	summary: string
	provenance: EvidenceProvenance
	/** File path under the evidence root, for binary/large artifacts. */
	artifactPath?: string
	/** Small structured payload kept in memory. */
	data?: unknown
	retention: EvidenceRetention
	createdAt: string
}

export interface RetainResult {
	record: EvidenceRecord
	transcriptNote: string
}

export interface DeleteResult {
	deleted: boolean
	transcriptNote: string
}

export interface EvidenceStore {
	record(input: {
		kind: EvidenceKind
		summary: string
		provenance: Omit<EvidenceProvenance, 'capturedAt'> & { capturedAt?: string }
		data?: unknown
		/** Write this content as the artifact file (utf8). */
		artifact?: string | Uint8Array
		/** Suggested artifact file name; sanitized. */
		artifactName?: string
	}): EvidenceRecord
	list(filter?: { sessionId?: string; kind?: EvidenceKind }): EvidenceRecord[]
	/** Move a record out of session scope. `expiresAt` ISO string or null for manual deletion. */
	retain(
		id: string,
		options?: { expiresAt?: string | null },
	): RetainResult | { error: ContractError }
	delete(id: string): DeleteResult | { error: ContractError }
	/** Delete retained records past their expiration. */
	sweepExpired(now?: Date): number
	/** Session end: delete every session-scoped record and its artifact file. */
	closeSession(): { deleted: number }
	/** Absolute path of the evidence root for this server session. */
	readonly root: string
}

/** True only for evidence captured through the real OS input path. */
export declare function isOsInputEvidence(record: EvidenceRecord): boolean

export declare function createEvidenceStore(options: { root: string }): EvidenceStore
