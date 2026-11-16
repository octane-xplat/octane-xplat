// Clipboard — browser support is feature-detected; writes can still be denied
// by browser policy or permission state.

export type Clipboard = {
  canCopy: boolean
  writeText: typeof writeText
  readText: typeof readText
  // Keep the original names available for existing consumers.
  write: typeof writeText
  read: typeof readText
}

const canCopy =
  typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function'

async function writeText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

async function readText(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText()
  } catch {
    return null
  }
}

export const clipboard: Clipboard = {
  canCopy,
  writeText,
  readText,
  // Keep the original names available for existing consumers.
  write: writeText,
  read: readText,
}
