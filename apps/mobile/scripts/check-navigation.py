"""Build and exercise the isolated release navigation app without screenshots."""
import fcntl
import json
import os
import shutil
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

def output(args, **kwargs):
    return run(args, capture_output=True, text=True, **kwargs).stdout.strip()

def open_ios_url(url):
    run(['xcrun', 'simctl', 'openurl', device, url])
    # New simulator versions ask before handing a custom URL to an app. Read
    # accessibility metadata only, and accept only this fixture's exact dialog.
    if not shutil.which('idb'):
        return
    time.sleep(0.5)
    description = subprocess.run(
        ['idb', 'ui', 'describe-all', '--udid', device, '--json',
         '--reason', 'Check URL confirmation for the owned routing fixture'],
        capture_output=True, text=True, env=env, cwd=app, timeout=20)
    if description.returncode:
        raise RuntimeError('Cannot read the owned iOS URL confirmation: ' + description.stderr.strip())
    nodes = json.loads(description.stdout)
    titles = {'Open in “navigationproject”?', 'Open in "navigationproject"?'}
    if not any(node.get('AXLabel') in titles for node in nodes):
        return
    buttons = [node for node in nodes if node.get('AXLabel') == 'Open'
               and node.get('role') == 'AXButton' and node.get('enabled') is not False]
    if len(buttons) != 1:
        raise RuntimeError('Fixture URL confirmation has no unique Open button')
    bounds = buttons[0]['frame']
    x = str(round(bounds['x'] + bounds['width'] / 2))
    y = str(round(bounds['y'] + bounds['height'] / 2))
    run(['idb', 'ui', 'tap', x, y, '--udid', device, '--reason',
         'Accept the owned routing fixture URL confirmation from its accessibility bounds'], timeout=20)

