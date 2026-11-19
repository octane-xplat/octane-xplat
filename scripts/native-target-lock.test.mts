import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { command, ownedProcess } from '../tools/probe/process.ts'

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
