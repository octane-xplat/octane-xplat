#!/usr/bin/env node
// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Shared per-target advisory lock for serializing native builds and
// simulator/device use across worktrees and agent sessions on this host.
// with-native-target-lock.py implements the same protocol; every wrapper
// contends on one lock dir, so Python and Node callers mutually exclude.
//
//   node scripts/with-target-lock.ts <target> [--timeout <seconds>] -- <command...>
//
// <target> is a lock name such as `ios` or `android`. The lock lives under
// os.tmpdir() shared by every worktree; XPLAT_NATIVE_LOCK_DIR redirects the
// lock root (same contract as with-native-target-lock.py) and
// XPLAT_NATIVE_LOCK_POLL_MS overrides the wait poll interval for tests.
//
// Acquire: the lock dir is built in a staging dir — including owner.json —
// and moved into place with renameSync, so a lock dir is never observed
// without its owner record and a non-empty dir always rejects the rename.
// Reclaim: a dead owner's dir may only be removed while holding a `.claim`
// file linked inside that same dir. The claim serializes concurrent
// reclaimers; while it stands the dir cannot be replaced, so the owner
// re-check under claim runs against the exact dir being removed. A `.claim`
// left by a dead reclaimer is evicted by renaming it aside — whoever moves
// the name owns the grabbed inode and re-checks its record — never by
// unlink after read, which could delete a fresh live claim.
//
// Removal binds to the verified dir inode, not the lock path: the inode is
// recorded when ownership is verified, rechecked right before the rename
// aside, and the captured trash dir must match it — and still decode to
// the record we verified — before anything is deleted. POSIX has no
// rename-if-inode, so a stale reaper's deferred rename can still capture a
// replacement live dir for a few syscalls; a mismatched capture is renamed
// back onto the free lock path, or kept under our trash name with a loud
// warning when a third dir already landed. Deleting a live lock is never a
// cleanup option: an empty dir accepts a rename on POSIX, so unlinking
// entries at the lock path also opens a window where an acquirer lands a
// fresh lock under a pending rmdir — the shared path itself is never
// deleted recursively.
import { spawn } from 'node:child_process'
import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { hostname, tmpdir } from 'node:os'
import { join } from 'node:path'

const args = process.argv.slice(2)
const separator = args.indexOf('--')
const target = args[0]
const timeoutFlag = args.indexOf('--timeout')
const timeoutSeconds = timeoutFlag > 0 ? Number(args[timeoutFlag + 1]) : 30 * 60
const command = separator > 0 ? args.slice(separator + 1) : null

if (!target || target.startsWith('--') || !command?.length) {
  console.error('usage: with-target-lock.ts <target> [--timeout <seconds>] -- <command...>')
  process.exit(2)
}

const lockRoot = process.env.XPLAT_NATIVE_LOCK_DIR ?? join(tmpdir(), 'octane-xplat-target-locks')

mkdirSync(lockRoot, { recursive: true })

const lockDir = join(lockRoot, `${target}.lock`)
const ownerFile = join(lockDir, 'owner.json')
const claimFile = join(lockDir, '.claim')
const stagingDir = join(lockRoot, `${target}.staging-${process.pid}`)
const claimSource = join(lockRoot, `claimsrc-${process.pid}`)
const trashDir = join(lockRoot, `${target}.reap-${process.pid}`)
const waitPollMs = Number(process.env.XPLAT_NATIVE_LOCK_POLL_MS) || 5000
const deadline = Date.now() + timeoutSeconds * 1000
let ownerLogged = false
let lastOwner = null
let lockIno = null
let preserveTrash = false

function pidAlive(record) {
  if (!record || typeof record.pid !== 'number') {
    return false
  }

  if (record.hostname && record.hostname !== hostname()) {
    return true // another host — cannot probe; treat as live
  }

  try {
    process.kill(record.pid, 0)
    return true
  } catch (error) {
    return error.code === 'EPERM' // exists but owned by another user
  }
}

