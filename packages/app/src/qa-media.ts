import { createHaptics } from '@octane-xplat/haptics';
import { createSoundBank } from '@octane-xplat/sounds';
import { createAudioPlayer } from '@octane-xplat/audio';
import { biometrics, notifications } from '@octane-xplat/platform';
import { share } from '@octane-xplat/share';

/** QA checklist triggers — the "do" half of each human check, so the
 *  reviewer fires the stimulus from the checklist itself instead of
 *  hunting through MediaServices/Services. Instances are lazy module-level
 *  singletons: the page is revisited constantly and never needs teardown
 *  beyond app shutdown (MediaServices keeps its own per-mount copies). */

const SAMPLE = 'https://www.w3schools.com/html/horse.mp3';

let _haptics: ReturnType<typeof createHaptics> | null = null;
let _sounds: ReturnType<typeof createSoundBank> | null = null;
let _player: ReturnType<typeof createAudioPlayer> | null = null;
let _hold: ReturnType<ReturnType<typeof createHaptics>['startRealtime']> | null = null;
let _soundLoaded = false;

const haptics = () => (_haptics ??= createHaptics());
const sounds = () => (_sounds ??= createSoundBank({ maxVoices: 4 }));
const player = () => (_player ??= createAudioPlayer());

async function ensureSound(): Promise<void> {
	if (_soundLoaded) {
		return;
	}

	await sounds().load('tap', SAMPLE);
	_soundLoaded = true;
}

/** Fires a checklist stimulus; resolves to a short status string the page
 *  echoes. Never throws — a broken trigger is itself a finding. */
export async function runQaTrigger(key: string): Promise<string> {
	try {
		switch (key) {
			case 'sound-tap':
				await ensureSound();
				await sounds().play('tap', { volume: 0.5 });
				return 'played';
			case 'sound-overlap':
				await ensureSound();
				void sounds().play('tap');
				setTimeout(() => void sounds().play('tap'), 35);
				return 'played ×2';
			case 'audio-play':
				await player().setQueue([{ id: 'sample', source: SAMPLE, title: 'Sample audio', artist: 'Octane xplat' }]);
				await player().play();
				return 'playing';
			case 'audio-pause':
				await player().pause();
				return 'paused';
			case 'audio-seek':
				await player().seek(10);
				return 'seeked to 10s';
			case 'haptic-preset':
				await haptics().play('success');
				return 'fired';
			case 'haptic-pattern':
				await haptics().playPattern({ duration: 240, points: [{ at: 0, intensity: 0.8 }, { at: 100, intensity: 0.3, sharpness: 0.8 }] });
				return 'fired';
			case 'haptic-hold':
				_hold ??= haptics().startRealtime();
				_hold.update(0.8, 0.5);
				return 'holding';
			case 'notify': {
				if ((await notifications.ensure()) !== 'granted' || !notifications.impl) {
					return 'unsupported';
				}

				notifications.impl.notify('Human QA', 'notification check');
				return 'sent — background the app now';
			}
			case 'share':
				return 'result: ' + (await share.text('octane-xplat human QA'));
			case 'biometric': {
				if ((await biometrics.ensure()) !== 'granted' || !biometrics.impl) {
					return 'unsupported';
				}

				return (await biometrics.impl.verify('Confirm it is you')) ? 'verified' : 'failed';
			}
			default:
				return 'unknown trigger: ' + key;
		}
	} catch (e) {
		return 'error: ' + (e instanceof Error ? e.message : String(e));
	}
}

/** Releases a `hold` trigger (onPressOut). */
export function releaseQaTrigger(key: string): void {
	if (key === 'haptic-hold' && _hold) {
		_hold.stop();
		_hold = null;
	}
}
