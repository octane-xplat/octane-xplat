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
const fs = require('node:fs')
const path = require('node:path')

const origRename = fs.renameSync
const lockDir = process.env.XPLAT_GATE_LOCKDIR
const gateDir = process.env.XPLAT_GATE_DIR

fs.renameSync = function (src, dest) {
  if (src === lockDir && gateDir) {
    fs.writeFileSync(path.join(gateDir, 'at-lockdir-rename'), String(process.pid))
    const deadline = Date.now() + 60000
    while (!fs.existsSync(path.join(gateDir, 'go-lockdir-rename'))) {
      if (Date.now() > deadline) {
        break
      }
      const end = Date.now() + 2
      while (Date.now() < end) {
        // busy-wait: hold the pre-removal window open for the test's swap
      }
    }
  }

  return origRename.call(fs, src, dest)
}
