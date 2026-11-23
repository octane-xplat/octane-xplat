import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { hostname, tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { command, ownedProcess } from '../tools/probe/process.ts'

function deadPid() {
  for (let pid = 99999; pid > 1000; pid--) {
    try {
      process.kill(pid, 0)
    } catch {
      return pid
    }
  }

  throw new Error('no dead pid available')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readRecord(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

function recordAlive(record) {
  try {
    process.kill(record.pid, 0)
    return true
  } catch {
    return false
  }
}

async function waitForPath(path, desc, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs

  while (!existsSync(path)) {
    if (Date.now() > deadline) {
      throw new Error(`timed out waiting for ${desc}`)
    }
    await sleep(10)
  }
}

async function waitForLiveOwner(ownerFile, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs

  for (;;) {
    const owner = readRecord(ownerFile)
    if (typeof owner?.pid === 'number' && recordAlive(owner)) {
      return owner.pid
    }
    if (Date.now() > deadline) {
      throw new Error('no live owner appeared at ' + ownerFile)
    }
    await sleep(10)
  }
}

async function waitForHolder(marks, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs

  for (;;) {
    const entries = existsSync(marks) ? await readdir(marks) : []
    const holder = entries.find((entry) => entry.startsWith('holding-'))
    if (holder) {
      return holder
    }
    if (Date.now() > deadline) {
      throw new Error('no lock holder mark appeared')
    }
    await sleep(10)
  }
}

const markerChild = `
	const fs = require('node:fs');
	const path = require('node:path');
	const id = process.argv[1];
	const marks = process.argv[2];
	fs.mkdirSync(path.join(marks, 'holding-' + id));
	const end = Date.now() + 2000;
	const timer = setInterval(() => {
		const others = fs
			.readdirSync(marks)
			.filter((f) => f.startsWith('holding-') && f !== 'holding-' + id);
		if (others.length) {
			fs.writeFileSync(path.join(marks, 'violation'), id + ' saw ' + others.join(','));
		}
		if (Date.now() > end) {
			clearInterval(timer);
			try { fs.rmdirSync(path.join(marks, 'holding-' + id)); } catch {}
		}
	}, 15);
`

test('native target lock survives interruption until child cleanup finishes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const marker = join(directory, 'cleaned')
  const release = join(directory, 'release')
  const wrapper = fileURLToPath(new URL('./with-native-target-lock.py', import.meta.url))
  const env = { ...process.env, XPLAT_NATIVE_LOCK_DIR: directory }
  const source = `
		const fs = require('node:fs');
		let stopping = false;
		process.on('SIGINT', () => {
			if (stopping) return;
			stopping = true;
			console.log('cleaning');
			setInterval(() => {
				if (!fs.existsSync(process.argv[2])) return;
				fs.writeFileSync(process.argv[1], 'done');
				process.exit(0);
			}, 10);
		});
		console.log('ready');
		setInterval(() => {}, 1000);
	`

  const host = ownedProcess(
    'python3',
    [wrapper, 'android', process.execPath, '-e', source, marker, release],
    { env },
  )

  try {
    const line = (expected) =>
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Missing ' + expected)), 5000)
        const unsubscribe = host.onLine((value) => {
          if (value === expected) {
            clearTimeout(timeout)
            unsubscribe()
            resolve()
          }
        })
      })

    await line('ready')

    const cleaning = line('cleaning')
    const stopping = host.stop()

    await cleaning

    const busy = await command('python3', [wrapper, 'android', process.execPath, '-e', ''], {
      env,
      allowFailure: true,
    })

    assert.notEqual(busy.code, 0)
    assert.match(busy.stderr, /Native target is busy/)
    await writeFile(release, '')
    await stopping
    assert.equal(await readFile(marker, 'utf8'), 'done')

    const released = await command('python3', [wrapper, 'android', process.execPath, '-e', ''], {
      env,
    })

    assert.equal(released.code, 0)
  } finally {
    await host.stop()
    await rm(directory, { recursive: true, force: true })
  }
})

test('python target lock conflicts, isolates targets, and releases', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const wrapper = fileURLToPath(new URL('./with-native-target-lock.py', import.meta.url))
  const env = { ...process.env, XPLAT_NATIVE_LOCK_DIR: directory }
  const sleep = 'import time; time.sleep(30)'

  const holder = ownedProcess('python3', [wrapper, 'ios', 'python3', '-c', sleep], { env })

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Missing lock banner')), 5000)
      const unsubscribe = holder.onLine((value) => {
        if (value.includes('Holding native target lock:')) {
          clearTimeout(timeout)
          unsubscribe()
          resolve()
        }
      })
    })

    const conflict = await command(
      'python3',
      [wrapper, 'ios', 'python3', '-c', 'pass'],
      { env, allowFailure: true },
    )

    assert.notEqual(conflict.code, 0)
    assert.match(conflict.stderr, /Native target is busy/)

    const independent = await command('python3', [wrapper, 'android', 'python3', '-c', 'pass'], {
      env,
    })

    assert.equal(independent.code, 0)
    await holder.stop()

    const released = await command('python3', [wrapper, 'ios', 'python3', '-c', 'pass'], { env })

    assert.equal(released.code, 0)
  } finally {
    await holder.stop()
    await rm(directory, { recursive: true, force: true })
  }
})

