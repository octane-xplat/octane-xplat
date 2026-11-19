export type SecondInstanceHandler = (argv: readonly string[], workingDirectory: string | undefined) => void

export interface SingleInstanceSupport {
  supportsSingleInstanceLock(): boolean
  requestSingleInstanceLock(): boolean
  supportsSecondInstance(): boolean
  addSecondInstanceHandler(handler: SecondInstanceHandler): () => void
}

interface SecondLaunch {
  argv: readonly string[]
  workingDirectory?: string
}

export function watchSecondInstance(
  isReady: () => boolean,
  poll: () => SecondLaunch | null,
  handler: SecondInstanceHandler,
): () => void {
  let active = true
  const timer = setInterval(() => {
    if (!isReady()) return

    try {
      for (let delivered = 0; active && delivered < 32; delivered++) {
        const launch = poll()
        if (launch === null) return
        handler(launch.argv, launch.workingDirectory)
      }
    } catch (error) {
      console.error('[desktop] launch delivery failed', error)
    }
  }, 100)

  return () => {
    active = false
    clearInterval(timer)
  }
}
