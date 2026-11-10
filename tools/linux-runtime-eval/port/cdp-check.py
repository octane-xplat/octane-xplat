"""Debug the real renderer over CDP: break in widgetName, evaluate in its frame, CPU-profile updates, take a heap snapshot.

Usage: cdp-check.py <ns-linux> <bundle.js>  (run under xvfb-run + dbus-run-session; stdlib only)
"""
import base64, collections, json, os, socket, struct, subprocess, sys, time, urllib.request
from urllib.parse import urlparse

PORT = 19347
runtime, bundle = sys.argv[1:3]
lines = open(bundle).read().split('\n')
line = next(i for i, text in enumerate(lines) if text.startswith('function widgetName(')) + 1
proc = subprocess.Popen([runtime, f'--inspect-brk={PORT}', bundle], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)


def connect():
    for _ in range(100):
        try:
            return json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json/list', timeout=.5))[0]['webSocketDebuggerUrl']
        except Exception:
            time.sleep(.1)
    raise RuntimeError('inspector endpoint unavailable')


url = urlparse(connect())
sock = socket.create_connection((url.hostname, url.port), 5)
sock.sendall(f'GET {url.path} HTTP/1.1\r\nHost: {url.netloc}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {base64.b64encode(os.urandom(16)).decode()}\r\nSec-WebSocket-Version: 13\r\n\r\n'.encode())
head = b''
while b'\r\n\r\n' not in head:
    head += sock.recv(1)
assert b' 101 ' in head, head


def exact(n):
    out = b''
    while len(out) < n:
        chunk = sock.recv(n - len(out))
        if not chunk:
            raise RuntimeError('inspector closed')
        out += chunk
    return out


def receive():
    payload = b''
    while True:
        first, second = exact(2)
        length = second & 127
        if length == 126:
            length = struct.unpack('!H', exact(2))[0]
        elif length == 127:
            length = struct.unpack('!Q', exact(8))[0]
        payload += exact(length)
        if first & 0x80:
            return json.loads(payload)


ids = iter(range(1, 1 << 30))
events = collections.deque()


def send(method, **params):
    message_id = next(ids)
    data = json.dumps({'id': message_id, 'method': method, 'params': params}).encode()
    size = len(data)
    header = bytes([0x81]) + (bytes([0x80 | size]) if size < 126 else bytes([0xFE]) + struct.pack('!H', size) if size < 65536 else bytes([0xFF]) + struct.pack('!Q', size))
    mask = os.urandom(4)
    sock.sendall(header + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))
    while True:
        message = receive()
        if message.get('id') == message_id:
            if 'error' in message:
                raise RuntimeError(f'{method}: {message["error"]}')
            return message['result']
        events.append(message)


def event(name, timeout=20):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        while events:
            message = events.popleft()
            if message.get('method') == name:
                return message['params']
        events.append(receive())
    raise RuntimeError(f'no {name}')


def report(check, ok, detail):
    print(json.dumps({'check': check, 'pass': bool(ok), 'detail': detail}), flush=True)
    if not ok:
        raise SystemExit(1)


try:
    send('Runtime.enable')
    send('Debugger.enable')
    breakpoint = send('Debugger.setBreakpointByUrl', urlRegex=r'bench-native/app\.js$', lineNumber=line)
    send('Runtime.runIfWaitingForDebugger')
    paused = event('Debugger.paused')
    while paused['callFrames'][0]['functionName'] != 'widgetName':
        send('Debugger.resume')
        paused = event('Debugger.paused')
    frame = paused['callFrames'][0]
    value = send('Debugger.evaluateOnCallFrame', callFrameId=frame['callFrameId'], expression='node.type + "#" + (node.props.id ?? "")', returnByValue=True)['result'].get('value')
    report('breakpoint-in-renderer', frame['functionName'] == 'widgetName' and isinstance(value, str), {'function': frame['functionName'], 'line': frame['location']['lineNumber'] + 1, 'scopeValue': value})
    send('Debugger.removeBreakpoint', breakpointId=breakpoint['breakpointId'])
    send('Profiler.enable')
    send('Profiler.start')
    send('Debugger.resume')
    time.sleep(3)
    profile = send('Profiler.stop')['profile']
    nodes = {node['id']: node for node in profile['nodes']}
    interval = (profile['endTime'] - profile['startTime']) / max(len(profile['samples']), 1) / 1000
    selfMs = collections.Counter()
    for sample in profile['samples']:
        node = nodes[sample]['callFrame']
        selfMs[f"{node['functionName'] or '(anonymous)'}:{node['lineNumber'] + 1}"] += interval
    top = [[name, round(ms, 1)] for name, ms in selfMs.most_common(15)]
    names = {node['callFrame']['functionName'] for node in profile['nodes']}
    report('cpu-profile-renderer', {'setProp', 'invoke'} <= names, {'samples': len(profile['samples']), 'topSelfMs': top})
    send('HeapProfiler.enable')
    chunks = []
    message_id = next(ids)
    sock_payload = json.dumps({'id': message_id, 'method': 'HeapProfiler.takeHeapSnapshot', 'params': {'reportProgress': False}}).encode()
    mask = os.urandom(4)
    size = len(sock_payload)
    sock.sendall(bytes([0x81, 0x80 | size]) + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(sock_payload)))
    while True:
        message = receive()
        if message.get('method') == 'HeapProfiler.addHeapSnapshotChunk':
            chunks.append(message['params']['chunk'])
        elif message.get('id') == message_id:
            break
    snapshot = ''.join(chunks)
    report('heap-snapshot', snapshot.startswith('{"snapshot"') and len(snapshot) > 1_000_000, {'bytes': len(snapshot), 'hasGtkWrappers': '__native' in snapshot})
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
    print('RUNTIME_EXIT', proc.returncode, proc.stdout.read().decode(errors='replace')[-3000:], flush=True)
