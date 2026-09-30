"""Build and exercise the isolated release navigation app without screenshots."""
import fcntl
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time

if len(sys.argv) != 3 or sys.argv[1] not in ('ios', 'android'):
    raise SystemExit('Usage: python3 scripts/check-navigation.py ios|android DEVICE_ID')
target, device = sys.argv[1:]
app = Path(__file__).resolve().parents[1]
report_dir = app / 'navigation-results' / target
report_dir.mkdir(parents=True, exist_ok=True)
project = app / 'navigation-project'
# Reuse the installed, patched dependency graph without pulling optional
# service plugins into this project's NativeScript preparation.
modules = project / 'node_modules'
if modules.is_symlink():
    raise SystemExit('BLOCKED: navigation-project/node_modules must be a directory, not a shared symlink')
modules.mkdir(exist_ok=True)
manifest = json.loads((project / 'package.json').read_text())
for name in {**manifest['dependencies'], **manifest['devDependencies']}:
    destination = modules / name
    source = app / 'node_modules' / name
    if not source.exists() and name.startswith('@octane-xplat/'):
        source = app.parents[1] / 'packages' / name.split('/')[1]
    if not source.exists():
        raise SystemExit('BLOCKED: install workspace dependency ' + name + ' first')
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists():
        destination.symlink_to(source.resolve(), target_is_directory=True)
if not (modules / '.bin').exists():
    (modules / '.bin').symlink_to(app / 'node_modules/.bin', target_is_directory=True)
bundle = 'org.nativescript.xplat.navigation'
env = dict(os.environ, XPLAT_NAVIGATION_CHECK='1')

def run(args, **kwargs):
    return subprocess.run(args, check=True, env=env, cwd=app, **kwargs)

def output(args):
    return run(args, capture_output=True, text=True).stdout.strip()

