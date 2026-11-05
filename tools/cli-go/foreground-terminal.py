"""Drive an isolated controlling terminal; no desktop or visual evidence."""
import errno,json,os,pty,re,select,signal,subprocess,sys,termios,time
binary,mode=sys.argv[1:]
pid,terminal=pty.fork()
if pid==0:
    before=termios.tcgetattr(0)
    child=subprocess.Popen([binary,'lint'])
    print('NATIVE_PID:'+str(child.pid),flush=True)
    code=child.wait()
    restored=os.tcgetpgrp(0)==os.getpgrp()
    print('RESTORED:'+str(restored),flush=True)
    if restored:
        # BSD sets the transient PENDIN driver-state bit when returning from
        # raw to canonical input. Process the next line, then compare every
        # setting without masking flags or accepting a raw-mode difference.
        print('FOLLOWUP:'+sys.stdin.readline().strip(),flush=True)
    after=termios.tcgetattr(0)
    modes_restored=after==before
    if not modes_restored:print("TERMIOS_DIFF:"+repr([(i,before[i],after[i])for i in range(len(before))if before[i]!=after[i]]),flush=True)
    print('MODES_RESTORED:'+str(modes_restored),flush=True)
    os._exit(code if code>=0 else 128-code)
output=bytearray();sent=False;followup=False;finished=False;deadline=time.monotonic()+20
try:
    while time.monotonic()<deadline:
        if select.select([terminal],[],[],0.03)[0]:
            try:output.extend(os.read(terminal,8192))
            except OSError as error:
                if error.errno!=errno.EIO:raise
        if not sent and b'INPUT_READY' in output:
            sent=True
            if mode=='raw-cancel':
                child_pid=int(re.search(rb'NATIVE_PID:(\d+)',output).group(1));os.kill(child_pid,signal.SIGTERM)
            else:os.write(terminal,b'\x03' if mode.startswith('interrupt') else 'answer π😀\n'.encode())
        if not followup and b'RESTORED:True' in output:
            followup=True;os.write(terminal,b'followup\n')
        done,status=os.waitpid(pid,os.WNOHANG)
        if done:
            finished=True
            while select.select([terminal],[],[],0)[0]:
                try:
                    chunk=os.read(terminal,8192)
                    if not chunk:break
                    output.extend(chunk)
                except OSError as error:
                    if error.errno!=errno.EIO:raise
                    break
            print(json.dumps({'code':os.waitstatus_to_exitcode(status),'promptObserved':sent,'restored':followup,'modesRestored':b'MODES_RESTORED:True' in output,'output':output.decode('utf8',errors='replace')}))
            break
    else:raise RuntimeError('foreground terminal deadline exceeded')
finally:
    if not finished:
        group=os.tcgetpgrp(terminal)
        if group>0 and group!=pid:
            try:os.killpg(group,signal.SIGKILL)
            except ProcessLookupError:pass
        try:os.killpg(pid,signal.SIGKILL)
        except ProcessLookupError:pass
        os.waitpid(pid,0)
    os.close(terminal)
