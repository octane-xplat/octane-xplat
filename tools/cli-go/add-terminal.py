"""Exercise explicit add selection in an isolated terminal without visual evidence."""
import errno
import json
import os
import pty
import select
import signal
import sys
import time

binary, answer = sys.argv[1:]
pid, terminal = pty.fork()
if pid == 0:
    os.execv(binary, [binary, "add", "--no-install"])

output = bytearray()
sent = False
finished = False
deadline = time.monotonic() + 20
try:
    while time.monotonic() < deadline:
        if select.select([terminal], [], [], 0.03)[0]:
            try:
                output.extend(os.read(terminal, 8192))
            except OSError as error:
                if error.errno != errno.EIO:
                    raise
        if not sent and b"Enter cancels): " in output:
            sent = True
            os.write(terminal, b"\n" if answer == "cancel" else answer.encode() + b"\n")
        done, status = os.waitpid(pid, os.WNOHANG)
        if done:
            finished = True
            print(json.dumps({"code": os.waitstatus_to_exitcode(status),
                              "promptObserved": sent,
                              "output": output.decode("utf8", errors="replace")}))
            break
    else:
        raise RuntimeError("add terminal selection deadline exceeded")
finally:
    if not finished:
        try:
            os.killpg(pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        os.waitpid(pid, 0)
    os.close(terminal)
