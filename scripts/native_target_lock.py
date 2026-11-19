"""Shared per-target advisory lock for serializing native builds and
simulator/device use across worktrees and agent sessions on this host.

scripts/with-target-lock.ts implements the same protocol for Node callers:
every wrapper contends on one lock dir, so Python and Node callers mutually
exclude on a target. Used by with-native-target-lock.py (fail-fast CLI) and
apps/mobile/scripts/check-navigation.py (inline, optional wait).

The lock lives under the system temp dir shared by every worktree;
XPLAT_NATIVE_LOCK_DIR redirects the lock root and XPLAT_NATIVE_LOCK_POLL_MS
overrides the wait poll interval for tests.

Acquire: stage a dir containing owner.json, then os.rename it onto the lock
path — a non-empty dir already there rejects the rename, so acquiring is
atomic and a lock dir is never observed without its owner record.
Reclaim: a dead owner's dir may only be removed while holding a `.claim`
linked inside that same dir; while it stands the dir cannot be replaced, so
the owner re-check under claim runs against the exact dir being removed. A
`.claim` left by a dead reclaimer is evicted by renaming it aside and
re-checking the grabbed inode — whoever moves the name owns the inode —
never by unlink after read, which is a check-then-act race that can delete
a fresh live claim and produce two concurrent claimants.

Removal always renames the verified dir to a trash name before deleting:
an empty dir accepts a rename on POSIX, so unlinking entries at the lock
path opens a window where an acquirer lands a fresh lock under a pending
rmdir. The shared path itself is never deleted — a failed rename means
another process already resolved the dir, and whatever now sits there is
not ours.
"""
import errno
import itertools
import json
import os
import shutil
import socket
import tempfile
import time
from datetime import datetime, timezone


class TargetBusy(Exception):
    """The lock is held or a live reclaimer is resolving it; raised instead
    of waiting when the lock was requested fail-fast."""


class LockTimeout(Exception):
    """The lock was still held when the wait deadline passed."""


