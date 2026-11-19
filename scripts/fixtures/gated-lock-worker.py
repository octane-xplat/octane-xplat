"""Gated native_target_lock worker for scripts/native-target-lock.test.mts.

Patches os.rename so renames whose source is XPLAT_GATE_LOCKDIR pause under
a file gate in XPLAT_GATE_DIR: writes at-lockdir-rename, then waits for
go-lockdir-rename. The gate holds the deferred removal rename
(lock_dir -> trash) open so the test can replace the verified lock dir
with a foreign live dir before the rename executes — the check-then-act
window a stale reaper used to turn into a deleted live lock.

With XPLAT_MARKS the worker runs marker-child mode: creates
holding-<XPLAT_ID> inside the marks dir, flags 'violation' if another
holding-* entry coexists, removes it after XPLAT_HOLD_MS, then releases.
Without XPLAT_MARKS it holds until <gate dir>/release-worker exists.
"""
import os
import sys
import time

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
import native_target_lock

lock_dir = os.environ["XPLAT_GATE_LOCKDIR"]
gate_dir = os.environ["XPLAT_GATE_DIR"]
target = os.environ["XPLAT_GATE_TARGET"]
marks = os.environ.get("XPLAT_MARKS")
ident = os.environ.get("XPLAT_ID", "worker")
hold_ms = int(os.environ.get("XPLAT_HOLD_MS") or 2500)

_orig_rename = os.rename


def _rename(src, dst, *args, **kwargs):
    if str(src) == lock_dir:
        with open(os.path.join(gate_dir, "at-lockdir-rename"), "w") as handle:
            handle.write(str(os.getpid()))
        deadline = time.monotonic() + 60
        while not os.path.exists(os.path.join(gate_dir, "go-lockdir-rename")):
            if time.monotonic() > deadline:
                break
            time.sleep(0.002)
    return _orig_rename(src, dst, *args, **kwargs)


os.rename = _rename

lock = native_target_lock.target_lock(target, timeout_seconds=60)
lock.acquire()
print("ACQUIRED %s" % ident, flush=True)

if marks:
    marker = os.path.join(marks, "holding-" + ident)
    os.mkdir(marker)
    end = time.monotonic() + hold_ms / 1000
    while time.monotonic() < end:
        others = [
            entry
            for entry in os.listdir(marks)
            if entry.startswith("holding-") and entry != "holding-" + ident
        ]
        if others:
            with open(os.path.join(marks, "violation"), "w") as handle:
                handle.write(ident + " saw " + ",".join(others))
        time.sleep(0.015)
    os.rmdir(marker)
else:
    release_file = os.path.join(gate_dir, "release-worker")
    deadline = time.monotonic() + 60
    while not os.path.exists(release_file) and time.monotonic() < deadline:
        time.sleep(0.02)

lock.release()
print("RELEASED %s" % ident, flush=True)
