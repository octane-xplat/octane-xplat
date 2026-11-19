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

Removal binds to the verified dir inode, not the lock path: the inode is
recorded when ownership is verified, rechecked right before the rename
aside, and the captured trash dir must match it — and still decode to the
record verified — before anything is deleted. POSIX has no rename-if-inode,
so a stale reaper's deferred rename can still capture a replacement live
dir for a few syscalls; a mismatched capture is renamed back onto the free
lock path, or kept under our trash name with a loud warning when a third
dir already landed. Deleting a live lock is never a cleanup option: an
empty dir accepts a rename on POSIX, so unlinking entries at the lock path
also opens a window where an acquirer lands a fresh lock under a pending
rmdir — the shared path itself is never deleted.
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
        self._dir_ino = None
        self._preserve_trash = False

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

    @staticmethod
    def _is_our_record(record):
        return (
            bool(record)
            and record.get("pid") == os.getpid()
            and (not record.get("hostname") or record["hostname"] == socket.gethostname())
        )

    def _is_our_claim(self):
        return self._is_our_record(self._read_record(self.claim_file))

    # Post-capture verifiers run against the private trash dir. A reclaim
    # capture must still hold our claim and a dead-or-absent owner; a
    # release capture must hold our own owner record.
    def _is_our_reap_capture(self):
        claim = self._read_record(os.path.join(self.trash_dir, ".claim"))
        owner = self._read_record(os.path.join(self.trash_dir, "owner.json"))
        return self._is_our_record(claim) and not self._pid_alive(owner)

    def _is_our_owner_capture(self):
        return self._is_our_record(
            self._read_record(os.path.join(self.trash_dir, "owner.json"))
        )

    def _remove_transients(self):
        shutil.rmtree(self.staging_dir, ignore_errors=True)
        try:
            os.unlink(self.claim_source)
        except OSError:
            pass
        if not self._preserve_trash:
            shutil.rmtree(self.trash_dir, ignore_errors=True)

    # Delete the lock dir without exposing an empty dir at the lock path and
    # only ever delete the inode whose ownership was verified. The rename to
    # our trash name is atomic — the path becomes absent at once — but it
    # captures whatever sits there at that instant, and a destroyed claim or
    # a stolen dir can swap the verified inode for a foreign live lock
    # between verification and the rename. So the inode is recorded at
    # verification time, rechecked just before the rename (mismatch →
    # already resolved, leave it), and required to match the captured dir
    # along with the record verified. A mismatched capture is a foreign
    # dir: rename it back onto the free lock path, or — if a third dir
    # already landed — keep it under our trash name and warn; deleting a
    # live lock is never an option. The remaining residue is a foreign dir
    # displaced for a few syscalls, detected rather than silently destroyed.
    def _remove_lock_dir(self, expected_ino, verify_captured):
        shutil.rmtree(self.trash_dir, ignore_errors=True)
        try:
            if expected_ino is not None and os.stat(self.lock_dir).st_ino != expected_ino:
                return  # resolved or replaced since verification — not ours
        except OSError:
            return
        try:
            os.rename(self.lock_dir, self.trash_dir)
        except OSError:
            return
        try:
            captured_ino = os.stat(self.trash_dir).st_ino
        except OSError:
            return  # capture vanished — nothing left to verify or restore
        if expected_ino is None or captured_ino == expected_ino:
            if verify_captured():
                # Racers can still land a claim inside the dir while the
                # rename detaches it, so a stray entry may appear mid-delete;
                # retry the transient ENOTEMPTY rather than crash.
                for _retry in range(10):
                    try:
                        shutil.rmtree(self.trash_dir)
                        return
                    except OSError:
                        time.sleep(0.025)
                shutil.rmtree(self.trash_dir, ignore_errors=True)
                return
        try:
            os.rename(self.trash_dir, self.lock_dir)  # foreign dir — put it back
        except OSError:
            # Another dir already landed: preserve the displaced capture —
            # the startup sweep skips trash dirs holding a live owner record.
            self._preserve_trash = True
            print(
                "[lock] captured a foreign lock dir while removing ours; "
                "preserved at %s — its owner may still believe it holds the lock"
                % self.trash_dir,
                flush=True,
            )

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
        # processes so the lock root stays clean across crashes. A trash dir
        # may hold a captured live lock preserved after a failed restore —
        # keep it while its owner record names a live process.
        for entry in os.listdir(self.lock_root):
            head, _dash, pid_text = entry.rpartition("-")
            if not (
                pid_text.isdigit()
                and (head == "claimsrc" or head.endswith(".staging") or head.endswith(".reap"))
            ):
                continue

            if self._pid_alive({"pid": int(pid_text), "hostname": socket.gethostname()}):
                continue

            leftover = os.path.join(self.lock_root, entry)
            if self._pid_alive(self._read_record(os.path.join(leftover, "owner.json"))):
                continue
            shutil.rmtree(leftover, ignore_errors=True)
            try:
                os.unlink(leftover)
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
                self._dir_ino = os.stat(self.lock_dir).st_ino  # release() may remove only this inode
                break
            except OSError:
                shutil.rmtree(self.staging_dir, ignore_errors=True)
                if not os.path.exists(self.lock_dir):
                    continue  # reclaimed between our attempts — retry

            owner = self._read_record(self.owner_file)
            if owner:
                self._last_owner = owner

            if self._pid_alive(owner):
                if self._is_our_record(owner):
                    # Our staged dir landed but the stat bookkeeping failed —
                    # this dir is ours; take it rather than wait on ourselves.
                    try:
                        self._dir_ino = os.stat(self.lock_dir).st_ino
                    except OSError:
                        self._dir_ino = None  # release() verifies by owner record alone
                    break
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

                if self._is_our_record(claim):
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
                        # another evictor just landed — but only while the
                        # lock dir still holds the file we moved aside: its
                        # presence proves the path is the same dir we
                        # evicted from (an inode number can be recycled by
                        # a replacement). Either way the displaced copy is
                        # spent.
                        if os.path.exists(evicted):
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
                # Live owner — release only our claim: grab whatever `.claim`
                # names right now and drop it only when it decodes to our
                # record. A foreign claim goes back through os.link while the
                # dir is still the inode we grabbed it from; either way the
                # grabbed copy is spent.
                released = os.path.join(
                    self.lock_dir, ".claim-evicted-%d" % os.getpid()
                )
                try:
                    os.rename(self.claim_file, released)
                except OSError:
                    released = None  # dir or claim vanished — nothing to release

                if released and os.path.exists(released):
                    if self._is_our_record(self._read_record(released)):
                        try:
                            os.unlink(released)
                        except OSError:
                            pass
                    else:
                        # A foreign claim: put it back while the dir at the
                        # lock path still holds the grabbed file — its
                        # presence proves it is the dir we grabbed it from.
                        try:
                            os.link(released, self.claim_file)
                        except OSError:
                            pass
                        try:
                            os.unlink(released)
                        except OSError:
                            pass
                self._log_waiting(current)
                self._pause(self.wait_poll)
                continue

            # Remove only if our own claim is still the one inside the dir; a
            # superseded claim means another reclaimer owns this dir now. The
            # dir inode is pinned here so removal is bound to the verified
            # dir even if our claim is displaced before the rename executes.
            if self._is_our_claim():
                try:
                    expected_ino = os.stat(self.lock_dir).st_ino
                except OSError:
                    continue  # dir vanished under us — retry
                pid = current.get("pid") if current else "unknown"
                print(
                    "[lock] reclaiming stale %s lock (owner pid %s is gone)"
                    % (self.target, pid),
                    flush=True,
                )
                self._remove_lock_dir(expected_ino, self._is_our_reap_capture)
        else:
            self._remove_transients()
            raise TargetBusy(self.lock_dir)

        self.acquired = True
        return self

    def release(self):
        if not self.acquired:
            return
        self.acquired = False
        self._remove_lock_dir(self._dir_ino, self._is_our_owner_capture)
        self._remove_transients()
