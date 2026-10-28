import { test } from 'node:test'
import assert from 'node:assert/strict'
import { disposeImage, updateImage } from '../src/image.ts'
import { mockGlobals } from './mock-globals.ts'

function fixture() {
	const queue: (() => void)[] = []
	const tasks: any[] = []
	let failStart = false, failResume = false, decodes = 0
	const restore = mockGlobals({
		NSImage: { alloc: () => ({ initWithData: (data: unknown) => { decodes++; return { data } } }) },
		NSURL: { URLWithString: (src: string) => src.endsWith('/invalid') ? null : src },
		NSOperationQueue: { mainQueue: { addOperationWithBlock: (block: () => void) => queue.push(block) } },
		NSURLSession: { sharedSession: { dataTaskWithURLCompletionHandler: (url: string, handler: (...args: any[]) => void) => {
			if (failStart) throw new Error('setup failed')
			const task = { url, handler, cancelled: 0,
				resume() { if (failResume) throw new Error('resume failed') },
				cancel() { this.cancelled++ },
			}
			tasks.push(task)
			return task
		} } },
	})
	return { restore, tasks, flush: () => { while (queue.length) queue.shift()!() }, decodes: () => decodes,
		failStart: (value: boolean) => { failStart = value }, failResume: (value: boolean) => { failResume = value },
	}
}

test('remote processing waits for the main queue and rejects HTTP error payloads', () => {
	const env = fixture()
	try {
		const view: any = { image: null }
		updateImage(view, 'https://image-test/main-queue')
		env.tasks[0].handler('bytes', { statusCode: 200 }, null)
		assert.equal(view.image, null)
		assert.equal(env.decodes(), 0)
		env.flush()
		assert.deepEqual(view.image, { data: 'bytes' })
		updateImage(view, 'https://image-test/http-error')
		env.tasks[1].handler('error-image', { statusCode: 404 }, null)
		env.flush()
		assert.equal(view.image, null)
		assert.equal(env.decodes(), 1)
	} finally { env.restore() }
})

test('shared remote work stays alive for another view and cancels before queued work paints a disposed view', () => {
	const env = fixture()
	try {
		const first: any = { image: null }, second: any = { image: null }
		updateImage(first, 'https://image-test/shared')
		updateImage(second, 'https://image-test/shared')
		disposeImage(first)
		assert.equal(env.tasks[0].cancelled, 0)
		env.tasks[0].handler('shared', { statusCode: 200 }, null)
		disposeImage(second)
		assert.equal(env.tasks[0].cancelled, 1)
		env.flush()
		assert.equal(env.decodes(), 0)
		assert.equal(first.image, null)
		assert.equal(second.image, null)
		const retry: any = { image: null }
		updateImage(retry, 'https://image-test/shared')
		assert.equal(env.tasks.length, 2)
		env.tasks[1].handler('retry', { statusCode: 200 }, null)
		env.flush()
		assert.deepEqual(retry.image, { data: 'retry' })
	} finally { env.restore() }
})

test('invalid URLs, setup failures and resume failures settle without poisoning future loads', () => {
	const env = fixture()
	try {
		const view: any = { image: null }
		updateImage(view, 'https://image-test/invalid')
		assert.equal(env.tasks.length, 0)
		env.failStart(true)
		updateImage(view, 'https://image-test/setup')
		assert.equal(view.image, null)
		env.failStart(false)
		env.failResume(true)
		updateImage(view, 'https://image-test/resume')
		assert.equal(env.tasks[0].cancelled, 1)
		env.failResume(false)
		const retry: any = { image: null }
		updateImage(retry, 'https://image-test/setup')
		env.tasks[1].handler('retry', { statusCode: 200 }, null)
		env.flush()
		assert.deepEqual(retry.image, { data: 'retry' })
	} finally { env.restore() }
})

test('a missing main-queue bridge fails without starting or permanently reserving a source', () => {
	const env = fixture()
	try {
		const restoreMissing = mockGlobals({ NSOperationQueue: { mainQueue: null } })
		try {
			const first: any = { image: null }
			updateImage(first, 'https://image-test/queue-unavailable')
			assert.equal(first.image, null)
			assert.equal(env.tasks.length, 0)
		} finally { restoreMissing() }
		const retry: any = { image: null }
		updateImage(retry, 'https://image-test/queue-unavailable')
		env.tasks[0].handler('retry', { statusCode: 200 }, null)
		env.flush()
		assert.deepEqual(retry.image, { data: 'retry' })
	} finally { env.restore() }
})