test('node target lock conflicts, isolates targets, and releases', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const marker = join(directory, 'release')
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = { ...process.env, XPLAT_NATIVE_LOCK_DIR: directory }
  const child = `
		const fs = require('node:fs');
		console.log('ready');
		setInterval(() => {
			if (fs.existsSync(${JSON.stringify(marker)})) process.exit(0);
		}, 10);
	`

  const holder = ownedProcess(process.execPath, [wrapper, 'ios', '--', process.execPath, '-e', child], {
    env,
  })

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Missing lock acquisition')), 5000)
      const unsubscribe = holder.onLine((value) => {
        if (value.includes('acquired')) {
          clearTimeout(timeout)
          unsubscribe()
          resolve()
        }
      })
    })

    const conflict = await command(
      process.execPath,
      [wrapper, 'ios', '--timeout', '1', '--', process.execPath, '-e', ''],
      { env, allowFailure: true, timeout: 20000 },
    )

    assert.notEqual(conflict.code, 0)
    assert.match(conflict.stderr, /timed out waiting for ios lock/)

    const independent = await command(
      process.execPath,
      [wrapper, 'android', '--', process.execPath, '-e', ''],
      { env },
    )

    assert.equal(independent.code, 0)
  } finally {
    await writeFile(marker, '')
    await Promise.race([holder.closed, new Promise((r) => setTimeout(r, 10000))])
    await holder.stop()
    await rm(directory, { recursive: true, force: true })
  }

  const released = await command(
    process.execPath,
    [wrapper, 'ios', '--', process.execPath, '-e', ''],
    { env },
  )

  assert.equal(released.code, 0)
})

test('node target lock keeps stale-lock reclaim exclusive under contention', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const marks = join(root, 'marks')
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
  }
  const child = `
		const fs = require('node:fs');
		const path = require('node:path');
		const id = process.argv[1];
		const marks = process.argv[2];
		fs.mkdirSync(path.join(marks, 'holding-' + id));
		const end = Date.now() + 500;
		const timer = setInterval(() => {
			const others = fs
				.readdirSync(marks)
				.filter((f) => f.startsWith('holding-') && f !== 'holding-' + id);
			if (others.length) {
				fs.writeFileSync(path.join(marks, 'violation'), id + ' saw ' + others.join(','));
			}
			if (Date.now() > end) {
				clearInterval(timer);
				fs.rmdirSync(path.join(marks, 'holding-' + id));
			}
		}, 15);
	`

  try {
    for (let round = 0; round < 5; round++) {
      await rm(marks, { recursive: true, force: true })
      await mkdir(marks, { recursive: true })
      await rm(join(lockRoot, 'ios.lock'), { recursive: true, force: true })
      await mkdir(join(lockRoot, 'ios.lock'), { recursive: true })
      await writeFile(
        join(lockRoot, 'ios.lock', 'owner.json'),
        JSON.stringify({ pid: deadPid(), hostname: hostname() }),
      )

      const waiters = await Promise.all(
        ['a', 'b', 'c', 'd'].map((id) =>
          command(
            process.execPath,
            [wrapper, 'ios', '--timeout', '90', '--', process.execPath, '-e', child, id, marks],
            { env, timeout: 120000 },
          ),
        ),
      )

      for (const result of waiters) {
        assert.equal(result.code, 0, result.stderr)
      }

      assert.equal(
        existsSync(join(marks, 'violation')),
        false,
        `round ${round}: two waiters held the lock concurrently`,
      )
      assert.deepEqual(
        (await readdir(marks)).filter((name) => name.startsWith('holding-')),
        [],
      )
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('node target lock reclaims orphaned and stale-claimed locks', async () => {
  const lockRoot = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = { ...process.env, XPLAT_NATIVE_LOCK_DIR: lockRoot }
  const lockDir = join(lockRoot, 'ios.lock')

  try {
    // Lock dir abandoned before its owner record was written.
    await mkdir(lockDir, { recursive: true })

    const orphaned = await command(
      process.execPath,
      [wrapper, 'ios', '--timeout', '30', '--', process.execPath, '-e', ''],
      { env },
    )

    assert.equal(orphaned.code, 0, orphaned.stderr)

    // Dead owner plus a claim left by a dead reclaimer: both must be reaped.
    await mkdir(lockDir, { recursive: true })
    await writeFile(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )
    await writeFile(
      join(lockDir, '.claim'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )

    const reclaimed = await command(
      process.execPath,
      [wrapper, 'ios', '--timeout', '30', '--', process.execPath, '-e', ''],
      { env },
    )

    assert.equal(reclaimed.code, 0, reclaimed.stderr)
    assert.equal(existsSync(lockDir), false)
  } finally {
    await rm(lockRoot, { recursive: true, force: true })
  }
})

test('python and node wrappers mutually exclude on the same target', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const pythonRelease = join(directory, 'release-python')
  const nodeRelease = join(directory, 'release-node')
  const pyWrapper = fileURLToPath(new URL('./with-native-target-lock.py', import.meta.url))
  const nodeWrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = { ...process.env, XPLAT_NATIVE_LOCK_DIR: directory }
  const child = `
		const fs = require('node:fs');
		console.log('ready');
		setInterval(() => {
			if (fs.existsSync(process.argv[1])) process.exit(0);
		}, 10);
	`

  // Python holds the lock; a Node caller must not acquire it.
  const pyHolder = ownedProcess(
    'python3',
    [pyWrapper, 'ios', process.execPath, '-e', child, pythonRelease],
    { env },
  )

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Missing python lock banner')), 5000)
      const unsubscribe = pyHolder.onLine((value) => {
        if (value.includes('Holding native target lock:')) {
          clearTimeout(timeout)
          unsubscribe()
          resolve()
        }
      })
    })

    const conflict = await command(
      process.execPath,
      [nodeWrapper, 'ios', '--timeout', '1', '--', process.execPath, '-e', ''],
      { env, allowFailure: true, timeout: 20000 },
    )

    assert.notEqual(conflict.code, 0)
    assert.match(conflict.stderr, /timed out waiting for ios lock/)

    const independent = await command(
      process.execPath,
      [nodeWrapper, 'android', '--', process.execPath, '-e', ''],
      { env },
    )

    assert.equal(independent.code, 0)
  } finally {
    await writeFile(pythonRelease, '')
    await pyHolder.stop()
  }

  // Node holds the lock; a Python caller must fail fast.
  const nodeHolder = ownedProcess(
    process.execPath,
    [nodeWrapper, 'ios', '--', process.execPath, '-e', child, nodeRelease],
    { env },
  )

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Missing lock acquisition')), 5000)
      const unsubscribe = nodeHolder.onLine((value) => {
        if (value.includes('acquired')) {
          clearTimeout(timeout)
          unsubscribe()
          resolve()
        }
      })
    })

    const busy = await command('python3', [pyWrapper, 'ios', 'python3', '-c', 'pass'], {
      env,
      allowFailure: true,
    })

    assert.notEqual(busy.code, 0)
    assert.match(busy.stderr, /Native target is busy/)

    const independent = await command('python3', [pyWrapper, 'android', 'python3', '-c', 'pass'], {
      env,
    })

    assert.equal(independent.code, 0)
  } finally {
    await writeFile(nodeRelease, '')
    await nodeHolder.stop()
    await rm(directory, { recursive: true, force: true })
  }
})

