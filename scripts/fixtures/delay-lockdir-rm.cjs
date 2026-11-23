// node --require fixture for scripts/native-target-lock.test.mts.
//
// Wraps fs.rmSync so recursive removals of the directory named by
// XPLAT_DELAY_RMDIR run stepwise — readdir, unlink each entry, pause for
// XPLAT_DELAY_MS, then rmdir — instead of as one call. The pause holds the
// transient empty-dir window open: on POSIX a rename succeeds over an
// empty directory, so a concurrent acquirer's renameSync lands inside the
// window deterministically. Removing the lock dir in place used to crash
// the remover (ENOENT/ENOTEMPTY from its pending rmdir) or strand a fresh
// lock under teardown; with-target-lock.ts now renames the dir aside
// before deleting, so the hook simply observes no rm of that path.
const fs = require('node:fs')
const path = require('node:path')

const orig = fs.rmSync
const delayDir = process.env.XPLAT_DELAY_RMDIR
const delayMs = Number(process.env.XPLAT_DELAY_MS) || 400

fs.rmSync = function (target, options) {
  if (target !== delayDir || !options?.recursive) {
    return orig.call(fs, target, options)
  }

  let entries
  try {
    entries = fs.readdirSync(target)
  } catch (error) {
    if (options.force && error.code === 'ENOENT') {
      return
    }
    throw error
  }

  for (const entry of entries) {
    orig.call(fs, path.join(target, entry), options)
  }

  const end = Date.now() + delayMs
  while (Date.now() < end) {
    // busy-wait: hold the empty-dir window open for the racer
  }
  fs.rmdirSync(target)
}
