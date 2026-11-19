// node --require fixture for scripts/native-target-lock.test.mts.
//
// Gates fs.renameSync calls whose source is the dir named by
// XPLAT_GATE_LOCKDIR on a file gate under XPLAT_GATE_DIR: writes
// at-lockdir-rename, then busy-waits for go-lockdir-rename. The gate holds
// the deferred removal rename (lockDir -> trash) open so the test can
// replace the verified lock dir with a foreign live dir before the rename
// executes — the check-then-act window a stale reaper used to turn into a
// deleted live lock. Removal now re-verifies the captured inode and
// restores foreign dirs, so the renamed-back dir survives the gate.
//
// With XPLAT_GATE_RESTORE set, renames whose source is this process's own
// trash dir (<target>.reap-<pid>) are gated the same way on
// at-lockdir-restore/go-lockdir-restore. That second gate holds the
// restore of a foreign capture open so a third dir can land on the freed
// lock path first — the interleaving that leaves the displaced live dir
// preserved under the trash name.
const fs = require('node:fs')
const path = require('node:path')

const origRename = fs.renameSync
const lockDir = process.env.XPLAT_GATE_LOCKDIR
const gateDir = process.env.XPLAT_GATE_DIR
const trashDir =
  process.env.XPLAT_GATE_RESTORE &&
  lockDir &&
  path.join(
    path.dirname(lockDir),
    path.basename(lockDir, '.lock') + '.reap-' + process.pid,
  )

function gate(name) {
  fs.writeFileSync(path.join(gateDir, 'at-' + name), String(process.pid))
  const deadline = Date.now() + 60000
  while (!fs.existsSync(path.join(gateDir, 'go-' + name))) {
    if (Date.now() > deadline) {
      break
    }
    const end = Date.now() + 2
    while (Date.now() < end) {
      // busy-wait: hold the rename window open for the test's interleaving
    }
  }
}

fs.renameSync = function (src, dest) {
  if (gateDir) {
    if (src === lockDir) {
      gate('lockdir-rename')
    } else if (src === trashDir) {
      gate('lockdir-restore')
    }
  }

  return origRename.call(fs, src, dest)
}
