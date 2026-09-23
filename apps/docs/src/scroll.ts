// The doc pane is one persistent ScrollView — reset it on every nav path.
// Passive effects don't reliably flush after non-octane events (raw <a>
// clicks, popstate), so this is imperative, not a useEffect dep.
export function resetDocScroll() {
	const el = document.getElementById('doc-content');
	if (el) el.scrollTop = 0;
}

window.addEventListener('popstate', resetDocScroll);