test('python target lock reclaims a stale lock without waiting', async () => {
  const lockRoot = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const wrapper = fileURLToPath(new URL('./with-native-target-lock.py', import.meta.url))
  const env = { ...process.env, XPLAT_NATIVE_LOCK_DIR: lockRoot }
  const lockDir = join(lockRoot, 'ios.lock')

  try {
    await mkdir(lockDir, { recursive: true })
    await writeFile(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )
    await writeFile(
      join(lockDir, '.claim'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )

    const reclaimed = await command('python3', [wrapper, 'ios', 'python3', '-c', 'pass'], { env })

    assert.equal(reclaimed.code, 0, reclaimed.stderr)
    assert.equal(existsSync(lockDir), false)
  } finally {
    await rm(lockRoot, { recursive: true, force: true })
  }
})

test('node target lock survives interruption until child cleanup finishes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const marker = join(directory, 'cleaned')
  const release = join(directory, 'release')
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: directory,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
  }
  const source = `
		const fs = require('node:fs');
		let stopping = false;
		process.on('SIGINT', () => {
			if (stopping) return;
			stopping = true;
			console.log('cleaning');
			setInterval(() => {
				if (!fs.existsSync(process.argv[2])) return;
				fs.writeFileSync(process.argv[1], 'done');
				process.exit(0);
			}, 10);
		});
		console.log('ready');
		setInterval(() => {}, 1000);
	`

  const host = ownedProcess(
    process.execPath,
    [wrapper, 'ios', '--', process.execPath, '-e', source, marker, release],
    { env },
  )

  try {
    const line = (expected) =>
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Missing ' + expected)), 5000)
        const unsubscribe = host.onLine((value) => {
          if (value === expected) {
            clearTimeout(timeout)
            unsubscribe()
            resolve()
          }
        })
      })

    await line('ready')

    const cleaning = line('cleaning')
    const stopping = host.stop()

    await cleaning

    // The wrapper forwards the signal to its child and keeps the lock held
    // until that cleanup finishes.
    const busy = await command(
      process.execPath,
      [wrapper, 'ios', '--timeout', '1', '--', process.execPath, '-e', ''],
      { env, allowFailure: true, timeout: 20000 },
    )

    assert.notEqual(busy.code, 0)
    assert.match(busy.stderr, /timed out waiting for ios lock/)
    await writeFile(release, '')
    await stopping
    assert.equal(await readFile(marker, 'utf8'), 'done')

    const released = await command(
      process.execPath,
      [wrapper, 'ios', '--', process.execPath, '-e', ''],
      { env },
    )

    assert.equal(released.code, 0)
  } finally {
    await host.stop()
    await rm(directory, { recursive: true, force: true })
  }
})

