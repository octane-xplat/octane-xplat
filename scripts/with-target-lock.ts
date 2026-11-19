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
// Removal always renames the dir aside before deleting it: an empty dir
// accepts a rename on POSIX, so unlinking entries at the lock path opens a
// window where an acquirer lands a fresh lock under our pending rmdir.
// Renaming the verified dir to a trash name makes the lock path vanish
// atomically; the trash is then deleted at leisure. The shared path itself
// is never deleted recursively — a failed rename means another process
// already resolved the dir, and whatever now sits there is not ours.
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

function isOurClaim() {
  const claim = readRecord(claimFile)
  return claim?.pid === process.pid && (!claim.hostname || claim.hostname === hostname())
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function removeTransients() {
  rmSync(stagingDir, { recursive: true, force: true })
  rmSync(claimSource, { force: true })
  rmSync(trashDir, { recursive: true, force: true })
}

// Delete the lock dir without exposing an empty dir at the lock path: the
// dir is renamed to our trash name first (atomic — the path becomes absent
// at once), so a concurrent acquirer's renameSync can never replace a
// transiently emptied dir still owned by our pending removal. If the rename
// fails, the dir was already resolved by someone else — the shared path may
// now hold a fresh live lock, so nothing is removed there.
function removeLockDir() {
  rmSync(trashDir, { recursive: true, force: true })
  try {
    renameSync(lockDir, trashDir)
  } catch {
    return // already resolved — never delete whatever now sits at the path
  }
  // Racers can still land a claim inside the dir while the rename detaches
  // it (their parent-dir lookup wins over the detach), so a stray entry may
  // appear mid-delete; the retries absorb that transient ENOTEMPTY.
  rmSync(trashDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 25 })
}

// Drop staging dirs, claim sources, and trash dirs abandoned by dead
// processes so the lock root stays clean across crashes.
for (const entry of readdirSync(lockRoot)) {
  const match = /^(?:claimsrc-|.*\.(?:staging|reap)-)(\d+)$/.exec(entry)

  if (match && !pidAlive({ pid: Number(match[1]), hostname: hostname() })) {
    rmSync(join(lockRoot, entry), { recursive: true, force: true })
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

    if (claim?.pid === process.pid) {
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
        // fails rather than clobber a claim another evictor just landed;
        // either way the displaced copy is spent.
        try {
          linkSync(evicted, claimFile)
        } catch {
          // another claim already occupies the path
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
    try {
      rmSync(claimFile, { force: true }) // live owner — release only our claim
    } catch {
      // the dir vanished with our claim — nothing to release
    }
    if (!ownerLogged) {
      console.log(`[lock] ${target} held by pid ${current?.pid} (${current?.cwd ?? '?'}) — waiting`)
      ownerLogged = true
    }

    await sleep(waitPollMs)
    continue
  }

  // Remove only if our own claim is still the one inside the dir; a
  // superseded claim means another reclaimer owns this dir now.
  if (isOurClaim()) {
    console.log(
      `[lock] reclaiming stale ${target} lock (owner pid ${current?.pid ?? 'unknown'} is gone)`,
    )
    removeLockDir()
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
  removeLockDir()
  removeTransients()
}
