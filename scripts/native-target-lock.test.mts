import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
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
  const marker = join(directory, 'release')
  const pyWrapper = fileURLToPath(new URL('./with-native-target-lock.py', import.meta.url))
  const nodeWrapper = fileURLToPath(new URL('./with-target-lock.ts', import.meta.url))
  const env = { ...process.env, XPLAT_NATIVE_LOCK_DIR: directory }
  const child = `
		const fs = require('node:fs');
		console.log('ready');
		setInterval(() => {
			if (fs.existsSync(${JSON.stringify(marker)})) process.exit(0);
		}, 10);
	`

  // Python holds the lock; a Node caller must not acquire it.
  const pyHolder = ownedProcess('python3', [pyWrapper, 'ios', process.execPath, '-e', child], {
    env,
  })

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
    await writeFile(marker, '')
    await pyHolder.stop()
  }

  // Node holds the lock; a Python caller must fail fast.
  const nodeHolder = ownedProcess(
    process.execPath,
    [nodeWrapper, 'ios', '--', process.execPath, '-e', child],
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
    await writeFile(marker, '')
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