test('node target lock never exposes an emptied lock dir to an acquirer', async () => {
  // Regression: removing the lock dir in place unlinked its entries before
  // rmdir, and POSIX rename replaces an empty directory — a concurrent
  // acquirer's renameSync landed in that window and the remover's pending
  // rmdir crashed it with ENOENT/ENOTEMPTY (in the release path, masking
  // the child's real exit code). The --require fixture widens the window
  // to make the interleaving deterministic; removal now renames the dir
  // aside first, so the lock path never exists empty.
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const marks = join(root, 'marks')
  const lockDir = join(lockRoot, 'ios.lock')
  const hook = fileURLToPath(new URL('./fixtures/delay-lockdir-rm.cjs', import.meta.url))
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
    XPLAT_DELAY_RMDIR: lockDir,
    XPLAT_DELAY_MS: '400',
  }
  const child = `
		const fs = require('node:fs');
		const path = require('node:path');
		const id = process.argv[1];
		const marks = process.argv[2];
		fs.mkdirSync(path.join(marks, 'holding-' + id));
		const end = Date.now() + 500;
		const timer = setInterval(() => {
			const others = fs
				.readdirSync(marks)
				.filter((f) => f.startsWith('holding-') && f !== 'holding-' + id);
			if (others.length) {
				fs.writeFileSync(path.join(marks, 'violation'), id + ' saw ' + others.join(','));
			}
			if (Date.now() > end) {
				clearInterval(timer);
				fs.rmdirSync(path.join(marks, 'holding-' + id));
			}
		}, 15);
	`

  try {
    for (let round = 0; round < 4; round++) {
      await rm(marks, { recursive: true, force: true })
      await mkdir(marks, { recursive: true })
      await rm(lockDir, { recursive: true, force: true })
      await mkdir(lockDir, { recursive: true })
      await writeFile(
        join(lockDir, 'owner.json'),
        JSON.stringify({ pid: deadPid(), hostname: hostname() }),
      )

      const waiters = await Promise.all(
        ['a', 'b', 'c'].map((id) =>
          command(
            process.execPath,
            [
              '--require',
              hook,
              wrapper,
              'ios',
              '--timeout',
              '90',
              '--',
              process.execPath,
              '-e',
              child,
              id,
              marks,
            ],
            { env, timeout: 120000 },
          ),
        ),
      )

      for (const result of waiters) {
        assert.equal(result.code, 0, result.stderr)
      }

      assert.equal(
        existsSync(join(marks, 'violation')),
        false,
        `round ${round}: two waiters held the lock concurrently`,
      )
      assert.deepEqual(
        (await readdir(marks)).filter((name) => name.startsWith('holding-')),
        [],
      )
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('node target lock keeps dead-claim eviction ownership-safe under contention', async () => {
  // Regression: the dead-claim reap read the claim record and then unlinked
  // the shared `.claim` path — a check-then-act race. If another evictor
  // landed a fresh live claim in that window, the stale unlink deleted it,
  // producing two concurrent claimants; the loser's removeLockDir then
  // renamed and deleted whatever sat at the lock path, including a fresh
  // live lock. Eviction now renames the claim aside and re-checks the
  // grabbed inode, and removal never deletes at the shared path. The
  // --require fixture delays the eviction rename so racing evictors hit the
  // displaced-live-claim path deterministically.
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const marks = join(root, 'marks')
  const lockDir = join(lockRoot, 'ios.lock')
  const hook = fileURLToPath(new URL('./fixtures/delay-claim-evict.cjs', import.meta.url))
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
    XPLAT_DELAY_RMDIR: lockDir,
    XPLAT_DELAY_MS: '150',
  }
  const child = `
		const fs = require('node:fs');
		const path = require('node:path');
		const id = process.argv[1];
		const marks = process.argv[2];
		fs.mkdirSync(path.join(marks, 'holding-' + id));
		const end = Date.now() + 400;
		const timer = setInterval(() => {
			const others = fs
				.readdirSync(marks)
				.filter((f) => f.startsWith('holding-') && f !== 'holding-' + id);
			if (others.length) {
				fs.writeFileSync(path.join(marks, 'violation'), id + ' saw ' + others.join(','));
			}
			if (Date.now() > end) {
				clearInterval(timer);
				fs.rmdirSync(path.join(marks, 'holding-' + id));
			}
		}, 15);
	`

  try {
    for (let round = 0; round < 4; round++) {
      await rm(marks, { recursive: true, force: true })
      await mkdir(marks, { recursive: true })
      await rm(lockDir, { recursive: true, force: true })
      await mkdir(lockDir, { recursive: true })
      await writeFile(
        join(lockDir, 'owner.json'),
        JSON.stringify({ pid: deadPid(), hostname: hostname() }),
      )
      await writeFile(
        join(lockDir, '.claim'),
        JSON.stringify({ pid: deadPid(), hostname: hostname() }),
      )

      const waiters = await Promise.all(
        ['a', 'b', 'c', 'd'].map((id) =>
          command(
            process.execPath,
            [
              '--require',
              hook,
              wrapper,
              'ios',
              '--timeout',
              '90',
              '--',
              process.execPath,
              '-e',
              child,
              id,
              marks,
            ],
            { env, timeout: 120000 },
          ),
        ),
      )

      for (const result of waiters) {
        assert.equal(result.code, 0, result.stderr)
      }

      assert.equal(
        existsSync(join(marks, 'violation')),
        false,
        `round ${round}: two waiters held the lock concurrently`,
      )
      assert.deepEqual(
        (await readdir(marks)).filter((name) => name.startsWith('holding-')),
        [],
      )
    }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('node target lock restores a live dir captured mid-reclaim', async () => {
  // Regression: the claim holder's deferred rename(lockDir -> trash) bound
  // to the path, not the verified dir — claim destruction let the dir be
  // reclaimed and replaced, then the stalled rename captured and deleted a
  // fresh live lock, collapsing mutual exclusion. Removal is now bound to
  // the verified inode and a foreign capture is renamed back. The gate
  // fixture parks the removal rename so the test lands a real replacement
  // (a waiter's live lock) inside the window deterministically.
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const marks = join(root, 'marks')
  const ctl = join(root, 'ctl')
  const lockDir = join(lockRoot, 'ios.lock')
  const hook = fileURLToPath(new URL('./fixtures/gate-lockdir-rename.cjs', import.meta.url))
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
    XPLAT_GATE_LOCKDIR: lockDir,
    XPLAT_GATE_DIR: ctl,
  }

  let reaper
  let waiters = []

  try {
    await mkdir(lockRoot, { recursive: true })
    await mkdir(marks, { recursive: true })
    await mkdir(ctl, { recursive: true })
    await mkdir(lockDir, { recursive: true })
    await writeFile(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )
    await writeFile(
      join(lockDir, '.claim'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )

    reaper = ownedProcess(
      process.execPath,
      [
        '--require',
        hook,
        wrapper,
        'ios',
        '--timeout',
        '90',
        '--',
        process.execPath,
        '-e',
        markerChild,
        'c1',
        marks,
      ],
      { env },
    )

    // C1 claims the stale dir and parks before its removal rename.
    await waitForPath(join(ctl, 'at-lockdir-rename'), 'gated removal rename')

    // Waiters race while C1 is parked; deleting the stale dir frees the
    // path so one lands a real live lock inside C1's deferred window —
    // the replacement the old code captured and deleted.
    waiters = ['w1', 'w2', 'w3'].map((id) =>
      command(
        process.execPath,
        [wrapper, 'ios', '--timeout', '90', '--', process.execPath, '-e', markerChild, id, marks],
        { env, timeout: 120000 },
      ),
    )
    await rm(lockDir, { recursive: true, force: true })

    const victimPid = await waitForLiveOwner(join(lockDir, 'owner.json'))
    await waitForHolder(marks)

    await writeFile(join(ctl, 'go-lockdir-rename'), '')
    await sleep(300)

    // The captured live dir was put back, not deleted.
    assert.equal(readRecord(join(lockDir, 'owner.json'))?.pid, victimPid)

    for (const result of await Promise.all(waiters)) {
      assert.equal(result.code, 0, result.stderr)
    }

    assert.equal(existsSync(join(marks, 'violation')), false, 'concurrent holders')
  } finally {
    await Promise.allSettled(waiters)
    await reaper?.stop()
    await rm(root, { recursive: true, force: true })
  }
})

test('python target lock restores a live dir captured mid-reclaim', async () => {
  // Same regression as the node test, driven through native_target_lock.py
  // by the gated worker fixture; waiters mix Python and Node to prove the
  // restored lock excludes across both implementations.
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const marks = join(root, 'marks')
  const ctl = join(root, 'ctl')
  const lockDir = join(lockRoot, 'ios.lock')
  const pyWorker = fileURLToPath(new URL('./fixtures/gated-lock-worker.py', import.meta.url))
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
    XPLAT_GATE_LOCKDIR: lockDir,
    XPLAT_GATE_DIR: ctl,
    XPLAT_GATE_TARGET: 'ios',
  }

  let reaper
  let waiters = []

  try {
    await mkdir(lockRoot, { recursive: true })
    await mkdir(marks, { recursive: true })
    await mkdir(ctl, { recursive: true })
    await mkdir(lockDir, { recursive: true })
    await writeFile(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )
    await writeFile(
      join(lockDir, '.claim'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )

    reaper = ownedProcess('python3', [pyWorker], {
      env: { ...env, XPLAT_MARKS: marks, XPLAT_ID: 'c1' },
    })

    await waitForPath(join(ctl, 'at-lockdir-rename'), 'gated removal rename')

    waiters = [
      command('python3', [pyWorker], {
        env: { ...env, XPLAT_MARKS: marks, XPLAT_ID: 'wp1' },
        timeout: 120000,
      }),
      command('python3', [pyWorker], {
        env: { ...env, XPLAT_MARKS: marks, XPLAT_ID: 'wp2' },
        timeout: 120000,
      }),
      command(
        process.execPath,
        [wrapper, 'ios', '--timeout', '90', '--', process.execPath, '-e', markerChild, 'wn', marks],
        { env, timeout: 120000 },
      ),
    ]
    await rm(lockDir, { recursive: true, force: true })

    const victimPid = await waitForLiveOwner(join(lockDir, 'owner.json'))
    await waitForHolder(marks)

    await writeFile(join(ctl, 'go-lockdir-rename'), '')
    await sleep(300)

    assert.equal(readRecord(join(lockDir, 'owner.json'))?.pid, victimPid)

    for (const result of await Promise.all(waiters)) {
      assert.equal(result.code, 0, result.stderr)
    }

    assert.equal(existsSync(join(marks, 'violation')), false, 'concurrent holders')
  } finally {
    await Promise.allSettled(waiters)
    await reaper?.stop()
    await rm(root, { recursive: true, force: true })
  }
})

test('node target lock release restores a live dir swapped under it', async () => {
  // Regression: a victim whose dir was stolen (stale reaper or an
  // old-checkout remover) still ran an unconditional rename(lockDir ->
  // trash) in release() — it captured and deleted the NEXT owner's live
  // dir, cascading the theft through the whole contention episode.
  // Release now verifies the captured inode and owner and puts a foreign
  // dir back.
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const ctl = join(root, 'ctl')
  const releaseChild = join(root, 'release')
  const lockDir = join(lockRoot, 'ios.lock')
  const hook = fileURLToPath(new URL('./fixtures/gate-lockdir-rename.cjs', import.meta.url))
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
    XPLAT_GATE_LOCKDIR: lockDir,
    XPLAT_GATE_DIR: ctl,
  }
  const child = `
		const fs = require('node:fs');
		console.log('ready');
		setInterval(() => {
			if (fs.existsSync(${JSON.stringify(releaseChild)})) process.exit(0);
		}, 10);
	`

  const holder = ownedProcess(
    process.execPath,
    ['--require', hook, wrapper, 'ios', '--', process.execPath, '-e', child],
    { env },
  )

  try {
    await mkdir(lockRoot, { recursive: true })
    await mkdir(ctl, { recursive: true })

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Missing lock acquisition')), 10000)
      const unsubscribe = holder.onLine((value) => {
        if (value.includes('acquired')) {
          clearTimeout(timeout)
          unsubscribe()
          resolve()
        }
      })
    })

    // The child exits; the wrapper's release parks inside its removal rename.
    await writeFile(releaseChild, '')
    await waitForPath(join(ctl, 'at-lockdir-rename'), 'gated release rename')

    // While the rename is parked, the holder's dir is stolen and a foreign
    // live dir (owned by this test process) takes its place.
    await rename(lockDir, join(lockRoot, 'stolen-a'))
    await mkdir(lockDir)
    await writeFile(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: process.pid, hostname: hostname() }),
    )

    await writeFile(join(ctl, 'go-lockdir-rename'), '')
    await Promise.race([holder.closed, sleep(10000)])

    // The foreign live dir was captured, verified, and put back — not deleted.
    assert.equal(readRecord(join(lockDir, 'owner.json'))?.pid, process.pid)
    assert.equal(existsSync(join(lockRoot, 'stolen-a')), true)
  } finally {
    await holder.stop()
    await rm(root, { recursive: true, force: true })
  }
})

