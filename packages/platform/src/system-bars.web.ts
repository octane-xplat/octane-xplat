// Status/nav bars — web leaf. No status bar on web, but theme-color is the
// honest equivalent: it tints mobile browser chrome.
export const systemBars = {
	setStatusBarStyle(_style: 'light' | 'dark'): void {},
	setColor(color: string): void {
		let meta = document.querySelector('meta[name="theme-color"]');
		if (!meta) {
			meta = document.createElement('meta');
			meta.setAttribute('name', 'theme-color');
			document.head.appendChild(meta);
		}
		meta.setAttribute('content', color);
	},
};
