// Web seam for the nav contract — harness-level stand-in: hash change +
// history back. A real router lands with the shared route table (#8).
export function openDetail() {
	location.hash = '#/detail';
	console.log('[probe] nav web → #/detail');
}

export function goBack() {
	history.back();
}
