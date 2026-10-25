import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { RELEASES, releaseName, releaseVersion, type Release } from './release-version.ts'

type Note = { path: string; release: Release; kind: 'features' | 'fixes'; body: string }
const repository = 'https://github.com/octane-xplat/octane-xplat'

export function readNotes(root: string): Note[] {
	const notes: Note[] = []
	for (const kind of ['features', 'fixes'] as const) {
		const directory = join(root, '.changelog', kind === 'fixes' ? 'fixes' : '')
		if (!existsSync(directory)) {
			continue
		}
		for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
			a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
		)) {
			if (!entry.name.endsWith('.md')) {
				continue
			}
			const path = join(directory, entry.name)
			assert.ok(entry.isFile(), `${path}: a release note must be a regular file`)
			const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
			const header = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text)
			assert.ok(
				header || !text.startsWith('---'),
				`${path}: close the YAML header or omit it`,
			)
			let release: Release = 'lockstep'
			let body = text
			if (header) {
				const metadata = parse(header[1])
				assert.ok(
					metadata &&
						typeof metadata === 'object' &&
						Object.keys(metadata).length === 1 &&
						Object.hasOwn(metadata, 'release'),
					`${path}: the header must contain only release`,
				)
				release = releaseName(metadata.release)
				body = header[2]
			}
			body = body.trim()
			assert.match(
				body,
				/^### \S[^\n]*\n\s*\n\S/,
				`${path}: use a ### title, a blank line, and a description`,
			)
			// Reserve level 1/2 headings for the logs and release sections. Ignore
			// fenced examples, where a shell comment can start with "#" too.
			let fence: string | undefined
			for (const line of body.split('\n')) {
				const delimiter = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1]
				if (fence) {
					if (
						delimiter &&
						delimiter[0] === fence[0] &&
						delimiter.length >= fence.length &&
						line.trim() === delimiter
					) {
						fence = undefined
					}
				} else if (delimiter) {
					fence = delimiter
				} else {
					assert.ok(!/^ {0,3}#{1,2}\s/.test(line), `${path}: headings must use ### or deeper`)
					assert.ok(
						!/^ {0,3}(?:={3,}|-{3,})\s*$/.test(line),
						`${path}: use ### headings instead of underlined headings`,
					)
				}
			}
			assert.ok(!fence, `${path}: close the code fence`)
			notes.push({ path, release, kind, body })
		}
	}
	return notes
}

export function renderNotes(
	root: string,
	release: Release,
	version: string,
	date = new Date().toISOString().slice(0, 10),
) {
	version = releaseVersion(version)
	assert.match(date, /^\d{4}-\d{2}-\d{2}$/)
	const { prefix, label } = RELEASES[release]
	const url = `${repository}/releases/tag/${prefix}${version}`
	const heading = `## [${label} ${version}](${url}) - ${date}`
	const notes = readNotes(root).filter((note) => note.release === release)
	const sections = [
		{ kind: 'features', file: 'CHANGELOG.md', title: 'Features and breaking changes' },
		{ kind: 'fixes', file: 'FIXLOG.md', title: 'Fixes' },
	] as const
	const logs: { path: string; content: string }[] = []
	const github: string[] = []
	for (const { kind, file, title } of sections) {
		const body = notes
			.filter((note) => note.kind === kind)
			.map((note) => note.body)
			.join('\n\n')
		const path = join(root, file)
		const existing = existsSync(path)
			? readFileSync(path, 'utf8')
			: `# ${file === 'CHANGELOG.md' ? 'Changelog' : 'Fixlog'}\n`
		// Catch attempts to consume a second batch for an already recorded release.
		assert.ok(!existing.includes(`](${url})`), `${file}: ${prefix}${version} is already recorded`)
		if (!body) {
			continue
		}
		const lines = existing.split('\n')
		const firstRelease = lines.findIndex((line) => line.startsWith('## '))
		const position = firstRelease < 0 ? lines.length : firstRelease
		const before = lines.slice(0, position).join('\n').trimEnd()
		const after = lines.slice(position).join('\n')
		logs.push({ path, content: `${before}\n\n${heading}\n\n${body}\n\n${after}`.trimEnd() + '\n' })
		github.push(`## ${title}\n\n${body}`)
	}
	return {
		notes,
		logs,
		github: (github.join('\n\n') || 'No user-facing release notes for this release.') + '\n',
	}
}

export function prepareNotes(root: string, release: Release, version: string, date?: string) {
	// Validate and assemble everything before changing either log or consuming
	// files. The workflow commits these edits together, before publishing.
	const result = renderNotes(root, release, version, date)
	for (const log of result.logs) {
		writeFileSync(log.path, log.content)
	}
	writeFileSync(join(root, '.release-notes.md'), result.github)
	for (const note of result.notes) {
		unlinkSync(note.path)
	}
	return result
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		const [command, release, version, ...rest] = process.argv.slice(2)
		if (command === 'check' && !release) {
			console.log(`Validated ${readNotes(process.cwd()).length} release notes.`)
		} else {
			assert.ok(
				['preview', 'prepare'].includes(command) && version && !rest.length,
				'usage: node scripts/release-notes.ts check | <preview|prepare> <lockstep|tsrx-typegen> <version>',
			)
			const run = command === 'prepare' ? prepareNotes : renderNotes
			const result = run(process.cwd(), releaseName(release), version)
			process.stdout.write(result.github)
		}
	} catch (error) {
		console.error(error.message)
		process.exitCode = 1
	}
}
