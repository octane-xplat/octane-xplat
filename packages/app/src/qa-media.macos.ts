// macOS twin — the media leaf packages (@octane-xplat/haptics, /sounds,
// /audio) carry only web/native export conditions and don't resolve on the
// AppKit host, and media triggers are unsupported there. Same surface, no
// action.
export async function runQaTrigger(_key: string): Promise<string> {
	return 'unsupported on this target';
}

export function releaseQaTrigger(_key: string): void {}
