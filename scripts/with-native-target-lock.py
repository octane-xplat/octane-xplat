"""Serialize cooperating native builds/device sessions across worktrees."""
import fcntl
import os
import subprocess
import sys

if len(sys.argv) < 3 or sys.argv[1] not in ("ios", "android"):
    raise SystemExit("Usage: python3 scripts/with-native-target-lock.py <ios|android> <command> [args...]")

# Never unlink this file: waiters must lock the same inode.
path = os.path.join(os.environ.get("XPLAT_NATIVE_LOCK_DIR", "/tmp"), "octane-xplat-" + sys.argv[1] + ".lock")
with open(path, "a+") as lock:
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise SystemExit("Native target is busy; retry after the owner releases " + path)
    print("Holding native target lock: " + path, file=sys.stderr, flush=True)
    raise SystemExit(subprocess.call(sys.argv[2:]))
