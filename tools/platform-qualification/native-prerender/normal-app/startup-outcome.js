import { Utils } from '@nativescript/core'

// Bounded outcome receipt: what the runner reads to tell adoption from an
// ordinary-render fallback. Written from the entry's onOutcome callback.
export function writeStartupOutcome(outcome) {
  const payload = JSON.stringify(
    {
      adopted: outcome.adopted === true,
      reason: outcome.reason ?? null,
      bind: outcome.adopted ? outcome.tree?.bind ?? null : null,
      claims: outcome.adopted
        ? {
            phase: outcome.claims.phase,
            claimedCount: outcome.claims.claimedCount,
            replacedCount: outcome.claims.replacedCount,
            factoryCalls: outcome.claims.factoryCalls,
          }
        : null,
      visualNatives: outcome.adopted ? outcome.natives.length : 0,
    },
    null,
    2,
  )
  if (global.isIOS) {
    const data = NSString.stringWithString(payload).dataUsingEncoding(4)
    if (
      !NSFileManager.defaultManager.createFileAtPathContentsAttributes(
        NSHomeDirectory() + '/Documents/startup-outcome.json',
        data,
        null,
      )
    )
      throw new Error('Could not write startup outcome receipt')
  } else {
    const dir = Utils.android.getApplicationContext().getFilesDir()
    const file = new java.io.File(dir, 'startup-outcome.json')
    const out = new java.io.FileOutputStream(file)
    out.write(new java.lang.String(payload).getBytes('UTF-8'))
    out.close()
  }
}
