#!/usr/bin/env python3
"""octane-xplat#188 native acceptance — real iOS dev reload cancellation.

Boots apps/mobile on the prescribed simulator under `xplat dev` (Go engine,
HMR on), then forces back-to-back whole-graph reloads so the second eviction
cancels the first reload's in-flight `void import()` waiters — the exact
unhandled-rejection path the issue reported as fatal. A separate edit makes a
module throw on evaluation to prove genuine errors still report. Nonvisual:
all evidence comes from the dev session's own device-console stream.
"""
import argparse
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import time
import urllib.request

UDID = '91D40099-A056-497D-A572-ADDDFD6A8F23'
APP = 'org.nativescript.xplat'
EVENT = re.compile(r'^\[ios\] (\{.*\})\s*$')


def messages_of(line):
    """Yield eventMessage strings from an [ios]-prefixed JSON log line."""
    match = EVENT.match(line)
    if not match:
        return
    try:
        entry = json.loads(match.group(1))
    except ValueError:
        return
    msg = entry.get('eventMessage')
    if isinstance(msg, str):
        yield msg


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--consumer', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--startup-timeout', type=int, default=900)
    parser.add_argument('--prewarm-timeout', type=int, default=None)
    args = parser.parse_args()
    if args.prewarm_timeout is None:
        args.prewarm_timeout = args.startup_timeout
    if os.environ.get('XPLAT_DOCS_DEMOS'):
        raise RuntimeError('XPLAT_DOCS_DEMOS overrides the probe application identity; unset it')
    root = args.consumer.resolve()
    if not (root / '.git').is_file():
        raise RuntimeError('consumer must be an isolated Git worktree')
    app = root / 'apps/mobile'
    binary = root / 'research/go-cli/xplat-go-darwin-arm64-cli'
    if not binary.is_file():
        raise RuntimeError('missing Go CLI binary: ' + str(binary))
    source = app / 'src/index.ts'
    lottie = app / 'src/lottie-probe.ts'
    edited = (source, lottie)
    if subprocess.check_output(['git', 'diff', 'HEAD', '--', *[str(p) for p in edited]], cwd=root):
        raise RuntimeError('probe source inputs must have no pre-existing edits')
    args.report.mkdir(parents=True, exist_ok=True)
    original = {p: p.read_bytes() for p in edited}
    expected = dict(original)
    booted = installation_owned = survived_cli_cleanup = False
    child = None
    markers = {m: 0 for m in ('R188_INITIAL', 'R188_EDIT_A', 'R188_EDIT_B')}
    unhandled = []
    ns_hot = []
    launches = 0
    compiles = 0
    genuine = []
    hmr_watchdog = []
    boot_failures = []
    last_failed_url = None
    prewarmed = False
    rejection_window = 0
    started = time.monotonic()

    def proof(phase, extra=None):
        state = dict(
            phase=phase,
            elapsedSeconds=round(time.monotonic() - started, 3),
            launches=launches,
            compiles=compiles,
            markers=dict(markers),
            unhandledRejectionEvents=len(unhandled),
            genuineErrorEvents=len(genuine),
            **(extra or {}),
        )
        (args.report / 'progress.json').write_text(json.dumps(state, indent=2))
        return state

    def simctl(*argv):
        return subprocess.check_output(['xcrun', 'simctl', *argv], timeout=45)

    def applications():
        data = subprocess.check_output(['/usr/bin/plutil', '-convert', 'json', '-o', '-', '--', '-'],
                                       input=simctl('listapps', UDID), timeout=15)
        return json.loads(data)

    def app_pid():
        pids = {int(parts[0]) for line in simctl('spawn', UDID, 'launchctl', 'list').decode().splitlines()
                if len(parts := line.split()) >= 3 and APP in parts[2] and parts[0].isdigit()}
        if len(pids) > 1:
            raise RuntimeError('ambiguous probe process')
        return next(iter(pids), None)

    def edit(path, data):
        if path.read_bytes() != expected[path]:
            raise RuntimeError('probe input changed concurrently: ' + str(path))
        path.write_bytes(data)
        expected[path] = data

    def interrupt(_signal, _frame):
        raise KeyboardInterrupt('driver interrupted')

    signal.signal(signal.SIGTERM, interrupt)
    with (args.report / 'cli.log').open('wb') as log, (args.report / 'cli.log').open('r', errors='replace') as reader:
        def observe():
            nonlocal launches, compiles, last_failed_url, prewarmed, rejection_window
            count = 0
            for line in reader.read().split('\n'):
                count += 1
                # CLI prefixes session lines with '[ios] '; match on the suffix.
                if line.endswith('run: native stage-started'):
                    compiles += 1
                if 'boot-crawl] pre-warmed' in line:
                    prewarmed = True
                if line.endswith('Successfully synced application ' + APP + ' on device ' + UDID + '.'):
                    launches += 1
                if '/ns-hmr' in line and 'websocket client connected' in line:
                    hmr_watchdog.append(line[:400])
                fail_match = re.search(r'HTTP import failed: (\S+) \(network error\)', line)
                if fail_match and fail_match.group(1) != last_failed_url:
                    last_failed_url = fail_match.group(1)
                    boot_failures.append(line[:400])
                for msg in messages_of(line) or ():
                    if msg.startswith('CONSOLE LOG: R188_'):
                        for marker in markers:
                            if msg == 'CONSOLE LOG: ' + marker:
                                markers[marker] += 1
                    if 'Unhandled promise rejection' in msg or 'unhandled rejection' in msg.lower():
                        unhandled.append(msg[:400])
                    if 'R188_GENUINE' in msg:
                        genuine.append(msg[:400])
                    if '[ns-hot]' in msg:
                        ns_hot.append(msg[:300])
                if not EVENT.match(line):
                    # The Go engine forwards device console output as plain
                    # '[ios]   <text>' lines rather than eventMessage JSON;
                    # without this fallback every console marker is missed.
                    plain = re.match(r'^\[ios\]\s+(R188_(?:INITIAL|EDIT_A|EDIT_B))\s*$', line)
                    if plain:
                        markers[plain.group(1)] += 1
                    if 'R188_GENUINE' in line:
                        genuine.append(line[:400])
                    # A rejection's reason arrives on following lines; keep a
                    # short capture window so 'Module invalidated ...' counts
                    # only when it is the reported reason — never when the
                    # handled [ns-hot] path merely logs the cancellation.
                    if ('Unhandled promise rejection' in line
                            or 'unhandled rejection' in line.lower()):
                        unhandled.append(line[:400])
                        rejection_window = 6
                    elif rejection_window > 0:
                        unhandled.append(line[:400])
                        rejection_window -= 1
                    if '[ns-hot]' in line:
                        ns_hot.append(line[:300])
            return count

        def until(check, label, timeout):
            deadline = time.monotonic() + timeout
            while time.monotonic() < deadline:
                observe()
                if child.poll() is not None:
                    raise RuntimeError('CLI exited during ' + label + ': ' + str(child.returncode))
                if check():
                    return
                time.sleep(.25)
            raise RuntimeError('timeout during ' + label)

        try:
            state = json.loads(simctl('list', 'devices', 'available', '--json'))
            device = next((d for group in state['devices'].values() for d in group if d['udid'] == UDID), None)
            if device is None or device['state'] != 'Shutdown':
                raise RuntimeError('prescribed simulator must be available and shut down')
            simctl('boot', UDID)
            booted = True
            simctl('bootstatus', UDID, '-b')
            if APP in applications():
                raise RuntimeError('refusing existing probe installation')
            installation_owned = True
            edit(source, original[source] + ("\nconsole.log('R188_INITIAL');setInterval(()=>console.log('R188_INITIAL'),1000);\n").encode())
            env = dict(os.environ, XPLAT_NATIVE_ENGINE='go', NS_VITE_VERBOSE='1')
            argv = [str(binary), 'dev', 'ios', '--device', UDID,
                    '--project', str(root), '--app', 'apps/mobile']
            child = subprocess.Popen(argv, cwd=app, env=env, stdout=log, stderr=subprocess.STDOUT)
            until(lambda: launches == 1, 'initial launch', args.startup_timeout)
            if app_pid() is None:
                raise RuntimeError('initial app process missing')
            # The boot crawl needs tens of minutes to pre-warm the /ns/m
            # closure; a boot launched mid-crawl dies on whichever cold
            # transform outruns it, and a retry can stall silently with no
            # new failure line to react to. Hold the app dead until the
            # crawl reports completion (bounded — proceed anyway if the
            # crawl is disabled or never reports), then boot warm.
            try:
                simctl('terminate', UDID, APP)
            except Exception:
                pass
            gate_started = time.monotonic()
            prewarm_deadline = gate_started + args.prewarm_timeout
            while not prewarmed and time.monotonic() < prewarm_deadline:
                observe()
                if child.poll() is not None:
                    raise RuntimeError('CLI exited during boot-crawl prewarm: ' + str(child.returncode))
                time.sleep(.5)
            crawl_wait_seconds = round(time.monotonic() - gate_started, 1)
            time.sleep(1)
            simctl('launch', UDID, APP)
            # The iOS fetch deadline kills whichever cold transform is slowest
            # ("HTTP import failed ... (network error)"), and an aborted fetch
            # never caches the transform — so the same file kills every retry.
            # Warming the exact failed URL with an unbounded client forces its
            # transform into the server cache, then a relaunch gets past it:
            # each retry can only die on a NEW cold file, so this converges.
            relaunches = 0
            stalls = 0
            handled_failures = 0
            warmed = []

            def force_relaunch():
                try:
                    simctl('terminate', UDID, APP)
                except Exception:
                    pass
                time.sleep(1)
                simctl('launch', UDID, APP)

            def warm_failed_url():
                match = re.search(r'HTTP import failed: (\S+) \(network error\)', boot_failures[-1])
                if not match:
                    return
                url = match.group(1)
                try:
                    with urllib.request.urlopen(url, timeout=120) as response:
                        response.read()
                    warmed.append(url)
                except Exception as error:
                    warmed.append(url + ' (warm failed: ' + str(error)[:80] + ')')
            deadline = time.monotonic() + args.startup_timeout
            quiet_since = time.monotonic()
            while markers['R188_INITIAL'] < 3 and time.monotonic() < deadline:
                if observe():
                    quiet_since = time.monotonic()
                if child.poll() is not None:
                    raise RuntimeError('CLI exited during initial heartbeat: ' + str(child.returncode))
                if len(boot_failures) > handled_failures:
                    handled_failures = len(boot_failures)
                    if relaunches >= 12:
                        raise RuntimeError('bootstrap still failing after relaunches: ' + boot_failures[-1][:300])
                    relaunches += 1
                    warm_failed_url()
                    force_relaunch()
                elif time.monotonic() - quiet_since > 180:
                    # A dead-boot runtime does not retry and emits no new
                    # failure line; force a relaunch into whatever is warm.
                    quiet_since = time.monotonic()
                    stalls += 1
                    if stalls > 8:
                        raise RuntimeError('bootstrap stalled: app alive but no session output')
                    force_relaunch()
            if markers['R188_INITIAL'] < 3:
                raise RuntimeError('timeout during initial heartbeat')
            initial_pid = app_pid()
            if initial_pid is None:
                raise RuntimeError('booted app process missing')
            proof('initial', dict(pid=initial_pid, relaunches=relaunches, stalls=stalls,
                                  warmed=warmed, prewarmed=prewarmed,
                                  crawlWaitSeconds=crawl_wait_seconds))

            # Phase 1: two rapid whole-graph reloads. The second eviction must
            # land while the first reload's entry re-evaluation still has its
            # `void import()` waiters in flight — the #188 cancellation seam.
            edit(source, original[source] + ("\nconsole.log('R188_EDIT_A');setInterval(()=>console.log('R188_EDIT_A'),1000);\n").encode())
            time.sleep(5)
            edit(source, original[source] + ("\nconsole.log('R188_EDIT_B');setInterval(()=>console.log('R188_EDIT_B'),1000);\n").encode())
            # A graph reload re-evaluates the entry; EDIT_B heartbeat proves
            # the replacement graph actually ran (no dead process, no silent
            # swallow of the reload itself).
            deadline = time.monotonic() + args.startup_timeout
            quiet_since = time.monotonic()
            while markers['R188_EDIT_B'] < 3 and time.monotonic() < deadline:
                if observe():
                    quiet_since = time.monotonic()
                if child.poll() is not None:
                    raise RuntimeError('CLI exited during post-reload heartbeat: ' + str(child.returncode))
                if len(boot_failures) > handled_failures:
                    handled_failures = len(boot_failures)
                    if relaunches >= 12:
                        raise RuntimeError('post-reload bootstrap still failing: ' + boot_failures[-1][:300])
                    relaunches += 1
                    warm_failed_url()
                    force_relaunch()
                elif time.monotonic() - quiet_since > 180:
                    quiet_since = time.monotonic()
                    stalls += 1
                    if stalls > 8:
                        raise RuntimeError('post-reload stalled: app alive but no session output')
                    force_relaunch()
            if markers['R188_EDIT_B'] < 3:
                raise RuntimeError('timeout during post-reload heartbeat')
            if app_pid() != initial_pid:
                raise RuntimeError('app changed process during reload')
            proof('reload')

            # Phase 2: genuine-error control — a module that throws on eval
            # must still surface; the filter owns only the cancellation prefix.
            edit(lottie, original[lottie] + b"\nthrow new Error('R188_GENUINE');\n")
            until(lambda: len(genuine) >= 1, 'genuine error report', 120)
            proof('genuine-error')
        finally:
            try:
                if child is not None:
                    if child.poll() is None:
                        child.send_signal(signal.SIGTERM)
                    try:
                        child.wait(timeout=90)
                    except subprocess.TimeoutExpired:
                        child.kill()
                        child.wait(timeout=30)
                        raise RuntimeError('CLI cleanup deadline exceeded')
                    # The CLI does not always terminate the app it launched;
                    # record that as evidence instead of masking the verdict —
                    # the nested finally still uninstalls and shuts down.
                    if booted:
                        try:
                            survived_cli_cleanup = app_pid() is not None
                        except Exception:
                            survived_cli_cleanup = True
            finally:
                try:
                    restore_errors = []
                    for path, data in original.items():
                        try:
                            if path.read_bytes() != expected[path]:
                                raise RuntimeError('probe input changed concurrently: ' + str(path))
                            path.write_bytes(data)
                            expected[path] = data
                        except Exception as error:
                            restore_errors.append(error)
                    if installation_owned and APP in applications():
                        simctl('uninstall', UDID, APP)
                    if restore_errors:
                        raise ExceptionGroup('probe source restoration failed', restore_errors)
                finally:
                    if booted:
                        simctl('shutdown', UDID)
        # Drain whatever the session emitted during cleanup while the reader
        # is still open; calling observe() after this block dies on a closed file.
        observe()
    cancellation_unhandled = [m for m in unhandled if 'Module invalidated during dev reload' in m]
    genuine_suppressed = len(genuine) == 0
    result = dict(
        device=UDID,
        markers=markers,
        appRelaunches=relaunches if 'relaunches' in dir() else 0,
        warmedUrls=warmed if 'warmed' in dir() else [],
        unhandledRejectionEvents=unhandled,
        cancellationSurfacedAsUnhandled=len(cancellation_unhandled),
        nsHot=ns_hot[:20],
        nsHmrWatchdogWarnings=hmr_watchdog,
        # EDIT_B heartbeat can only arrive if the /ns-hmr edit channel and
        # the app-console bridge both reached the device.
        nsHmrChannelProven=markers['R188_EDIT_B'] >= 3 and len(hmr_watchdog) == 0,
        genuineReported=len(genuine) >= 1,
        appSurvivedCliCleanup=survived_cli_cleanup,
        cancelledDuringReload='see markers/unhandledRejectionEvents',
    )
    (args.report / 'result.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result, indent=2))
    if cancellation_unhandled:
        sys.exit('FAIL: dev-reload cancellation surfaced as unhandled rejection')
    if genuine_suppressed:
        sys.exit('FAIL: genuine evaluation error was not reported')


if __name__ == '__main__':
    main()
