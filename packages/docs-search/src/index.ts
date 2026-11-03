import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { chunkMarkdown, hash } from './chunks.ts'
import type { Chunk, Document } from './chunks.ts'
import { localEmbedder } from './model.ts'
import type { Embedder } from './model.ts'

export { chunkMarkdown } from './chunks.ts'
export type { Chunk, Document } from './chunks.ts'
export { MODEL, modelId, localEmbedder } from './model.ts'
export type { Embedder } from './model.ts'

const VERSION = 'sections-v1'
const embeddingText = (chunk: Chunk) => `${chunk.title}\n${chunk.heading}\n${chunk.content}`

function database(cacheDir: string) {
  mkdirSync(cacheDir, { recursive: true })
  const db = new DatabaseSync(join(cacheDir, 'search-v1.sqlite'))
  db.exec(`PRAGMA busy_timeout=10000;
		CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY);
		CREATE TABLE IF NOT EXISTS chunks (snapshot TEXT, key TEXT, data TEXT, PRIMARY KEY(snapshot,key));
		CREATE VIRTUAL TABLE IF NOT EXISTS fulltext USING fts5(snapshot UNINDEXED, key UNINDEXED, text);
		CREATE TABLE IF NOT EXISTS embeddings (model TEXT, hash TEXT, vector TEXT, PRIMARY KEY(model,hash));`)
  return db
}

function inventory(documents: Document[], binding: string) {
  const chunks = documents.flatMap(chunkMarkdown)
  const snapshot = hash(`${VERSION}:${binding}:${JSON.stringify(chunks)}`)
  return { chunks, snapshot }
}

