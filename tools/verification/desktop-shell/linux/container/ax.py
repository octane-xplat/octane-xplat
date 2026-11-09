#!/usr/bin/env python3
"""AT-SPI helper for the desktop-shell journey. Subcommands:

  tree <app-name>              — print every (role, name) under the app
  find <app-name> <role> <name> — print "x,y,width,height" of the matching node
  press <app-name> <name>      — invoke the AT-SPI 'press'/'click' action by name
  value <app-name> <role> <name> — print the node's text value
Coordinates are global (root window) top-left, matching xdotool's expectations.
"""
import sys
import time
import gi

gi.require_version('Atspi', '2.0')
from gi.repository import Atspi


def walk(node, out):
    out.append(node)
    for i in range(node.get_child_count()):
        child = node.get_child_at_index(i)
        if child is not None:
            walk(child, out)


def app_nodes(app_name):
    desktop = Atspi.get_desktop(0)
    out = []
    for i in range(desktop.get_child_count()):
        app = desktop.get_child_at_index(i)
        try:
            if app_name.lower() in (app.get_name() or '').lower():
                walk(app, out)
        except Exception:
            pass
    return out


def find(app_name, role=None, name=None, timeout=8):
    deadline = time.monotonic() + timeout
    while True:
        for node in app_nodes(app_name):
            try:
                r = node.get_role_name()
                n = node.get_name() or ''
                if (role is None or r == role) and (name is None or name.lower() in n.lower()):
                    return node
            except Exception:
                pass
        if time.monotonic() > deadline:
            return None
        time.sleep(0.15)


cmd = sys.argv[1]
if cmd == 'tree':
    app_name = sys.argv[2]
    for node in app_nodes(app_name):
        try:
            print(f'{node.get_role_name()}|{node.get_name() or ""}')
        except Exception:
            pass
elif cmd == 'find':
    node = find(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
    if node is None:
        sys.exit('NOT_FOUND')
    ext = node.get_extents(Atspi.CoordType.SCREEN)
    print(f'{ext.x},{ext.y},{ext.width},{ext.height}')
elif cmd == 'press':
    node = find(sys.argv[2], None, sys.argv[3])
    if node is None:
        sys.exit('NOT_FOUND')
    action = node.get_action_iface()
    for i in range(action.get_n_actions()):
        if action.get_action_name(i) in ('press', 'click', 'activate'):
            action.do_action(i)
            print('PRESSED')
            sys.exit(0)
    sys.exit('NO_ACTION')
elif cmd == 'value':
    node = find(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else None)
    if node is None:
        sys.exit('NOT_FOUND')
    try:
        text = node.get_text_iface()
        print(text.get_text(0, -1))
    except Exception:
        print(node.get_name() or '')