with open('/tmp/octane-xplat-' + target + '.lock', 'a') as lock:
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise SystemExit('BLOCKED: target advisory lock is held; no build or device operation performed')
    # Fail before installing over an active copy of this isolated app.
    if target == 'android':
        env['JAVA_HOME'] = output(['/usr/libexec/java_home', '-v', '21'])
        active = subprocess.run(['adb', '-s', device, 'shell', 'pidof', bundle], capture_output=True, text=True)
        if device != 'build-only' and active.stdout.strip():
            raise SystemExit('BLOCKED: isolated navigation app is already running; finish its owning run first')
    elif device != 'build-only':
        devices = json.loads(output(['xcrun', 'simctl', 'list', 'devices', 'available', '--json']))
        selected = next((d for group in devices['devices'].values() for d in group if d['udid'] == device), None)
        if selected is None:
            raise SystemExit('BLOCKED: selected iOS simulator is unavailable')
        if selected['state'] == 'Shutdown':
            run(['xcrun', 'simctl', 'boot', device])
            run(['xcrun', 'simctl', 'bootstatus', device, '-b'])
        states = output(['xcrun', 'simctl', 'spawn', device, 'launchctl', 'list'])
        if bundle in states:
            raise SystemExit('BLOCKED: isolated navigation app is already running; finish its owning run first')

    with tempfile.TemporaryDirectory(prefix='xplat-nav-signing-') as signing:
        build = ['pnpm', 'exec', 'ns', 'build', target, '--release', '--path', str(project)]
        if target == 'ios':
            build += ['--for-device', 'false']
        else:
            # An ephemeral test key signs the release APK; it is never shipped.
            key = str(Path(signing) / 'navigation.keystore')
            import secrets
            password = secrets.token_hex(16)
            run([str(Path(env['JAVA_HOME']) / 'bin/keytool'), '-genkeypair', '-keystore', key,
                 '-storepass', password, '-keypass', password, '-alias', 'navigation',
                 '-dname', 'CN=Navigation verification', '-keyalg', 'RSA', '-validity', '2'],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            build += ['--key-store-path', key, '--key-store-password', password,
                      '--key-store-alias', 'navigation', '--key-store-alias-password', password]
        with open(report_dir / 'build.log', 'w') as log:
            # Do not print command arguments: they contain the ephemeral key password.
            process = subprocess.Popen(build, cwd=app, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            for line in process.stdout:
                log.write(line.replace(password, '[redacted]') if target == 'android' else line)
                log.flush()
            code = process.wait()
        if code:
            raise SystemExit('BLOCKED: release build failed; see ' + str(report_dir / 'build.log'))

    if device == 'build-only':
        print('Release build completed; runtime NOT RUN (build-only).')
        raise SystemExit(0)

    logcat = None
    launched = False
    try:
        if target == 'ios':
            packages = list((project / 'platforms/ios/build/Release-iphonesimulator').glob('*.app'))
            if len(packages) != 1:
                raise RuntimeError('Expected one simulator release .app')
            run(['xcrun', 'simctl', 'install', device, str(packages[0])])
            data = Path(output(['xcrun', 'simctl', 'get_app_container', device, bundle, 'data']))
            report = data / 'Documents/navigation-check.json'
            # Remove only this run's generated report; never reset the app container.
            if report.exists():
                report.unlink()
            run(['xcrun', 'simctl', 'openurl', device, 'xplatnav://nav/cold'])
            launched = True
        else:
            packages = list((project / 'platforms/android/app/build/outputs/apk/release').glob('*.apk'))
            if len(packages) != 1:
                raise RuntimeError('Expected one signed release APK')
            run(['adb', '-s', device, 'install', '-r', str(packages[0])])
            log = open(report_dir / 'runtime.log', 'w')
            logcat = subprocess.Popen(['adb', '-s', device, 'logcat', '-T', '1'], stdout=log, stderr=subprocess.STDOUT)
            run(['adb', '-s', device, 'shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW',
                 '-d', 'xplatnav://nav/cold', '-n', bundle + '/com.tns.NativeScriptActivity'], stdout=subprocess.DEVNULL)
            launched = True

        # The app waits for two identical warm deliveries after the internal
        # sequence. iOS release console logs are unavailable, so the app also
        # persists progress to its own generated JSON file.
        started = time.monotonic()
        sent = 0
        payload = None
        while time.monotonic() - started < 120:
            if target == 'ios':
                if report.exists():
                    try:
                        payload = json.loads(report.read_text())
                    except json.JSONDecodeError:
                        pass  # The app may be replacing its progress report.
                ready = payload and payload.get('awaitingWarmLinks')
            else:
                runtime = (report_dir / 'runtime.log').read_text()
                ready = '[navigation] awaiting warm OS links' in runtime
                marker = '[navigation] result '
                for line in runtime.splitlines():
                    if marker in line:
                        try:
                            payload = json.loads(line.split(marker, 1)[1])
                        except json.JSONDecodeError:
                            pass  # Ignore a log line while the writer is appending it.
            if ready and sent < 2:
                if target == 'ios':
                    run(['xcrun', 'simctl', 'openurl', device, 'xplatnav://nav/warm'])
                else:
                    run(['adb', '-s', device, 'shell', 'am', 'start', '-W', '-a', 'android.intent.action.VIEW',
                         '-d', 'xplatnav://nav/warm', '-n', bundle + '/com.tns.NativeScriptActivity'], stdout=subprocess.DEVNULL)
                sent += 1
                time.sleep(1)
            if payload and not payload.get('awaitingWarmLinks'):
                (report_dir / 'result.json').write_text(json.dumps(payload, indent=2) + '\n')
                print(json.dumps(payload, indent=2))
                if not payload['pass']:
                    raise RuntimeError('Navigation assertions failed')
                break
            time.sleep(0.2)
        else:
            raise RuntimeError('No completed navigation report within 120 seconds')
    finally:
        if logcat:
            logcat.terminate()  # Only our log reader; never clear global logcat.
            logcat.wait()
            log.close()
        if launched:
            # This script launched the isolated app under the lock.
            # Other harness apps and sessions are untouched.
            if target == 'ios':
                subprocess.run(['xcrun', 'simctl', 'terminate', device, bundle], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                subprocess.run(['adb', '-s', device, 'shell', 'am', 'force-stop', bundle])
