import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs'
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import ignore from 'ignore'

const EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.mts', '.cts', '.tsx', '.tsrx'])
const IGNORED_DIRECTORIES = new Set([
	'.git',
	'.next',
	'.nx',
	'.turbo',
	'build',
	'coverage',
	'dist',
	'graft',
	'node_modules',
	'out',
	'prior-art',
	'release',
	'research',
	'tmp',
])

// Select files once for both engines. Explicit paths obey the same ignores,
// repository boundaries and symlink policy as recursive discovery.
export function collectFiles(cwd: string, inputs: string[], patterns: string[]) {
	const selected = inputs.map((input) => {
		const file = resolve(cwd, input)
		const rel = relative(cwd, file)
		if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
			throw new Error(`path must be inside the working directory: ${input}`)
		}
		const stat = lstatSync(file, { throwIfNoEntry: false })
		if (!stat) {
			throw new Error(`no such file or directory: ${input}`)
		}
		if (stat.isSymbolicLink()) {
			throw new Error(`not following symlink: ${input}`)
		}
		if (!stat.isDirectory() && (!stat.isFile() || !EXTENSIONS.has(extname(file)))) {
			throw new Error(`unsupported source file: ${input}`)
		}
		return file
	})
	const configIgnore = ignore().add(patterns)
	const eslintMatcher = ignore()
	const eslintIgnore = join(cwd, '.eslintignore')
	if (existsSync(eslintIgnore)) {
		eslintMatcher.add(readFileSync(eslintIgnore, 'utf8'))
	}
	const files: string[] = []
	const visit = (
		directory: string,
		parents: { directory: string; matcher: ReturnType<typeof ignore> }[],
	) => {
		const localIgnore = join(directory, '.gitignore')
		const matchers = existsSync(localIgnore)
			? [...parents, { directory, matcher: ignore().add(readFileSync(localIgnore, 'utf8')) }]
			: parents
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			if (entry.isSymbolicLink()) {
				continue
			}

			const file = join(directory, entry.name)
			const isDirectory = entry.isDirectory()
			if (
				selected.length &&
				!selected.some(
					(path) =>
						file === path ||
						file.startsWith(path + sep) ||
						(isDirectory && path.startsWith(file + sep)) ||
						path === cwd,
				)
			) {
				continue
			}

			if (isDirectory && (IGNORED_DIRECTORIES.has(entry.name) || existsSync(join(file, '.git')))) {
				continue
			}

			const suffix = isDirectory ? '/' : ''
			const rel = relative(cwd, file).replaceAll('\\', '/') + suffix
			if (configIgnore.ignores(rel) || eslintMatcher.ignores(rel)) {
				continue
			}

			let gitIgnored = false
			for (const { directory: base, matcher } of matchers) {
				const result = matcher.test(relative(base, file).replaceAll('\\', '/') + suffix)
				if (result.ignored) {
					gitIgnored = true
				} else if (result.unignored) {
					gitIgnored = false
				}
			}

			if (gitIgnored) {
				continue
			}

			if (isDirectory) {
				visit(file, matchers)
			} else if (entry.isFile() && EXTENSIONS.has(extname(file))) {
				files.push(file)
			}
		}
	}
	visit(cwd, [])
	return files.sort()
}
