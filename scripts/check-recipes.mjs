import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// Intentionally supports the small Markdown contract in recipes/README.md.
// Coverage quality and Silo evidence are reviewed separately.
export function checkRecipes(root) {
	const errors = []
	const ids = new Set()
	const directory = resolve(root, 'recipes')
	const files = readdirSync(directory).filter(
		(file) => file.endsWith('.md') && file !== 'README.md',
	)

	if (!files.length) {
		errors.push('recipes: no recipes found')
	}

	for (const file of files) {
		const path = resolve(directory, file)
		const source = readFileSync(path, 'utf8')
		const fail = (message) => errors.push(`${file}: ${message}`)
		const id = source.match(/^ID: ([a-z0-9]+(?:-[a-z0-9]+)*)$/m)?.[1]
		if (!id || ids.has(id)) {
			fail('missing, invalid, or duplicate recipe ID')
		}

		ids.add(id)
		if (!/^# .+/m.test(source)) {
			fail('missing title')
		}

		const targets =
			source
				.match(/^Targets: (.+)$/m)?.[1]
				.split(',')
				.map((value) => value.trim()) ?? []

		if (
			!targets.length ||
			new Set(targets).size !== targets.length ||
			targets.some((target) => !['web', 'ios', 'android', 'macos'].includes(target))
		) {
			fail('invalid Targets')
		}

		if (!/^Related APIs: \S.+$/m.test(source)) {
			fail('missing Related APIs')
		}

		const sections = new Map()
		for (const match of source.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) {
			if (sections.has(match[1])) {
				fail(`duplicate section ${match[1]}`)
			}

			sections.set(match[1], match[2].trim())
		}

		for (const heading of [
			'Starting point',
			'Requirements',
			'Acceptance criteria',
			'Documentation',
		]) {
			if (!sections.get(heading)) {
				fail(`missing or empty ${heading}`)
			}
		}

		const entries = (heading) => {
			const result = new Map()
			for (const match of (sections.get(heading) ?? '').matchAll(/^- (AC[1-9]\d*): (.+)$/gm)) {
				if (result.has(match[1])) {
					fail(`duplicate ${match[1]} in ${heading}`)
				}

				result.set(match[1], match[2])
			}

			return result
		}

		const criteria = entries('Acceptance criteria')
		const mappings = entries('Documentation')
		if (!criteria.size) {
			fail('no acceptance criteria')
		}

		for (const key of criteria.keys()) {
			const mapping = mappings.get(key) ?? ''
			if (!/\[[^\]]+\]\([^)]+\)/.test(mapping) && !/Gap: \S/.test(mapping)) {
				fail(`${key} needs a documentation link or explicit Gap`)
			}
		}

		for (const key of mappings.keys()) {
			if (!criteria.has(key)) {
				fail(`documentation references unknown ${key}`)
			}
		}

		for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
			const href = match[1]
			if (/^https?:\/\//.test(href)) {
				continue
			}

			const [filePart, anchor] = href.split('#')
			const target = resolve(dirname(path), filePart || file)
			if (relative(root, target).startsWith('..')) {
				fail(`link escapes repository: ${href}`)
				continue
			}

			try {
				if (!statSync(target).isFile()) {
					throw new Error('not a file')
				}

				if (anchor && target.endsWith('.md')) {
					const text = readFileSync(target, 'utf8').replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, '')
					const counts = new Map()
					const anchors = [...text.matchAll(/^#{1,6} (.+)$/gm)].map((heading) => {
						const slug = heading[1]
							.toLowerCase()
							.replace(/[^\p{L}\p{N}_\s-]/gu, '')
							.replace(/ /g, '-')

						const count = counts.get(slug) ?? 0
						counts.set(slug, count + 1)
						return count ? `${slug}-${count}` : slug
					})

					if (!anchors.includes(decodeURIComponent(anchor))) {
						fail(`missing heading: ${href}`)
					}
				}
			} catch {
				fail(`unreadable local link: ${href}`)
			}
		}
	}

	return errors
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const errors = checkRecipes(fileURLToPath(new URL('../', import.meta.url)))
	if (errors.length) {
		console.error(errors.join('\n'))
		process.exitCode = 1
	} else {
		console.log(
			'Recipe structure and local links pass; coverage and runtime evidence require review.',
		)
	}
}
