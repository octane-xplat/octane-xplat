const owned = new WeakMap<object, number>()

/** Input observation must survive a scope cancelling its descendant native recognizers. */
export function retainRawRecognizer(recognizer: object): () => void {
  owned.set(recognizer, (owned.get(recognizer) ?? 0) + 1)

  let alive = true

  return () => {
    if (!alive) {
      return
    }

    alive = false

    const remaining = (owned.get(recognizer) ?? 1) - 1

    if (remaining) {
      owned.set(recognizer, remaining)
    } else {
      owned.delete(recognizer)
    }
  }
}

export function isRawRecognizer(recognizer: object): boolean {
  return owned.has(recognizer)
}