test('python target lock release restores a live dir swapped under it', async () => {
  // Same regression as the node release test, driven through
  // native_target_lock.py's target_lock.release() by the gated worker.
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const ctl = join(root, 'ctl')
  const lockDir = join(lockRoot, 'ios.lock')
  const pyWorker = fileURLToPath(new URL('./fixtures/gated-lock-worker.py', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_GATE_LOCKDIR: lockDir,
    XPLAT_GATE_DIR: ctl,
    XPLAT_GATE_TARGET: 'ios',
  }

  const holder = ownedProcess('python3', [pyWorker], { env })

  try {
    await mkdir(lockRoot, { recursive: true })
    await mkdir(ctl, { recursive: true })

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Missing python acquisition')), 10000)
      const unsubscribe = holder.onLine((value) => {
        if (value.startsWith('ACQUIRED')) {
          clearTimeout(timeout)
          unsubscribe()
          resolve()
        }
      })
    })

    // Ask the worker to release; it parks inside the removal rename.
    await writeFile(join(ctl, 'release-worker'), '')
    await waitForPath(join(ctl, 'at-lockdir-rename'), 'gated release rename')

    await rename(lockDir, join(lockRoot, 'stolen-a'))
    await mkdir(lockDir)
    await writeFile(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: process.pid, hostname: hostname() }),
    )

    await writeFile(join(ctl, 'go-lockdir-rename'), '')
    await Promise.race([holder.closed, sleep(10000)])

    assert.equal(readRecord(join(lockDir, 'owner.json'))?.pid, process.pid)
    assert.equal(existsSync(join(lockRoot, 'stolen-a')), true)
  } finally {
    await holder.stop()
    await rm(root, { recursive: true, force: true })
  }
})