function readRecord(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function isOurRecord(record) {
  return record?.pid === process.pid && (!record.hostname || record.hostname === hostname())
}

function isOurClaim() {
  return isOurRecord(readRecord(claimFile))
}

// Post-capture verifiers run against the private trash dir. A reclaim
// capture must still hold our claim and a dead-or-absent owner; a release
// capture must hold our own owner record.
function isOurReapCapture() {
  return (
    isOurRecord(readRecord(join(trashDir, '.claim'))) &&
    !pidAlive(readRecord(join(trashDir, 'owner.json')))
  )
}

function isOurOwnerCapture() {
  return isOurRecord(readRecord(join(trashDir, 'owner.json')))
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function removeTransients() {
  rmSync(stagingDir, { recursive: true, force: true })
  rmSync(claimSource, { force: true })
  if (!preserveTrash) {
    rmSync(trashDir, { recursive: true, force: true })
  }
}

// Delete the lock dir without exposing an empty dir at the lock path and
// only ever delete the inode whose ownership was verified. The rename to
// our trash name is atomic — the path becomes absent at once — but it
// captures whatever sits there at that instant, and a destroyed claim or a
// stolen dir can swap the verified inode for a foreign live lock between
// verification and the rename. So the inode is recorded at verification
// time, rechecked just before the rename (mismatch → already resolved,
// leave it), and required to match the captured dir along with the record
// we verified. A mismatched capture is a foreign dir: rename it back onto
// the free lock path, or — if a third dir already landed there — keep it
// under our trash name and warn; deleting a live lock is never an option.
// The remaining residue is a foreign dir displaced for a few syscalls,
// detected rather than silently destroyed.
function removeLockDir(expectedIno, verifyCaptured) {
  rmSync(trashDir, { recursive: true, force: true })

  try {
    if (expectedIno != null && statSync(lockDir).ino !== expectedIno) {
      return // resolved or replaced since verification — nothing of ours here
    }
  } catch {
    return
  }

  try {
    renameSync(lockDir, trashDir)
  } catch {
    return // already resolved — never delete whatever now sits at the path
  }

  let capturedIno = null
  try {
    capturedIno = statSync(trashDir).ino
  } catch {
    return // capture vanished — nothing left to verify or restore
  }

  if ((expectedIno == null || capturedIno === expectedIno) && verifyCaptured()) {
    // Racers can still land a claim inside the dir while the rename
    // detaches it (their parent-dir lookup wins over the detach), so a
    // stray entry may appear mid-delete; the retries absorb that transient
    // ENOTEMPTY.
    rmSync(trashDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 25 })
    return
  }

  try {
    renameSync(trashDir, lockDir) // put the foreign dir back while the path is free
  } catch {
    // Another dir already landed: preserve the displaced capture — the
    // startup sweep skips trash dirs holding a live owner record.
    preserveTrash = true
    console.error(
      `[lock] captured a foreign lock dir while removing ours; preserved at ${trashDir}` +
        ` — its owner may still believe it holds the lock`,
    )
  }
}

// Drop staging dirs, claim sources, and trash dirs abandoned by dead
// processes so the lock root stays clean across crashes. A trash dir may
// hold a captured live lock preserved after a failed restore — keep it
// while its owner record names a live process.
for (const entry of readdirSync(lockRoot)) {
  const match = /^(?:claimsrc-|.*\.(?:staging|reap)-)(\d+)$/.exec(entry)
  const leftover = join(lockRoot, entry)

  if (
    match &&
    !pidAlive({ pid: Number(match[1]), hostname: hostname() }) &&
    !pidAlive(readRecord(join(leftover, 'owner.json')))
  ) {
    rmSync(leftover, { recursive: true, force: true })
  }
}

writeFileSync(claimSource, JSON.stringify({ pid: process.pid, hostname: hostname() }))

for (;;) {
  if (Date.now() > deadline) {
    console.error(
      `[lock] timed out waiting for ${target} lock held by pid ${lastOwner?.pid ?? 'unknown'}`,
    )
    removeTransients()
    process.exit(1)
  }

  // Stage the full lock dir and move it into place atomically.
  rmSync(stagingDir, { recursive: true, force: true })
  mkdirSync(stagingDir)
  writeFileSync(
    join(stagingDir, 'owner.json'),
    JSON.stringify(
      {
        pid: process.pid,
        hostname: hostname(),
        cwd: process.cwd(),
        started: new Date().toISOString(),
      },
      null,
      1,
    ),
  )

  try {
    renameSync(stagingDir, lockDir)
    lockIno = statSync(lockDir).ino // the inode release() may remove
    break
  } catch {
    rmSync(stagingDir, { recursive: true, force: true })
    if (!existsSync(lockDir)) {
      continue // reclaimed between our attempts — retry
    }
  }

  const owner = readRecord(ownerFile)

  if (owner) {
    lastOwner = owner
  }

  if (pidAlive(owner)) {
    if (isOurRecord(owner)) {
      // Our staged dir landed but the stat bookkeeping threw — this dir is
      // ours; take it rather than wait on our own lock.
      try {
        lockIno = statSync(lockDir).ino
      } catch {
        lockIno = null // release() then verifies by owner record alone
      }
      break
    }
    if (!ownerLogged) {
      console.log(`[lock] ${target} held by pid ${owner?.pid} (${owner?.cwd ?? '?'}) — waiting`)
      ownerLogged = true
    }

    await sleep(waitPollMs)
    continue
  }

  // Stale or unreadable owner. Only a claim holder may remove the dir; the
  // claim lives inside it, so while it stands no one else can remove or
  // replace the dir.
  try {
    if (!statSync(lockDir).isDirectory()) {
      rmSync(lockDir, { force: true }) // stray file — never a valid lock
      continue
    }
  } catch {
    continue // vanished under us — retry
  }

  let claimed = false

  try {
    linkSync(claimSource, claimFile)
    claimed = true
  } catch (error) {
    if (error.code === 'ENOENT') {
      continue // dir vanished under us — retry
    }

    const claim = readRecord(claimFile)

    if (isOurRecord(claim)) {
      claimed = true // left over from our earlier attempt
    } else if (pidAlive(claim)) {
      await sleep(150) // a live reclaimer is resolving the dir
    } else {
      // Dead or garbled claim. Evict it by renaming it aside: the rename
      // atomically gives us whatever inode `.claim` holds right now, so a
      // claim swapped in after our read is detected instead of deleted.
      // Reading then unlinking the shared path would be a check-then-act
      // race that can remove a live claim and produce two claimants.
      const evicted = join(lockDir, `.claim-evicted-${process.pid}`)

      try {
        renameSync(claimFile, evicted)
      } catch {
        continue // claim vanished under us — retry
      }

      if (pidAlive(readRecord(evicted))) {
        // We displaced a live claim. Restore it through linkSync, which
        // fails rather than clobber a claim another evictor just landed —
        // but only while the lock dir still holds the file we moved aside:
        // its presence proves the path is the same dir we evicted from
        // (an inode number can be recycled by a replacement). Either way
        // the displaced copy is spent.
        if (existsSync(evicted)) {
          try {
            linkSync(evicted, claimFile)
          } catch {
            // another claim already occupies the path
          }
        }
        rmSync(evicted, { force: true })
        await sleep(150)
      } else {
        rmSync(evicted, { force: true }) // dead claim — reaped at our private name
      }
    }
  }

  if (!claimed) {
    continue
  }

  // Under the claim, check the owner again: the dir may have been reclaimed
  // and re-acquired since our first read, and only the current record counts.
  const current = readRecord(ownerFile)

  if (current) {
    lastOwner = current
  }

  if (pidAlive(current)) {
    // Live owner — release only our claim: grab whatever `.claim` names
    // right now and drop it only when it decodes to our record. A foreign
    // claim goes back through linkSync while the dir at the lock path
    // still holds the grabbed file; either way the grabbed copy is spent.
    const released = join(lockDir, `.claim-evicted-${process.pid}`)

    try {
      renameSync(claimFile, released)
    } catch {
      // the dir or claim vanished — nothing to release
    }

    if (existsSync(released)) {
      if (isOurRecord(readRecord(released))) {
        rmSync(released, { force: true })
      } else {
        try {
          linkSync(released, claimFile)
        } catch {
          // another claim already occupies the path
        }
        rmSync(released, { force: true })
      }
    }

    if (!ownerLogged) {
      console.log(`[lock] ${target} held by pid ${current?.pid} (${current?.cwd ?? '?'}) — waiting`)
      ownerLogged = true
    }

    await sleep(waitPollMs)
    continue
  }

  // Remove only if our own claim is still the one inside the dir; a
  // superseded claim means another reclaimer owns this dir now. The dir
  // inode is pinned here so removal is bound to the verified dir even if
  // our claim is displaced before the rename executes.
  if (isOurClaim()) {
    let expectedIno
    try {
      expectedIno = statSync(lockDir).ino
    } catch {
      continue // dir vanished under us — retry
    }
    console.log(
      `[lock] reclaiming stale ${target} lock (owner pid ${current?.pid ?? 'unknown'} is gone)`,
    )
    removeLockDir(expectedIno, isOurReapCapture)
  }
}

console.log(`[lock] ${target} acquired (pid ${process.pid})`)
try {
  const child = spawn(command[0], command.slice(1), { stdio: 'inherit' })

  // Keep the lock while the child releases its app and device mappings:
  // forwarding signals instead of dying lets the child finish cleanup
  // before this wrapper releases the target.
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      try {
        child.kill(sig)
      } catch {
        // child already gone — its close event ends the wait
      }
    })
  }

  const result = await new Promise((resolve) => {
    child.once('error', (error) => {
      console.error(error.message)
      resolve({ status: 1, signal: null })
    })
    child.once('close', (status, signal) => resolve({ status, signal }))
  })

  process.exitCode = result.status ?? 1 // signal death or spawn failure
} finally {
  removeLockDir(lockIno, isOurOwnerCapture)
  removeTransients()
}