function sync(db: DatabaseSync, snapshot: string, chunks: Chunk[]) {
  if (db.prepare('SELECT id FROM snapshots WHERE id=?').get(snapshot)) {
    return
  }
  db.exec('BEGIN IMMEDIATE')
  try {
    // Another process may have prepared this snapshot while waiting for the lock.
    if (!db.prepare('SELECT id FROM snapshots WHERE id=?').get(snapshot)) {
      const row = db.prepare('INSERT INTO chunks VALUES (?,?,?)')
      const fts = db.prepare('INSERT INTO fulltext VALUES (?,?,?)')
      for (const chunk of chunks) {
        row.run(snapshot, chunk.key, JSON.stringify(chunk))
        fts.run(snapshot, chunk.key, `${chunk.path}\n${embeddingText(chunk)}`)
      }

      db.prepare('INSERT INTO snapshots VALUES (?)').run(snapshot)
    }

    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function vector(db: DatabaseSync, embedder: Embedder, chunk: Chunk): number[] | null {
  const row = db
    .prepare('SELECT vector FROM embeddings WHERE model=? AND hash=?')
    .get(embedder.id, hash(embeddingText(chunk)))
  if (!row) {
    return null
  }
  const values: unknown = JSON.parse(row.vector as string)
  return Array.isArray(values) && values.length > 0 && values.every(Number.isFinite) ? values : null
}

function normalize(values: number[]) {
  if (!values.length || !values.every(Number.isFinite)) {
    throw new Error('Invalid embedding vector')
  }
  const norm = Math.hypot(...values)
  if (!norm) {
    throw new Error('Zero embedding vector')
  }
  return values.map((v) => v / norm)
}

/** Prepare reusable embeddings. Downloads happen only when explicitly requested here. */
export async function prepareIndex({
  documents,
  binding,
  cacheDir,
  embedder = localEmbedder(cacheDir, true),
}: {
  documents: Document[]
  binding: string
  cacheDir: string
  embedder?: Embedder
}) {
  const { chunks, snapshot } = inventory(documents, binding)
  const db = database(cacheDir)
  let embedded = 0
  try {
    if (chunks.length) {
      await embedder.prepare?.()
    }

    sync(db, snapshot, chunks)
    const missing = new Map(
      chunks.filter((c) => !vector(db, embedder, c)).map((c) => [hash(embeddingText(c)), c]),
    )

    // Commit batches independently: interruption preserves completed work.
    for (let offset = 0; offset < missing.size; offset += 32) {
      const batch = [...missing.entries()].slice(offset, offset + 32)
      const vectors = await embedder.embed(batch.map(([, c]) => embeddingText(c)))
      if (vectors.length !== batch.length) {
        throw new Error('Embedding count mismatch')
      }

      const normalized = vectors.map(normalize)
      db.exec('BEGIN IMMEDIATE')
      try {
        const insert = db.prepare('INSERT OR REPLACE INTO embeddings VALUES (?,?,?)')
        batch.forEach(([key], i) => insert.run(embedder.id, key, JSON.stringify(normalized[i])))
        db.exec('COMMIT')
      } catch (error) {
        db.exec('ROLLBACK')
        throw error
      }

      embedded += batch.length
    }

    return { status: 'ready', snapshot, model: embedder.id, chunks: chunks.length, embedded }
  } finally {
    db.close()
    await embedder.dispose?.()
  }
}

/** Search only the supplied snapshot. Hybrid retrieval never downloads model files. */
export async function searchIndex({
  documents,
  binding,
  cacheDir,
  query,
  limit = 10,
  mode = 'hybrid',
  embedder = localEmbedder(cacheDir),
}: {
  documents: Document[]
  binding: string
  cacheDir: string
  query: string
  limit?: number
  mode?: 'hybrid' | 'lexical'
  embedder?: Embedder
}) {
  const { chunks, snapshot } = inventory(documents, binding)
  const db = database(cacheDir)
  try {
    sync(db, snapshot, chunks)
    const terms = query.match(/[\p{L}\p{N}_]+/gu) ?? []
    const expression = terms.map((t) => `"${t}"`).join(' OR ')
    const lexical = expression
      ? db
          .prepare(`SELECT key FROM fulltext
			WHERE fulltext MATCH ? AND snapshot=? ORDER BY bm25(fulltext) LIMIT ?`)
          .all(expression, snapshot, Math.max(50, limit * 5))
          .map((r) => r.key as string)
      : []

    let used = 'lexical'
    let reason: string | undefined = mode === 'hybrid' ? 'index-not-ready' : undefined
    const ranks = new Map<string, number>()
    lexical.forEach((key, i) => ranks.set(key, 1 / (60 + i + 1)))
    if (mode === 'hybrid' && chunks.length) {
      const vectors = chunks.map((c) => vector(db, embedder, c))
      if (vectors.every((v) => v !== null)) {
        try {
          const [raw] = await embedder.embed([query])
          const q = normalize(raw)
          const semantic = chunks
            .map((chunk, i) => {
              const v = vectors[i]!
              if (v.length !== q.length) {
                throw new Error('Embedding dimensions changed')
              }
              return { key: chunk.key, score: v.reduce((sum, n, j) => sum + n * q[j], 0) }
            })
            .filter((r) => r.score >= 0.2)
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.max(50, limit * 5))

          semantic.forEach(({ key }, i) => ranks.set(key, (ranks.get(key) ?? 0) + 1 / (60 + i + 1)))
          used = 'hybrid'
          reason = undefined
        } catch {
          reason = 'model-unavailable'
        }
      }
    }

    const needle = query.trim().toLowerCase()
    // Preserve exact identifiers/phrases even when FTS tokenization differs.
    for (const chunk of chunks) {
      if (needle && `${chunk.path}\n${embeddingText(chunk)}`.toLowerCase().includes(needle)) {
        ranks.set(chunk.key, (ranks.get(chunk.key) ?? 0) + 1)
      }
    }

    const byKey = new Map(chunks.map((c) => [c.key, c]))
    return {
      retrieval: {
        requested: mode,
        used,
        ...(reason ? { reason } : {}),
        snapshot,
        model: embedder.id,
      },
      results: [...ranks]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([key]) => byKey.get(key)!),
    }
  } finally {
    db.close()
    await embedder.dispose?.()
  }
}
