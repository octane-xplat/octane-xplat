import { command } from '@alloc/cmd-ts';
import { execFileSync } from 'node:child_process';
import * as p from '@clack/prompts';

const check = (cmd, args) => {
	try {
		return { ok: true, out: execFileSync(cmd, args, { encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] }).trim().split('\n')[0] };
	} catch {
		return { ok: false, out: '' };
	}
};

/** env checks — the things that have actually bitten this stack. */
export const doctor = command({
	name: 'doctor',
	description: 'Check the toolchain for web + native builds',
	args: {},
	handler: async () => {
		p.intro('xplat doctor');
		const rows = [];
		const row = (name, ok, detail, hint) => rows.push({ name, ok, detail, hint });

		row('node', check('node', ['--version']).ok, check('node', ['--version']).out);
		row('pnpm', check('pnpm', ['--version']).ok, check('pnpm', ['--version']).out);
		row('ns CLI', check('pnpm', ['exec', 'ns', '--version']).ok, check('pnpm', ['exec', 'ns', '--version']).out,
			'add the nativescript devDep (the starter ships it)');
		row('xcodebuild', check('xcodebuild', ['-version']).ok, check('xcodebuild', ['-version']).out,
			'iOS needs Xcode — App Store install + xcode-select');
		row('xcodeproj gem', check('ruby', ['-e', 'require "xcodeproj"']).ok, '',
			'gem install --user-install xcodeproj');
		const sims = check('xcrun', ['simctl', 'list', 'devices', 'booted']);
		row('iOS simulator', sims.ok, sims.out || 'none booted');
		const adb = check('adb', ['devices']);
		const devices = adb.ok ? adb.out.split('\n').slice(1).filter((l) => l.includes('\tdevice')).length : 0;
		row('adb', adb.ok, `${devices} device(s)`, 'Android SDK platform-tools on PATH');
		row('ANDROID_HOME', !!process.env.ANDROID_HOME, process.env.ANDROID_HOME || 'unset',
			'export ANDROID_HOME=$HOME/Library/Android/sdk');
		row('JAVA_HOME', !!process.env.JAVA_HOME, process.env.JAVA_HOME || 'unset',
			'JDK 17 (JDK 25 breaks the Android toolchain)');

		let bad = 0;
		for (const r of rows) {
			if (r.ok) p.log.success(`${r.name} — ${r.detail || 'ok'}`);
			else { bad++; p.log.warn(`${r.name} — missing${r.hint ? ` (${r.hint})` : ''}`); }
		}
		p.outro(bad === 0 ? 'All checks pass' : `${bad} missing — web still works, native targets need the above`);
	},
});
