"""OS input against the packed public consumer. No screenshots or handler dispatch."""
import json
import subprocess
import sys
import threading
import time

events = []
child = subprocess.Popen(['gjs', '-m', sys.argv[1]], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)


def collect(pipe, prefix=''):
    for line in pipe:
        print(prefix + line, end='', flush=True)
        if line.startswith('DESKTOP '):
            item = json.loads(line[8:])
            events.append(item)


threading.Thread(target=collect, args=(child.stdout,), daemon=True).start()
threading.Thread(target=collect, args=(child.stderr, 'STDERR '), daemon=True).start()


def wait_for(predicate, name, seconds=6, since=0):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        for event in list(events)[since:]:
            if predicate(event):
                return event
        if child.poll() is not None:
            break
        time.sleep(.03)
    raise AssertionError(name)


def xdo(*args):
    return subprocess.check_output(['xdotool', *map(str, args)], text=True).strip()


def check(ok, name):
    if not ok:
        raise AssertionError(name)
    print('DESKTOP_CHECK ' + name, flush=True)


def count(kind):
    return sum(event['kind'] == kind for event in events)


def settled_scroll():
    deadline = time.monotonic() + 5
    previous = None
    stable_since = time.monotonic()
    while time.monotonic() < deadline:
        samples = [event['detail']['block'] for event in events if event['kind'] == 'geometry']
        if samples:
            current = samples[-1]
            if previous is None or abs(current - previous) > .1:
                previous = current
                stable_since = time.monotonic()
            elif time.monotonic() - stable_since > .65:
                return current
        time.sleep(.05)
    raise AssertionError('Native wheel scrolling did not settle within the input bound')


