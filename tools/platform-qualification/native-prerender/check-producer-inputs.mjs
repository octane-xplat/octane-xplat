import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

/** Existing bytes and absent resolution candidates are both build inputs. */
export function assertProducerInputs(producer) {
  if (
    !producer.inputs ||
    Array.isArray(producer.inputs) ||
    !Object.keys(producer.inputs).length ||
    !Array.isArray(producer.missingInputs) ||
    producer.missingInputs.some((path) => typeof path !== 'string' || !path)
  ) {
    throw new Error('Producer source identity is missing; regenerate the artifact')
  }

  for (const [path, digest] of Object.entries(producer.inputs)) {
    if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) {
      throw new Error('Invalid producer source identity: ' + path)
    }

    if (createHash('sha256').update(readFileSync(path)).digest('hex') !== digest) {
      throw new Error('Producer input changed; regenerate the artifact: ' + path)
    }
  }

  for (const path of producer.missingInputs) {
    if (existsSync(path)) {
      throw new Error('Producer resolution input appeared; regenerate the artifact: ' + path)
    }
  }
}