// Wait until the displaced victim's record is back at the lock path (the
// fix: a landing acquirer restores the exiled dir before claiming) or the
// third acquirer starts holding (the gap: it claimed while the victim was
// still parked under the reaper's trash name). Which one fires tells the
// two behaviors apart deterministically.
async function waitForRestoreOrThird(lockDir, victimPid, marks, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs

  for (;;) {
    if (readRecord(join(lockDir, 'owner.json'))?.pid === victimPid) {
      return 'restored'
    }
    if (existsSync(join(marks, 'holding-third'))) {
      return 'claimed'
    }
    if (Date.now() > deadline) {
      throw new Error('third acquirer never landed on the freed lock path')
    }
    await sleep(10)
  }
}

test('node target lock restores a displaced live dir before a third holder runs', async () => {
  // Regression: a stale reaper's deferred removal rename captured a live
  // replacement lock dir, and the restore rename lost the freed lock path
  // to a third acquisition — the displaced live dir stayed preserved under
  // the reaper's trash name while its owner kept running, so victim and
  // third held the lock concurrently. Acquirers now check for exiled live
  // dirs right after landing and vacate to restore them before claiming
  // the target. The restore gate fixture parks the capture's rename-back
  // so the third landing wins deterministically.
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const marks = join(root, 'marks')
  const ctl = join(root, 'ctl')
  const lockDir = join(lockRoot, 'ios.lock')
  const hook = fileURLToPath(new URL('./fixtures/gate-lockdir-rename.cjs', import.meta.url))
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
    XPLAT_GATE_LOCKDIR: lockDir,
    XPLAT_GATE_DIR: ctl,
    XPLAT_GATE_RESTORE: '1',
  }

  let reaper
  let waiters = []

  try {
    await mkdir(lockRoot, { recursive: true })
    await mkdir(marks, { recursive: true })
    await mkdir(ctl, { recursive: true })
    await mkdir(lockDir, { recursive: true })
    await writeFile(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )
    await writeFile(
      join(lockDir, '.claim'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )

    reaper = ownedProcess(
      process.execPath,
      [
        '--require',
        hook,
        wrapper,
        'ios',
        '--timeout',
        '90',
        '--',
        process.execPath,
        '-e',
        markerChild,
        'reaper',
        marks,
      ],
      { env },
    )

    // The reaper claims the stale dir and parks before its removal rename.
    await waitForPath(join(ctl, 'at-lockdir-rename'), 'gated removal rename')

    // Free the path so a waiter lands a real live lock inside the window.
    const victim = command(
      process.execPath,
      [wrapper, 'ios', '--timeout', '90', '--', process.execPath, '-e', markerChild, 'victim', marks],
      { env, timeout: 120000 },
    )
    await rm(lockDir, { recursive: true, force: true })

    const victimPid = await waitForLiveOwner(join(lockDir, 'owner.json'))
    await waitForHolder(marks)

    // The reaper's rename captures the live dir and parks before the
    // restore rename — the capture→restore gap a third dir can land in.
    await writeFile(join(ctl, 'go-lockdir-rename'), '')
    await waitForPath(join(ctl, 'at-lockdir-restore'), 'gated restore rename')

    const third = command(
      process.execPath,
      [wrapper, 'ios', '--timeout', '90', '--', process.execPath, '-e', markerChild, 'third', marks],
      { env, timeout: 120000 },
    )
    waiters = [victim, third]

    const outcome = await waitForRestoreOrThird(lockDir, victimPid, marks)
    assert.equal(
      outcome,
      'restored',
      'third acquirer held the target while the displaced victim still ran',
    )

    await writeFile(join(ctl, 'go-lockdir-restore'), '')

    for (const result of await Promise.all(waiters)) {
      assert.equal(result.code, 0, result.stderr)
    }

    assert.equal(existsSync(join(marks, 'violation')), false, 'concurrent holders')
  } finally {
    await Promise.allSettled(waiters)
    await reaper?.stop()
    await rm(root, { recursive: true, force: true })
  }
})

