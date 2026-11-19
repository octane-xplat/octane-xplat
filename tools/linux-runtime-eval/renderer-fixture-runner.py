import json
from contextlib import contextmanager, nullcontext
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import queue
import re
import subprocess
import sys
import threading
import time


def send(*args):
    subprocess.run(["xdotool", *args], check=True, timeout=7, stdout=subprocess.DEVNULL)


def fixture_actions(marker, record):
    phase = record.get("phase")
    if marker == "GTK_RADIO" and "point" in record:
        return [record["point"]]
    if marker in ("GTK_TOGGLE_CONTROLS", "GTK_TOGGLE_FIELDS") and phase != "label":
        return [{"key": {"tab": "Tab", "space": "space", "return": "Return"}[phase]}]
    if marker == "GTK_PRESS_KEYS":
        if phase in ("hold", "release"):
            return [{"key": "space", "keyEvent": "keydown" if phase == "hold" else "keyup"}]
        return [{"key": {"tab": "Tab", "space": "space", "return": "Return", "child": "space"}[phase]}]
    if marker == "GTK_FIELD_CHROME":
        if phase == "edit":
            return [{"key": "ctrl+a"}, {"type": "Edited account", "delay": 1}]
        keys = {"clear-focus": "Tab", "info": "Tab", "clear": "Return", "escape": "Escape"}
        if phase == "status":
            return [{"key": "Tab"}, {"key": "Tab"}]
        if phase in keys:
            return [{"key": keys[phase]}]
    if marker == "GTK_TOOLTIP":
        if phase == "hover":
            return [{**record, "hover": True}]
        if phase == "leave":
            return [{"x": 390, "y": 340, "hover": True}]
        return [{"key": {"focus": "Tab", "escape": "Escape"}[phase]}]
    if marker == "GTK_TEXT_VIEW":
        actions = [{"type": record["text"], "delay": 30}] if record.get("text") else []
        if record.get("key"):
            actions.append({"key": record["key"]})
        return actions
    if marker == "GTK_TEXT_ENTRY":
        if phase == "controlled-middle":
            return [{"type": "X", "delay": 30}]
        if phase == "cursor":
            return [{"key": "Left"}]
        text = {"edit": "Typed", "controlled-reject": "12x", "controlled-accept": "Accepted"}
        return [record, {"key": "ctrl+a"}, {"type": text.get(phase, "BLOCKED"), "delay": 30}, {"key": "Return"}]
    if marker == "GTK_TEXT_AREA":
        if phase in ("return", "home", "end"):
            return [{"key": {"return": "Return", "home": "ctrl+Home", "end": "ctrl+End"}[phase]}]
        if phase.startswith("type-"):
            return [{"type": phase[5:]}]
        button = 1 if phase.endswith("-click") else 5 if phase.endswith("down") else 4
        return [{**record, "button": button}]
    return [record]


def deliver(title, marker, record):
    windows = subprocess.check_output(
        ["xdotool", "search", "--onlyvisible", "--name", "^" + re.escape(title) + "$"],
        text=True,
        timeout=7,
    ).splitlines()
    if not windows:
        raise RuntimeError("GTK fixture window was not found")
    window = windows[0]
    if marker == "GTK_UI_INPUT_RESULT":
        send(
            "mousemove", "--sync", "--window", window, "20", "20", "click", "1",
            "sleep", "0.04", "mousedown", "1",
            "mousemove", "--sync", "--window", window, "45", "35", "sleep", "0.04",
            "mousemove", "--sync", "--window", window, "80", "60", "sleep", "0.04", "mouseup", "1",
        )
        return
    if marker == "GTK_UI_AREA":
        send(
            "mousemove", "--sync", "--window", window, "30", "20", "mousedown", "1",
            "mousemove", "--sync", "--window", window, "30", "120", "sleep", "0.06",
            "mousemove", "--sync", "--window", window, "30", "220", "sleep", "0.06", "mouseup", "1",
        )
        return
    if marker == "GTK_UI_SCROLL":
        send("mousemove", "--sync", "--window", window, "40", "40", "click", "5")
        return
    send("windowfocus", window)

    for phase in fixture_actions(marker, record):
        deliver_action(window, phase)

    send("key", "F12")


def deliver_action(window, phase):
    if phase.get("type") is not None:
        send("type", "--clearmodifiers", "--delay", str(phase.get("delay", 35)), "--", phase["type"])
    elif phase.get("key"):
        if "keyEvent" in phase:
            send(phase["keyEvent"], phase["key"])
        else:
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
            if "button" in phase:
                send("click", "--repeat", str(phase.get("repeat", 6)), "--delay", "35", str(phase["button"]))
            else:
                send("click", "1")


