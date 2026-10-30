/**
 * Catalog model shared by Node-side discovery, the catalog virtual module,
 * and the shell. Metadata is literal and statically readable — discovery
 * never evaluates story modules.
 */
import type { WorkshopTarget } from './contract'

export interface StoryMeta {
	id: string
	title: string
	/** Effective targets after declared targets ∩ file-suffix applicability. */
	targets: readonly WorkshopTarget[]
	capabilities: readonly string[]
	/** Absolute file path of the story module. */
	file: string
	/** Export binding the definition is attached to. */
	exportName: string
	/** Whether this story can mount on the current build target. */
	applicable: boolean
	/** Why the story cannot mount here (unsupported-by-story / leaf mismatch). */
	reason?: string
}

export interface CatalogEntry extends StoryMeta {
	/** Present only when applicable: loads the story definition. */
	load?: (stamp?: string | number) => Promise<unknown>
}

/** Platform suffix on a story file narrows applicability to those targets. */
export const SUFFIX_TARGETS: Record<string, readonly WorkshopTarget[]> = {
	web: ['web'],
	mobile: ['ios', 'android'],
	ios: ['ios'],
	android: ['android'],
	macos: ['macos'],
	windows: ['windows'],
	linux: ['linux'],
}

export const PLATFORM_SUFFIX_RE: RegExp =
	/\.stories\.(web|mobile|ios|android|macos|windows|linux)\.[cm]?[jt]srx?$/

export function storyFileTag(file: string): string | null {
	return PLATFORM_SUFFIX_RE.exec(file)?.[1] ?? null
}

export function applicableTargets(
	declared: readonly WorkshopTarget[],
	file: string,
): readonly WorkshopTarget[] {
	const tag = storyFileTag(file)
	if (!tag) {
		return declared
	}

	const implied = SUFFIX_TARGETS[tag] ?? []
	return declared.filter((t) => implied.includes(t))
}
