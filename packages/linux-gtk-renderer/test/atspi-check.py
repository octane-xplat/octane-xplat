"""Run under dbus-run-session and xvfb-run; requires python3-gi + Atspi typelib.
An independent AT-SPI client asserts names from the real renderer bundle.
"""
import subprocess
import sys
import time
import tempfile
import gi

gi.require_version('Atspi', '2.0')
from gi.repository import Atspi


def names(node):
    result = [(node.get_role_name(), node.get_name())]
    for i in range(node.get_child_count()):
        child = node.get_child_at_index(i)
        if child is not None:
            result.extend(names(child))
    return result


def snapshot():
    desktop = Atspi.get_desktop(0)
    for i in range(desktop.get_child_count()):
        app = desktop.get_child_at_index(i)
        try:
            tree = names(app)
            if ('frame', 'Xplat AT-SPI regression') in tree:
                return tree
        except Exception:
            pass  # An unrelated app may exit during enumeration.
    return []


diagnostics = tempfile.TemporaryFile(mode='w+')
process = subprocess.Popen(['gjs', '-m', sys.argv[1]], stderr=diagnostics)
try:
    for phase, expected in [
        ('initial', [('push button', 'Save draft'), ('label', 'Build status: passing')]),
        ('updated', [('push button', 'Save final'), ('label', 'Build status: passing')]),
        ('removed', [('push button', 'Changed'), ('label', 'Still OK')]),
    ]:
        deadline = time.monotonic() + 6
        tree = []
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise AssertionError(f'GJS exited early: {process.returncode}')
            tree = snapshot()
            if all(item in tree for item in expected):
                break
            time.sleep(0.1)
        else:
            raise AssertionError(f'{phase}: expected {expected}, got {tree}')
        print(f'PASS AT-SPI {phase}: {tree}', flush=True)
    assert process.wait(timeout=6) == 0
    diagnostics.seek(0)
    errors = diagnostics.read()
    assert not any(marker in errors for marker in ['Gjs-CRITICAL', 'Gtk-CRITICAL', 'JS ERROR']), errors
    print('PASS renderer cleanup: no GJS/GTK critical diagnostics', flush=True)
finally:
    if process.poll() is None:
        process.terminate()
        process.wait(timeout=5)

    diagnostics.close()