with open('/tmp/octane-xplat-' + target + '.lock', 'a') as lock:
    try:
        wait_for_lock = os.environ.get('XPLAT_NAVIGATION_WAIT_FOR_LOCK') == '1'
        if wait_for_lock:
            print('Waiting for the shared native navigation lock', flush=True)
        fcntl.flock(lock, fcntl.LOCK_EX | (0 if wait_for_lock else fcntl.LOCK_NB))
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

    # Check the same package declarations an installed app consumes. Source
    # package checks run separately; a cold checkout must generate declarations.
    with open(report_dir / 'types.log', 'w') as type_log:
        run(['pnpm', 'exec', 'turbo', 'run', 'typegen', '--filter=@octane-xplat/ui',
             '--concurrency=2'], stdout=type_log, stderr=subprocess.STDOUT)
    with open(report_dir / 'generation.log', 'w') as generation_log:
        run(['pnpm', '--filter', '@octane-xplat/cli', 'build'], stdout=generation_log, stderr=subprocess.STDOUT)
        run(['node', 'scripts/generate-navigation-routes.mjs'], stdout=generation_log, stderr=subprocess.STDOUT)

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

    # Inspect the same release modules that will be installed, without dumping
    # their contents. The build-time loader must not cross into the app graph.
    if target == 'ios':
        products = list((project / 'platforms/ios/build/Release-iphonesimulator').glob('*.app'))
        if len(products) != 1:
            raise RuntimeError('Expected one simulator release .app for module inspection')
        app_modules = products[0] / 'app'
    else:
        app_modules = project / 'platforms/android/app/src/main/assets/app'
    module_files = list(app_modules.rglob('*.mjs'))
    if not module_files:
        raise RuntimeError('No release JavaScript modules available for inspection')
    for module_file in module_files:
        if 'XPLAT_BAKED_ROUTE_BUILD_ONLY' in module_file.read_text():
            raise RuntimeError('Build-only route loader leaked into ' + module_file.name)

    if device == 'build-only':
        print('Release build completed; runtime NOT RUN (build-only).')
        raise SystemExit(0)

    logcat = None
    launched = False
    installed = False
    try:
        if target == 'ios':
            packages = list((project / 'platforms/ios/build/Release-iphonesimulator').glob('*.app'))
            if len(packages) != 1:
                raise RuntimeError('Expected one simulator release .app')
            run(['xcrun', 'simctl', 'install', device, str(packages[0])])
            data = Path(output(['xcrun', 'simctl', 'get_app_container', device, bundle, 'data']))
            report = data / 'Documents/navigation-check.json'
            gesture_report = data / 'Documents/navigation-gesture-check.json'
            gesture_ack = data / 'Documents/navigation-gesture-ack.json'
            if gesture_ack.exists():
                gesture_ack.unlink()
            if gesture_report.exists():
                gesture_report.unlink()
            # Remove only this run's generated report; never reset the app container.
            if report.exists():
                report.unlink()
            launched = True
            open_ios_url('xplatnav://nav/cold')
        else:
            packages = list((project / 'platforms/android/app/build/outputs/apk/release').glob('*.apk'))
            if len(packages) != 1:
                raise RuntimeError('Expected one signed release APK')
            run(['adb', '-s', device, 'install', '-r', str(packages[0])])
            installed = True
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
        sent_back = set()
        sent_swipes = set()
        chunks = {}
        chunk_total = None
        while time.monotonic() - started < 120:
            if target == 'ios':
                if report.exists():
                    try:
                        payload = json.loads(report.read_text())
                    except json.JSONDecodeError:
                        pass  # The app may be replacing its progress report.
                if gesture_report.exists():
                    try:
                        gesture = json.loads(gesture_report.read_text())
                    except json.JSONDecodeError:
                        gesture = None
                    if gesture and gesture.get('phase') in ('edge-deny', 'content-allow', 'canonical-blocker-deny', 'canonical-blocker-admit', 'canonical-modal-down', 'canonical-root-probe', 'canonical-short', 'canonical-content', 'canonical-deny', 'canonical-admit', 'canonical-tab') and gesture['phase'] not in sent_swipes:
                        if not shutil.which('idb'):
                            raise RuntimeError('The iOS swipe diagnostic requires idb for real OS input')
                        width, height = round(gesture['width']), round(gesture['height'])
                        start = round(width * .25) if gesture['phase'] in ('content-allow', 'canonical-content') else 2
                        end = 42 if gesture['phase'] == 'canonical-short' else width - 20
                        duration = '1' if gesture['phase'] == 'canonical-short' else '0.5'
                        y_start = y_end = round(height * .5)
                        if gesture['phase'] == 'canonical-modal-down':
                            start = end = round(width * .5)
                            y_start, y_end = 24, round(height * .75)
                        print('iOS OS swipe:', gesture['phase'], flush=True)
                        run(['idb', 'ui', 'swipe', str(start), str(y_start), str(end), str(y_end),
                             '--duration', duration, '--udid', device, '--reason',
                             'Qualify native Back admission with OS swipes without capturing images'], stdout=subprocess.DEVNULL)
                        sent_swipes.add(gesture['phase'])
                        gesture_ack.write_text(json.dumps({'phase': gesture['phase']}))
                ready = payload and payload.get('awaitingWarmLinks')
            else:
                runtime = (report_dir / 'runtime.log').read_text()
                ready = '[navigation] awaiting warm OS links' in runtime
                # Each marker follows confirmed native presentation. Drive only
                # this reservation's emulator, once per requested Back press.
                for step in (1, 2, 3, 4, 5, 6, 7):
                    if step not in sent_back and f'[navigation] awaiting Android Back {step}' in runtime:
                        run(['adb', '-s', device, 'shell', 'input', 'keyevent', 'KEYCODE_BACK'], stdout=subprocess.DEVNULL)
                        sent_back.add(step)
                marker = '[navigation] result-chunk '
                for line in runtime.splitlines():
                    if marker in line:
                        try:
                            part = json.loads(line.split(marker, 1)[1])
                            index, total, data = part['index'], part['total'], part['data']
                            if not isinstance(index, int) or not isinstance(total, int) or not isinstance(data, str):
                                continue
                            if not 0 <= index < total <= 1000:
                                continue
                            if chunk_total != total:
                                chunks.clear()
                                chunk_total = total
                            chunks[index] = data
                            if len(chunks) == total:
                                payload = json.loads(''.join(chunks[i] for i in range(total)))
                        except (json.JSONDecodeError, KeyError):
                            pass  # Ignore a log line while the writer is appending it.
            if ready and sent < 2:
                if target == 'ios':
                    open_ios_url('xplatnav://nav/warm')
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

        if target == 'android' and installed:
            # The package contains only this runner's generated test data. A
            # per-run signing key cannot update a previous run's installation.
            run(['adb', '-s', device, 'uninstall', bundle], stdout=subprocess.DEVNULL)
