// A11y announce — web leaf. A polite aria-live region receives the text;
// screen readers speak the DOM mutation.
let region: HTMLElement | null = null;

export function announce(text: string): void {
	if (!region) {
		region = document.createElement('div');
		region.setAttribute('aria-live', 'polite');
		region.setAttribute('role', 'status');
		region.style.cssText =
			'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);';

		document.body.appendChild(region);
	}

	region.textContent = '';
	// Two writes in one frame collapse — force the SR to see a change.
	requestAnimationFrame(() => {
		if (region) region.textContent = text;
	});
}
