"""Exercise the actual foreground clean prompt in an isolated POSIX terminal."""
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
    os.execv(binary, [binary, "clean"])

output = bytearray()
sent = False
finished = False
deadline = time.monotonic() + 8
try:
    while time.monotonic() < deadline:
        if select.select([terminal], [], [], 0.05)[0]:
            try:
                output.extend(os.read(terminal, 4096))
            except OSError as error:
                if error.errno != errno.EIO:
                    raise
        if not sent and b"? [Y/n] " in output:
            sent = True
            if answer == "SIGTERM":
                os.kill(pid, signal.SIGTERM)
            else:
                os.write(terminal, b"\x04" if answer == "EOF" else (answer + "\n").encode())
        done, status = os.waitpid(pid, os.WNOHANG)
        if done:
            finished = True
            print(json.dumps({"code": os.waitstatus_to_exitcode(status), "promptObserved": sent, "output": output.decode("utf8", errors="replace")}))
            break
    else:
        raise RuntimeError("native clean terminal fixture exceeded its deadline")
finally:
    if not finished:
        os.kill(pid, signal.SIGTERM)
        os.waitpid(pid, 0)
    os.close(terminal)
