// node --require fixture for scripts/native-target-lock.test.mts.
//
// Wraps fs.renameSync so moving the `.claim` entry inside the directory
// named by XPLAT_DELAY_RMDIR pauses for XPLAT_DELAY_MS first. The pause
// holds the dead-claim eviction window open: another evictor can evict the
// dead claim and link a fresh live claim before our rename executes, so our
// rename lands on the live claim instead of the dead one we read. The old
// read-then-unlink reap deleted that live claim — a check-then-act race
// that produced two concurrent claimants; with-target-lock.ts now renames
// the claim aside and re-checks the grabbed inode, restoring a live claim
// it displaced.
const fs = require('node:fs')

const origRename = fs.renameSync
const delayDir = process.env.XPLAT_DELAY_RMDIR
const delayMs = Number(process.env.XPLAT_DELAY_MS) || 300

fs.renameSync = function (src, dest) {
  if (
    typeof src === 'string' &&
    delayDir &&
    src.startsWith(delayDir + '/') &&
    src.endsWith('.claim')
  ) {
    const end = Date.now() + delayMs
    while (Date.now() < end) {
      // busy-wait: hold the pre-eviction window open for racing evictors
    }
  }

  return origRename.call(fs, src, dest)
}