class target_lock:
    """One acquisition of the shared target lock.

    timeout_seconds: None waits indefinitely, 0 fails fast with TargetBusy,
    N waits up to N seconds before raising LockTimeout.
    """

    def __init__(self, target, timeout_seconds=None):
        self.target = target
        self.fail_fast = timeout_seconds == 0
        self.deadline = (
            None
            if timeout_seconds in (None, 0)
            else time.monotonic() + timeout_seconds
        )
        self.lock_root = os.environ.get("XPLAT_NATIVE_LOCK_DIR") or os.path.join(
            tempfile.gettempdir(), "octane-xplat-target-locks"
        )
        self.lock_dir = os.path.join(self.lock_root, target + ".lock")
        self.owner_file = os.path.join(self.lock_dir, "owner.json")
        self.claim_file = os.path.join(self.lock_dir, ".claim")
        self.staging_dir = os.path.join(
            self.lock_root, "%s.staging-%d" % (target, os.getpid())
        )
        self.claim_source = os.path.join(
            self.lock_root, "claimsrc-%d" % os.getpid()
        )
        self.trash_dir = os.path.join(
            self.lock_root, "%s.reap-%d" % (target, os.getpid())
        )
        self.wait_poll = (float(os.environ.get("XPLAT_NATIVE_LOCK_POLL_MS") or 5000)) / 1000
        self.acquired = False
        self._last_owner = None
        self._owner_logged = False

    def __enter__(self):
        if not self.acquired:
            self.acquire()
        return self

    def __exit__(self, *_exc):
        self.release()

    def _pid_alive(self, record):
        if not isinstance(record, dict) or not isinstance(record.get("pid"), int):
            return False

        if record.get("hostname") and record["hostname"] != socket.gethostname():
            return True  # another host — cannot probe; treat as live

        try:
            os.kill(record["pid"], 0)
            return True
        except ProcessLookupError:
            return False
        except PermissionError:
            return True  # exists but owned by another user

    @staticmethod
    def _read_record(path):
        try:
            with open(path) as handle:
                record = json.load(handle)
                return record if isinstance(record, dict) else None
        except (OSError, ValueError):
            return None

    def _is_our_claim(self):
        claim = self._read_record(self.claim_file)
        return (
            bool(claim)
            and claim.get("pid") == os.getpid()
            and (not claim.get("hostname") or claim["hostname"] == socket.gethostname())
        )

    def _remove_transients(self):
        shutil.rmtree(self.staging_dir, ignore_errors=True)
        try:
            os.unlink(self.claim_source)
        except OSError:
            pass
        shutil.rmtree(self.trash_dir, ignore_errors=True)

    # Delete the lock dir without exposing an empty dir at the lock path: the
    # dir is renamed to our trash name first, and a failed rename means
    # another process already resolved it — never delete whatever now sits
    # at the path.
    def _remove_lock_dir(self):
        shutil.rmtree(self.trash_dir, ignore_errors=True)
        try:
            os.rename(self.lock_dir, self.trash_dir)
        except OSError:
            return
        # Racers can still land a claim inside the dir while the rename
        # detaches it, so a stray entry may appear mid-delete; retry the
        # transient ENOTEMPTY rather than crash.
        for _retry in range(10):
            try:
                shutil.rmtree(self.trash_dir)
                return
            except OSError:
                time.sleep(0.025)
        shutil.rmtree(self.trash_dir, ignore_errors=True)

    def _pause(self, seconds):
        if self.fail_fast:
            self._remove_transients()
            raise TargetBusy(self.lock_dir)
        time.sleep(seconds)

    def _log_waiting(self, owner):
        if not self._owner_logged:
            pid = owner.get("pid") if owner else "unknown"
            cwd = owner.get("cwd") if owner else "?"
            print(
                "[lock] %s held by pid %s (%s) — waiting" % (self.target, pid, cwd),
                flush=True,
            )
            self._owner_logged = True

    def acquire(self):
        os.makedirs(self.lock_root, exist_ok=True)

        # Drop staging dirs, claim sources, and trash dirs abandoned by dead
        # processes so the lock root stays clean across crashes.
        for entry in os.listdir(self.lock_root):
            head, _dash, pid_text = entry.rpartition("-")
            if not (
                pid_text.isdigit()
                and (head == "claimsrc" or head.endswith(".staging") or head.endswith(".reap"))
            ):
                continue

            if not self._pid_alive({"pid": int(pid_text), "hostname": socket.gethostname()}):
                shutil.rmtree(os.path.join(self.lock_root, entry), ignore_errors=True)
                try:
                    os.unlink(os.path.join(self.lock_root, entry))
                except OSError:
                    pass

        with open(self.claim_source, "w") as handle:
            json.dump({"pid": os.getpid(), "hostname": socket.gethostname()}, handle)

        # Fail-fast mode gets a bounded number of passes through the state
        # machine — enough to complete reclaim work, never to wait.
        attempts = range(200) if self.fail_fast else itertools.count()

        for _attempt in attempts:
            if self.deadline is not None and time.monotonic() > self.deadline:
                pid = self._last_owner.get("pid") if self._last_owner else "unknown"
                self._remove_transients()
                raise LockTimeout(
                    "timed out waiting for %s lock held by pid %s" % (self.target, pid)
                )

            # Stage the full lock dir and move it into place atomically.
            shutil.rmtree(self.staging_dir, ignore_errors=True)
            os.mkdir(self.staging_dir)
            with open(os.path.join(self.staging_dir, "owner.json"), "w") as handle:
                json.dump(
                    {
                        "pid": os.getpid(),
                        "hostname": socket.gethostname(),
                        "cwd": os.getcwd(),
                        "started": datetime.now(timezone.utc).isoformat(),
                    },
                    handle,
                )

            try:
                os.rename(self.staging_dir, self.lock_dir)
                break
            except OSError:
                shutil.rmtree(self.staging_dir, ignore_errors=True)
                if not os.path.exists(self.lock_dir):
                    continue  # reclaimed between our attempts — retry

            owner = self._read_record(self.owner_file)
            if owner:
                self._last_owner = owner

            if self._pid_alive(owner):
                self._log_waiting(owner)
                self._pause(self.wait_poll)
                continue

            # Stale or unreadable owner. Only a claim holder may remove the
            # dir; the claim lives inside it, so while it stands no one else
            # can remove or replace the dir.
            try:
                if not os.path.isdir(self.lock_dir):
                    os.unlink(self.lock_dir)  # stray file — never a valid lock
                    continue
            except OSError:
                continue  # vanished under us — retry

            claimed = False

            try:
                os.link(self.claim_source, self.claim_file)
                claimed = True
            except OSError as error:
                if error.errno == errno.ENOENT:
                    continue  # dir vanished under us — retry

                claim = self._read_record(self.claim_file)

                if claim and claim.get("pid") == os.getpid():
                    claimed = True  # left over from our earlier attempt
                elif self._pid_alive(claim):
                    self._pause(0.15)  # a live reclaimer is resolving the dir
                else:
                    # Dead or garbled claim. Evict it by renaming it aside:
                    # the rename atomically gives us whatever inode .claim
                    # holds right now, so a claim swapped in after our read
                    # is detected instead of deleted. Reading then unlinking
                    # the shared path would be a check-then-act race that can
                    # remove a live claim and produce two claimants.
                    evicted = os.path.join(
                        self.lock_dir, ".claim-evicted-%d" % os.getpid()
                    )

                    try:
                        os.rename(self.claim_file, evicted)
                    except OSError:
                        continue  # claim vanished under us — retry

                    if self._pid_alive(self._read_record(evicted)):
                        # We displaced a live claim. Restore it through
                        # os.link, which fails rather than clobber a claim
                        # another evictor just landed; either way the
                        # displaced copy is spent.
                        try:
                            os.link(evicted, self.claim_file)
                        except OSError:
                            pass
                        try:
                            os.unlink(evicted)
                        except OSError:
                            pass
                        self._pause(0.15)
                    else:
                        try:
                            # dead claim — reaped at our private name
                            os.unlink(evicted)
                        except OSError:
                            pass

            if not claimed:
                continue

            # Under the claim, check the owner again: the dir may have been
            # reclaimed and re-acquired since our first read, and only the
            # current record counts.
            current = self._read_record(self.owner_file)
            if current:
                self._last_owner = current

            if self._pid_alive(current):
                try:
                    os.unlink(self.claim_file)  # live owner — release only our claim
                except OSError:
                    pass
                self._log_waiting(current)
                self._pause(self.wait_poll)
                continue

            # Remove only if our own claim is still the one inside the dir; a
            # superseded claim means another reclaimer owns this dir now.
            if self._is_our_claim():
                pid = current.get("pid") if current else "unknown"
                print(
                    "[lock] reclaiming stale %s lock (owner pid %s is gone)"
                    % (self.target, pid),
                    flush=True,
                )
                self._remove_lock_dir()
        else:
            self._remove_transients()
            raise TargetBusy(self.lock_dir)

        self.acquired = True
        return self

    def release(self):
        if not self.acquired:
            return
        self.acquired = False
        self._remove_lock_dir()
        self._remove_transients()
