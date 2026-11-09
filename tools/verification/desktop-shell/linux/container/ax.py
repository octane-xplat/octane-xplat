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


def _norm(s):
    return ''.join(c for c in (s or '').lower() if c.isalnum())


def app_nodes(app_name):
    desktop = Atspi.get_desktop(0)
    out = []
    want = _norm(app_name)
    for i in range(desktop.get_child_count()):
        app = desktop.get_child_at_index(i)
        try:
            nodes = []
            walk(app, nodes)
            # Identity: the AT-SPI app name (prgname, desktop name, or the
            # application-id tail) OR any descendant window titled after the
            # app — same approach as the renderer's atspi-check fixture.
            names = {_norm(n.get_name()) for n in nodes if n is not None}
            if any(want in n or n in want for n in names if n):
                out.extend(nodes)
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
elif cmd == 'focused':
    # Print "role|name" of the currently focused node under the app.
    for node in app_nodes(sys.argv[2]):
        try:
            if node.get_state_set().contains(Atspi.StateType.FOCUSED):
                print(f'{node.get_role_name()}|{node.get_name() or ""}')
                sys.exit(0)
        except Exception:
            pass
    sys.exit('NONE')
elif cmd == 'windows':
    # One "role|name" line per window/frames the app exposes.
    for node in app_nodes(sys.argv[2]):
        try:
            if node.get_role_name() in ('frame', 'window', 'dialog'):
                print(f'{node.get_role_name()}|{node.get_name() or ""}')
        except Exception:
            pass
elif cmd == 'menu':
    # menu <app> <top-name> <item-name>: activate a menubar entry then its item.
    top = find(sys.argv[2], None, sys.argv[3], timeout=5)
    if top is None:
        sys.exit('NO_TOP')
    for action_name in ('click', 'press', 'activate'):
        action = top.get_action_iface()
        for i in range(action.get_n_actions()):
            if action.get_action_name(i) == action_name:
                action.do_action(i)
                break
        else:
            continue
        break
    time.sleep(0.4)
    item = find(sys.argv[2], 'menu item', sys.argv[4], timeout=5) or find(sys.argv[2], None, sys.argv[4], timeout=3)
    if item is None:
        sys.exit('NO_ITEM')
    action = item.get_action_iface()
    for i in range(action.get_n_actions()):
        if action.get_action_name(i) in ('click', 'press', 'activate'):
            action.do_action(i)
            print('ACTIVATED')
            sys.exit(0)
    sys.exit('NO_ACTION')
elif cmd == 'accel':
    # accel <trigger> — map a GTK accelerator like 'Ctrl+Alt+Shift+KeyJ' or
    # '<Control><Alt><Shift>j' to an xdotool key spec.
    trig = sys.argv[2]
    mods = []
    low = trig.lower()
    for token, mod in [('ctrl', 'ctrl'), ('control', 'ctrl'), ('alt', 'alt'),
                       ('shift', 'shift'), ('meta', 'super'), ('super', 'super')]:
        if token in low:
            mods.append(mod)
    # the key name is the last + or > segment, KeyX strips its prefix
    import re
    m = re.findall(r'(?:Key)?([A-Za-z0-9]+)>?$', trig) or re.findall(r'([A-Za-z0-9]+)$', trig)
    key = (m[-1] if m else 'j').lower()
    mods.append(key)
    print('+'.join(dict.fromkeys(mods)))