test('python target lock restores a displaced live dir before a third holder runs', async () => {
  // Same regression as the node test, driven through native_target_lock.py
  // by the gated worker; the victim is a Python claimant and the third
  // lander a Node wrapper so the restore excludes across implementations.
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const marks = join(root, 'marks')
  const ctl = join(root, 'ctl')
  const lockDir = join(lockRoot, 'ios.lock')
  const pyWorker = fileURLToPath(new URL('./fixtures/gated-lock-worker.py', import.meta.url))
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
    XPLAT_GATE_LOCKDIR: lockDir,
    XPLAT_GATE_DIR: ctl,
    XPLAT_GATE_TARGET: 'ios',
    XPLAT_GATE_RESTORE: '1',
  }

  let reaper
  let waiters = []

  try {
    await mkdir(lockRoot, { recursive: true })
    await mkdir(marks, { recursive: true })
    await mkdir(ctl, { recursive: true })
    await mkdir(lockDir, { recursive: true })
    await writeFile(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )
    await writeFile(
      join(lockDir, '.claim'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )

    reaper = ownedProcess('python3', [pyWorker], {
      env: { ...env, XPLAT_MARKS: marks, XPLAT_ID: 'reaper' },
    })

    await waitForPath(join(ctl, 'at-lockdir-rename'), 'gated removal rename')

    const victim = command('python3', [pyWorker], {
      env: { ...env, XPLAT_MARKS: marks, XPLAT_ID: 'victim' },
      timeout: 120000,
    })
    await rm(lockDir, { recursive: true, force: true })

    const victimPid = await waitForLiveOwner(join(lockDir, 'owner.json'))
    await waitForHolder(marks)

    await writeFile(join(ctl, 'go-lockdir-rename'), '')
    await waitForPath(join(ctl, 'at-lockdir-restore'), 'gated restore rename')

    const third = command(
      process.execPath,
      [wrapper, 'ios', '--timeout', '90', '--', process.execPath, '-e', markerChild, 'third', marks],
      { env, timeout: 120000 },
    )
    waiters = [victim, third]

    const outcome = await waitForRestoreOrThird(lockDir, victimPid, marks)
    assert.equal(
      outcome,
      'restored',
      'third acquirer held the target while the displaced victim still ran',
    )

    await writeFile(join(ctl, 'go-lockdir-restore'), '')

    for (const result of await Promise.all(waiters)) {
      assert.equal(result.code, 0, result.stderr)
    }

    assert.equal(existsSync(join(marks, 'violation')), false, 'concurrent holders')
  } finally {
    await Promise.allSettled(waiters)
    await reaper?.stop()
    await rm(root, { recursive: true, force: true })
  }
})

