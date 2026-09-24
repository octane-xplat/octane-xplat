// Locale — navigator.language on web ("en-US" → tag + parts).
export interface Locale {
	tag: string;
	language: string;
	region: string;
}

export const locale: Locale = (() => {
	const tag = navigator.language ?? '';
	const [language = '', region = ''] = tag.split('-');
	return { tag, language, region };
})();