def read_stream(name, stream, events):
    for line in iter(stream.readline, ""):
        events.put((name, line))
    events.put((name, None))


@contextmanager
def icon_fixture(directory):
    svg = b'<svg xmlns="http://www.w3.org/2000/svg" width="13" height="9"><path d="M0 0h13v9H0z"/></svg>'
    source = directory / "fixture-icon.svg"
    manifest = directory / "fixture-resources.xml"
    resource = directory / "fixture.gresource"
    source.write_bytes(svg)
    manifest.write_text('<gresources><gresource prefix="/icons"><file>fixture-icon.svg</file></gresource></gresources>')
    subprocess.run(
        ["glib-compile-resources", f"--sourcedir={directory}", f"--target={resource}", str(manifest)],
        check=True,
        timeout=10,
    )

    class IconHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path.endswith("/slow.svg"):
                time.sleep(0.2)
            self.send_response(404 if self.path.endswith("/missing.svg") else 200)
            self.send_header("Content-Type", "image/svg+xml")
            self.end_headers()
            self.wfile.write(svg)

    with ThreadingHTTPServer(("127.0.0.1", 0), IconHandler) as server:
        listener = threading.Thread(target=server.serve_forever)
        listener.start()
        try:
            yield {
                "GTK_ICON_FILE": str(source),
                "GTK_ICON_RESOURCE": str(resource),
                "GTK_ICON_HTTP": f"http://127.0.0.1:{server.server_port}",
            }
        finally:
            server.shutdown()
            listener.join()


def main(bundle):
    marker = os.environ["LINUX_RUNTIME_EVAL_MARKER"]
    resources = icon_fixture(Path(bundle).resolve().parent) if marker == "GTK_UI_ICON" else nullcontext({})
    with resources as settings:
        run_fixture(bundle, marker, settings)


def run_fixture(bundle, marker, settings):
    command = json.loads(os.environ["LINUX_RUNTIME_EVAL_COMMAND"])
    engine = os.environ["LINUX_RUNTIME_EVAL_ENGINE"]
    title = os.environ["LINUX_RUNTIME_EVAL_TITLE"]
    ready_marker = os.environ.get("LINUX_RUNTIME_EVAL_READY_MARKER", marker + "_READY")
    minimum = int(os.environ["LINUX_RUNTIME_EVAL_MIN_CHECKS"])
    expected_os_input = os.environ["LINUX_RUNTIME_EVAL_EXPECT_OS_INPUT"] == "1"
    env = os.environ.copy()
    env.update(settings)
    env[os.environ["LINUX_RUNTIME_EVAL_INPUT_FLAG"]] = "1" if expected_os_input else "0"
    input_result = os.environ["LINUX_RUNTIME_EVAL_INPUT_RESULT"]

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
    delivered = 0
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
            prefix = ready_marker + " "
            bare_ready = marker in ("GTK_UI_AREA", "GTK_UI_SCROLL") and line.rstrip() == prefix.rstrip()
            if expected_os_input and (line.startswith(prefix) or bare_ready):
                try:
                    record = {} if bare_ready else json.loads(line[len(prefix) :])
                    deliver(title, marker, record)
                    delivered += 1
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
    if os.environ.get("LINUX_RUNTIME_EVAL_MISSING_MASON") == "1":
        if input_error or code == 0 or "XplatMason layout engine is required" not in stderr:
            raise RuntimeError("missing Mason did not fail with its startup diagnostic\n" + stdout + "\n" + stderr)
        print(json.dumps({"engine": engine, "checks": 2, "osInput": False, "failures": []}), flush=True)
        return
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
    reported_os_input = result.get(input_result)
    os_input_matches = (
        reported_os_input is expected_os_input
        if input_result in result
        else not expected_os_input
    )
    if result.get("checks", 0) < minimum or not os_input_matches:
        raise RuntimeError("fixture checks did not meet the OS-input threshold: " + summary_line)
    if expected_os_input and not delivered:
        raise RuntimeError("fixture reported OS input without a delivered input phase")
    if result.get("failures"):
        raise RuntimeError("fixture assertions failed: " + summary_line)

    print(
        json.dumps(
            {
                "engine": engine,
                "gtk": result.get("gtk"),
                "checks": result.get("checks", 0),
                "osInput": reported_os_input is True,
                "failures": result.get("failures", []),
                "fixture": result,
                **({"stderr": stderr} if os.environ.get("LINUX_RUNTIME_EVAL_DIAGNOSTICS") == "1" else {}),
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
