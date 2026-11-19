"""Serialize cooperating native builds/device sessions across worktrees.

Shares one directory-lock protocol with scripts/with-target-lock.ts via
native_target_lock.py: every wrapper contends on one lock dir under a lock
root shared by all worktrees, so Python and Node callers mutually exclude
on a target. This wrapper fails fast instead of waiting like the Node
wrapper.

    python3 scripts/with-native-target-lock.py <ios|android> <command> [args...]

XPLAT_NATIVE_LOCK_DIR redirects the lock root (default
<tmpdir>/octane-xplat-target-locks), same contract as with-target-lock.ts.
"""
import os
import signal
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from native_target_lock import TargetBusy, target_lock

if len(sys.argv) < 3 or sys.argv[1] not in ("ios", "android"):
    raise SystemExit("Usage: python3 scripts/with-native-target-lock.py <ios|android> <command> [args...]")

try:
    lock = target_lock(sys.argv[1], timeout_seconds=0)
    lock.acquire()
except TargetBusy as error:
    raise SystemExit("Native target is busy; retry after the owner releases " + str(error))

print("Holding native target lock: " + lock.lock_dir, file=sys.stderr, flush=True)
try:
    child = subprocess.Popen(sys.argv[2:])

    def stop_child(signum, _frame):
        # Keep the lock while the child releases its app and adb mappings.
        # subprocess.call would kill the child immediately on KeyboardInterrupt.
        child.send_signal(signum)

    signal.signal(signal.SIGINT, stop_child)
    signal.signal(signal.SIGTERM, stop_child)
    raise SystemExit(child.wait())
finally:
    lock.release()