try:
    ready = wait_for(lambda e: e['kind'] == 'ready', 'ready with pinned Mason')['detail']
    window = xdo('search', '--name', '^octane-packed-gestures$').splitlines()[0]
    other = xdo('search', '--name', '^octane-packed-interruption$').splitlines()[0]
    xdo('windowraise', window, 'windowfocus', window)

    def move(x, y):
        xdo('mousemove', '--window', window, round(x), round(y))

    def drag(x, y, dx, release=True):
        move(x, y)
        xdo('mousedown', 1)
        time.sleep(.05)
        for step in range(1, 21):
            move(x + dx * step / 20, y)
            time.sleep(.025)
        if release:
            xdo('mouseup', 1)
        time.sleep(.2)

    button = ready['button']
    start_x, start_y = button['x'] + 30, button['y'] + 30
    drag(start_x, start_y, 100)
    wait_for(lambda e: e['kind'] == 'drag-finish', 'Motion terminal')
    geometry = wait_for(lambda e: e['kind'] == 'geometry' and abs(e['detail']['x'] - 80) < 2, 'native transform')['detail']
    check(count('press') == 0, 'nested press suppressed after drag')
    check(abs(geometry['x'] - 80) < 2, 'scaled parent converts 100 window units to 80 Motion units')
    check(abs(geometry['motion']['x'] - ready['motion']['x'] - 100) < 2, 'actual rendered bounds move 100 units')
    move(start_x + 100, start_y)
    xdo('click', 1)
    wait_for(lambda e: e['kind'] == 'press' and e['detail'] == 'pointer', 'fresh pointer press')
    xdo('key', 'space')
    wait_for(lambda e: e['kind'] == 'press' and e['detail'] == 'keyboard', 'keyboard Space press')

    field = ready['field']
    before = count('reveal-start')
    drag(field['x'] + 30, field['y'] + 15, 70)
    check(count('reveal-start') == before, 'native text selection wins over ancestor reveal')
    move(field['x'] + 30, field['y'] + 15)
    xdo('click', 1, 'key', '--clearmodifiers', 'ctrl+a', 'type', '--clearmodifiers', 'Preserved')
    wait_for(lambda e: e['kind'] == 'edit' and e['detail'] == 'Preserved', 'native text editing')
    slider = ready['slider']
    before = count('reveal-start')
    drag(slider['x'] + slider['width'] / 2, slider['y'] + slider['height'] / 2, 50)
    wait_for(lambda e: e['kind'] == 'slider-change' and e['detail'] != 50, 'public slider responds to OS drag')
    check(count('reveal-start') == before, 'slider manipulation wins over ancestor reveal')
    scroll = ready['scroll']
    sx, sy = scroll['x'] + scroll['width'] / 2, scroll['y'] + scroll['height'] - 30
    move(sx, sy)
    xdo('click', '--repeat', 5, '--delay', 60, 5)
    wait_for(lambda e: e['kind'] == 'geometry' and e['detail']['block'] > 0, 'OS wheel scroll')
    scrolled = settled_scroll()
    drag(sx, sy, 80)
    wait_for(lambda e: e['kind'] == 'reveal-finish', 'reveal over scroll viewport')
    time.sleep(.4)
    latest = [e['detail'] for e in events if e['kind'] == 'geometry'][-1]
    check(abs(latest['block'] - scrolled) < 1, 'horizontal reveal preserves vertical scroll offset')
    move(sx, sy)
    reverse_start = len(events)
    xdo('click', '--repeat', 3, '--delay', 60, 4)
    wait_for(lambda e: e['kind'] == 'geometry' and e['detail']['block'] < scrolled, 'OS wheel scroll resumes after reveal', since=reverse_start)

    drag(start_x + 100, start_y, 30, release=False)
    xdo('windowfocus', other)
    time.sleep(.2)
    xdo('mouseup', 1)
    wait_for(lambda e: e['kind'] == 'drag-finish' and e['detail'].get('cancelled'), 'window deactivation cancels Motion')
    check(count('drag-finish') == 2, 'exactly one terminal per Motion contact sequence')
    # AT-SPI is queried by an independent client below; GTK test helpers do
    # not establish accessibility service or action delivery.
    import gi
    from gi.repository import Gio, GLib
    session = Gio.bus_get_sync(Gio.BusType.SESSION, None)
    address = session.call_sync('org.a11y.Bus', '/org/a11y/bus', 'org.a11y.Bus', 'GetAddress', None, None, 0, 3000, None).unpack()[0]
    bus = Gio.DBusConnection.new_for_address_sync(address, Gio.DBusConnectionFlags.AUTHENTICATION_CLIENT | Gio.DBusConnectionFlags.MESSAGE_BUS_CONNECTION, None, None)

    def call(node, interface, method, arguments=None):
        return bus.call_sync(node[0], node[1], interface, method, arguments, None, 0, 3000, None).unpack()

    def descend(node):
        yield node
        for child_node in call(node, 'org.a11y.atspi.Accessible', 'GetChildren')[0]:
            yield from descend(child_node)

    def name(node):
        return call(node, 'org.freedesktop.DBus.Properties', 'Get', GLib.Variant('(ss)', ('org.a11y.atspi.Accessible', 'Name')))[0]

    accessible = next(node for node in descend(('org.a11y.atspi.Registry', '/org/a11y/atspi/accessible/root')) if name(node) == 'Keep draft')
    actions = call(accessible, 'org.a11y.atspi.Action', 'GetActions')[0]
    print('AT_SPI ' + json.dumps({'name': name(accessible), 'role': call(accessible, 'org.a11y.atspi.Accessible', 'GetRoleName')[0], 'actions': actions}), flush=True)
    check(len(actions) > 0, 'AT-SPI exposes activation action')
    prior = count('press')
    check(call(accessible, 'org.a11y.atspi.Action', 'DoAction', GLib.Variant('(i)', (0,)))[0], 'AT-SPI activation accepted')
    wait_for(lambda e: e['kind'] == 'press' and e['detail'] in ['virtual', 'accessibility'], 'AT-SPI action reaches public Pressable')
    check(count('press') == prior + 1, 'AT-SPI activation delivered exactly once')
    xdo('windowfocus', window)
    current = [e['detail'] for e in events if e['kind'] == 'geometry'][-1]['motion']
    drag(current['x'] + 30, current['y'] + 30, 30, release=False)
    retired = wait_for(lambda e: e['kind'] == 'retired', 'active component cleanup', seconds=20)
    check(all(value is None for value in retired['detail'].values()), 'retirement clears native refs and handles')
    quiet = len(events)
    xdo('mouseup', 1)
    time.sleep(.15)
    check(len(events) == quiet, 'retired callbacks stay silent through OS pointer release')
    check(child.wait(timeout=3) == 0, 'native host exits cleanly')
    print('PACKED_GTK_COMPONENTS_OK', flush=True)
finally:
    xdo('mouseup', 1)
    if child.poll() is None:
        child.terminate()
        child.wait(timeout=3)
