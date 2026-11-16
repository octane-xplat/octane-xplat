import json
import os
import queue
import re
import subprocess
import sys
import threading
import time


def send(*args):
    subprocess.run(["xdotool", *args], check=True, timeout=7, stdout=subprocess.DEVNULL)


def deliver(title, phase):
    windows = subprocess.check_output(
        ["xdotool", "search", "--onlyvisible", "--name", "^" + re.escape(title) + "$"],
        text=True,
        timeout=7,
    ).splitlines()
    if not windows:
        raise RuntimeError("GTK fixture window was not found")
    window = windows[0]
    send("windowfocus", window)

    if phase.get("type") is not None:
        send("type", "--clearmodifiers", "--delay", "35", "--", phase["type"])
    elif phase.get("key"):
        send("key", "--clearmodifiers", phase["key"])
    elif phase.get("dbl"):
        send("mousemove", "--window", window, str(round(phase["x"])), str(round(phase["y"])))
        send("click", "--repeat", "2", "--delay", "60", "1")
    elif phase.get("scroll"):
        send("mousemove", "--window", window, str(round(phase["x"])), str(round(phase["y"])))
        button = "4" if phase["scroll"] < 0 else "5"
        for _ in range(abs(phase["scroll"])):
            send("click", button)
    elif phase.get("drag"):
        x, y = round(phase["x"]), round(phase["y"])
        args = ["mousemove", "--window", window, str(x), str(y), "mousedown", "1"]
        for step in range(1, 11):
            args.extend(
                [
                    "mousemove",
                    "--window",
                    window,
                    str(round(x + phase["drag"].get("dx", 0) * step / 10)),
                    str(round(y + phase["drag"].get("dy", 0) * step / 10)),
                    "sleep",
                    "0.01",
                ]
            )
        args.extend(["mouseup", "1"])
        send(*args)
    else:
        send("mousemove", "--window", window, str(round(phase["x"])), str(round(phase["y"])))
        if phase.get("hold"):
            send("mousedown", "1")
            send("sleep", str(phase.get("holdMs", 800) / 1000))
            send("mouseup", "1")
        elif not phase.get("hover"):
            send("click", "1")

    send("key", "F12")


def read_stream(name, stream, events):
    for line in iter(stream.readline, ""):
        events.put((name, line))
    events.put((name, None))


def main(bundle):
    command = json.loads(os.environ["LINUX_RUNTIME_EVAL_COMMAND"])
    engine = os.environ["LINUX_RUNTIME_EVAL_ENGINE"]
    title = os.environ["LINUX_RUNTIME_EVAL_TITLE"]
    marker = os.environ["LINUX_RUNTIME_EVAL_MARKER"]
    minimum = int(os.environ["LINUX_RUNTIME_EVAL_MIN_CHECKS"])
    expected_os_input = os.environ["LINUX_RUNTIME_EVAL_EXPECT_OS_INPUT"] == "1"
    env = os.environ.copy()
    env[marker + "_OS"] = "1" if expected_os_input else "0"

    child = subprocess.Popen(
        [*command, bundle],
        cwd=os.path.dirname(os.path.abspath(bundle)),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )
    events = queue.Queue()
    for name, stream in (("stdout", child.stdout), ("stderr", child.stderr)):
        threading.Thread(target=read_stream, args=(name, stream, events), daemon=True).start()

    output = []
    errors = []
    closed = set()
    input_error = None
    deadline = time.monotonic() + 110

    while len(closed) < 2:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            child.kill()
            input_error = "Native GTK fixture timed out after 110 seconds"
            break
        try:
            name, line = events.get(timeout=min(0.25, remaining))
        except queue.Empty:
            if child.poll() is not None and len(closed) == 2:
                break
            continue

        if line is None:
            closed.add(name)
            continue
        if name == "stdout":
            output.append(line)
            print(line, end="", flush=True)
            prefix = marker + "_READY "
            if expected_os_input and line.startswith(prefix):
                try:
                    deliver(title, json.loads(line[len(prefix) :]))
                except Exception as error:
                    input_error = str(error)
                    child.kill()
        else:
            errors.append(line)

    try:
        code = child.wait(timeout=5)
    except subprocess.TimeoutExpired:
        child.kill()
        code = child.wait()

    stdout = "".join(output)
    stderr = "".join(errors)
    if input_error or code != 0:
        raise RuntimeError(
            "fixture process failed\n"
            + stdout
            + "\n"
            + stderr
            + "\n"
            + (input_error or "exit code " + str(code))
        )
    if re.search(r"Gtk-CRITICAL|Gjs-CRITICAL|GLib-GObject-CRITICAL|\[linux-gtk\] event handler failed", stderr):
        raise RuntimeError("GTK runtime emitted a critical warning\n" + stderr)
    if re.search(r"ignored prop accessibilityLabel", stdout + stderr):
        raise RuntimeError("GTK runtime ignored accessibilityLabel")

    summary_line = next(
        (line for line in stdout.splitlines() if line.startswith(marker + " ")), None
    )
    if summary_line is None:
        raise RuntimeError("fixture did not emit its summary\n" + stdout + "\n" + stderr)
    result = json.loads(summary_line[len(marker) + 1 :])
    reported_os_input = result.get("osInput")
    os_input_matches = (
        reported_os_input is expected_os_input
        if "osInput" in result
        else not expected_os_input
    )
    if result.get("checks", 0) < minimum or not os_input_matches:
        raise RuntimeError("fixture checks did not meet the OS-input threshold: " + summary_line)
    if result.get("failures"):
        raise RuntimeError("fixture assertions failed: " + summary_line)

    print(
        json.dumps(
            {
                "engine": engine,
                "gtk": result.get("gtk"),
                "checks": result.get("checks", 0),
                "osInput": result.get("osInput", False),
                "failures": result.get("failures", []),
                "fixture": result,
            },
            sort_keys=True,
        ),
        flush=True,
    )


if __name__ == "__main__":
    try:
        main(sys.argv[1])
    except Exception as error:
        print(str(error), file=sys.stderr, flush=True)
        raise SystemExit(1)
