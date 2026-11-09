"""Run one slice and inject XTest events from its ready record; never capture pixels."""
import ctypes as C
import json
import os
import queue
import subprocess
import sys
import threading
import time

x = C.CDLL('libX11.so.6')
xt = C.CDLL('libXtst.so.6')
x.XOpenDisplay.restype = C.c_void_p
x.XDefaultRootWindow.argtypes = [C.c_void_p]
x.XDefaultRootWindow.restype = C.c_ulong
x.XQueryTree.argtypes = [C.c_void_p,C.c_ulong,C.POINTER(C.c_ulong),C.POINTER(C.c_ulong),C.POINTER(C.POINTER(C.c_ulong)),C.POINTER(C.c_uint)]
x.XFetchName.argtypes = [C.c_void_p,C.c_ulong,C.POINTER(C.c_void_p)]
x.XTranslateCoordinates.argtypes = [C.c_void_p,C.c_ulong,C.c_ulong,C.c_int,C.c_int,C.POINTER(C.c_int),C.POINTER(C.c_int),C.POINTER(C.c_ulong)]
x.XFree.argtypes = [C.c_void_p]
x.XFlush.argtypes = [C.c_void_p]
x.XCloseDisplay.argtypes = [C.c_void_p]
x.XKeysymToKeycode.argtypes = [C.c_void_p,C.c_ulong]
xt.XTestFakeMotionEvent.argtypes = [C.c_void_p,C.c_int,C.c_int,C.c_int,C.c_ulong]
xt.XTestFakeButtonEvent.argtypes = [C.c_void_p,C.c_uint,C.c_int,C.c_ulong]
xt.XTestFakeKeyEvent.argtypes = [C.c_void_p,C.c_uint,C.c_int,C.c_ulong]
display = x.XOpenDisplay(None)
if not display:
    raise RuntimeError('no X display')
root = x.XDefaultRootWindow(display)

def window():
    rr, parent, children, n = C.c_ulong(), C.c_ulong(), C.POINTER(C.c_ulong)(), C.c_uint()
    x.XQueryTree(display,root,C.byref(rr),C.byref(parent),C.byref(children),C.byref(n))
    result = None
    for i in range(n.value):
        name = C.c_void_p()
        if x.XFetchName(display,children[i],C.byref(name)) and name.value:
            title = C.string_at(name).decode(errors='replace')
            x.XFree(name)
            if title == 'Octane runtime evaluation': result = children[i]
    if children: x.XFree(children)
    if result is None: raise RuntimeError('probe window missing')
    return result

def inject(record):
    win = window()
    ox,oy,child = C.c_int(),C.c_int(),C.c_ulong()
    x.XTranslateCoordinates(display,win,root,0,0,C.byref(ox),C.byref(oy),C.byref(child))
    frames = {f['id']: f for f in record['frames']}
    layout = frames['layout']
    def click(name):
        f = frames[name]
        xt.XTestFakeMotionEvent(display,-1,ox.value+layout['x']+f['x']+f['width']//2,oy.value+layout['y']+f['y']+f['height']//2,0)
        xt.XTestFakeButtonEvent(display,1,1,0)
        xt.XTestFakeButtonEvent(display,1,0,0)
        x.XFlush(display)
    click('increment')
    time.sleep(.08)
    click('entry')
    for char in 'abc':
        code = x.XKeysymToKeycode(display,ord(char))
        xt.XTestFakeKeyEvent(display,code,1,0)
        xt.XTestFakeKeyEvent(display,code,0,0)
        x.XFlush(display)
        time.sleep(.05)
    print(json.dumps({'inputClass':'os','mechanism':'XTest','keys':'abc','click':'increment'}),flush=True)

process = subprocess.Popen(sys.argv[1:],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
lines = queue.Queue()
def read():
    for line in process.stdout: lines.put(line)
    lines.put(None)
threading.Thread(target=read,daemon=True).start()
complete = False
diagnostic = False
start = time.monotonic()
try:
    while time.monotonic()-start < 30:
        try: line = lines.get(timeout=.2)
        except queue.Empty:
            if process.poll() is not None: break
            continue
        if line is None: break
        print(line,end='',flush=True)
        if any(marker in line for marker in ['Gtk-WARNING', 'Gtk-CRITICAL', 'Gjs-CRITICAL', 'Gjs-Console-CRITICAL']): diagnostic = True
        try: record = json.loads(line[line.index('{'):])
        except ValueError: continue
        if record.get('ready'): inject(record)
        if record.get('complete'): complete=True
    if process.poll() is None:
        process.terminate()
        try: process.wait(timeout=2)
        except subprocess.TimeoutExpired: process.kill();process.wait()
    print(json.dumps({'exit':process.returncode,'complete':complete,'wallMs':round((time.monotonic()-start)*1000)}),flush=True)
    if process.returncode != 0 or not complete or diagnostic: sys.exit(1)
finally:
    if process.poll() is None: process.kill();process.wait()
    x.XCloseDisplay(display)
