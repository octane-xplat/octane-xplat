// Doc corpus — the framework's own docs/*.md, imported raw at build time.
const files = import.meta.glob('../../../docs/*.md', { query: '?raw', import: 'default', eager: true });

export interface DocPage {
	slug: string;
	/** List keys on item.id — same value as slug. */
	id: string;
	title: string;
	md: string;
}

function titleOf(slug: string, md: string): string {
	const h = md.match(/^#\s+(.+)$/m);
	if (h) return h[1].replace(/[`*_]/g, '').trim();
	return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const DOCS: DocPage[] = Object.entries(files)
	.map(([path, md]) => {
		const slug = path.split('/').pop()!.replace(/\.md$/, '');
		return { slug, id: slug, title: titleOf(slug, md as string), md: md as string };
	})
	.sort((a, b) => (a.slug === 'README' ? -1 : b.slug === 'README' ? 1 : a.slug.localeCompare(b.slug)));