test('target lock recovers a live exile when the reaper dies mid-capture', async () => {
  // Same displaced-dir gap, but the stale reaper is killed while parked in
  // the restore window: its trash dir holds the captured live lock with a
  // dead reaper pid and a live owner record. The third acquirer still has
  // to restore it before claiming, and the crash debris — claim source,
  // staging dir, empty trash name — must not strand later sweeps.
  const root = await mkdtemp(join(tmpdir(), 'xplat-lock-test-'))
  const lockRoot = join(root, 'locks')
  const marks = join(root, 'marks')
  const ctl = join(root, 'ctl')
  const lockDir = join(lockRoot, 'ios.lock')
  const hook = fileURLToPath(new URL('./fixtures/gate-lockdir-rename.cjs', import.meta.url))
  const wrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = {
    ...process.env,
    XPLAT_NATIVE_LOCK_DIR: lockRoot,
    XPLAT_NATIVE_LOCK_POLL_MS: '50',
    XPLAT_GATE_LOCKDIR: lockDir,
    XPLAT_GATE_DIR: ctl,
    XPLAT_GATE_RESTORE: '1',
  }

  let reaper
  let waiters = []

  try {
    await mkdir(lockRoot, { recursive: true })
    await mkdir(marks, { recursive: true })
    await mkdir(ctl, { recursive: true })
    await mkdir(lockDir, { recursive: true })
    await writeFile(
      join(lockDir, 'owner.json'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )
    await writeFile(
      join(lockDir, '.claim'),
      JSON.stringify({ pid: deadPid(), hostname: hostname() }),
    )

    reaper = ownedProcess(
      process.execPath,
      [
        '--require',
        hook,
        wrapper,
        'ios',
        '--timeout',
        '90',
        '--',
        process.execPath,
        '-e',
        markerChild,
        'reaper',
        marks,
      ],
      { env },
    )

    await waitForPath(join(ctl, 'at-lockdir-rename'), 'gated removal rename')

    const victim = command(
      'python3',
      [fileURLToPath(new URL('./fixtures/gated-lock-worker.py', import.meta.url))],
      {
        env: {
          ...env,
          XPLAT_MARKS: marks,
          XPLAT_ID: 'victim',
          XPLAT_GATE_TARGET: 'ios',
        },
        timeout: 120000,
      },
    )
    await rm(lockDir, { recursive: true, force: true })

    const victimPid = await waitForLiveOwner(join(lockDir, 'owner.json'))
    await waitForHolder(marks)

    await writeFile(join(ctl, 'go-lockdir-rename'), '')
    await waitForPath(join(ctl, 'at-lockdir-restore'), 'gated restore rename')

    const third = command(
      process.execPath,
      [wrapper, 'ios', '--timeout', '90', '--', process.execPath, '-e', markerChild, 'third', marks],
      { env, timeout: 120000 },
    )
    waiters = [victim, third]

    const outcome = await waitForRestoreOrThird(lockDir, victimPid, marks)
    assert.equal(
      outcome,
      'restored',
      'third acquirer held the target while the displaced victim still ran',
    )

    // The reaper dies holding the restored-path bookkeeping: its crash must
    // not strand the displaced dir or poison later acquisitions.
    reaper.child.kill('SIGKILL')
    await writeFile(join(ctl, 'go-lockdir-restore'), '')

    for (const result of await Promise.all(waiters)) {
      assert.equal(result.code, 0, result.stderr)
    }

    assert.equal(existsSync(join(marks, 'violation')), false, 'concurrent holders')

    // One more clean acquisition sweeps the dead reaper's debris.
    const sweep = await command(
      process.execPath,
      [wrapper, 'ios', '--timeout', '30', '--', process.execPath, '-e', ''],
      { env, timeout: 60000 },
    )

    assert.equal(sweep.code, 0, sweep.stderr)
    assert.deepEqual(
      (await readdir(lockRoot)).filter((name) => /reap|staging|claimsrc/.test(name)),
      [],
    )
  } finally {
    await Promise.allSettled(waiters)
    await reaper?.stop()
    await rm(root, { recursive: true, force: true })
  }
})
