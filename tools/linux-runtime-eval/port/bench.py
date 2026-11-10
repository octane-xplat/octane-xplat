"""Run one benchmark process; time spawn-to-first-mount and sample its own RSS from /proc."""
import json
import subprocess
import sys
import time


def memory(pid):
    fields = {}
    with open(f'/proc/{pid}/status') as status:
        for line in status:
            name, _, value = line.partition(':')
            if name in ('VmRSS', 'VmHWM'):
                fields[name] = int(value.split()[0]) // 1024
    return fields


start = time.monotonic()
process = subprocess.Popen(sys.argv[1:], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
result = {}
for line in process.stdout:
    print(line, end='', flush=True)
    try:
        record = json.loads(line[line.index('{'):])
    except ValueError:
        continue
    if record.get('benchReady'):
        result['readyWallMs'] = round((time.monotonic() - start) * 1000)
        # Both clocks are CLOCK_MONOTONIC: spawn until the entry's first statement.
        result['loadMs'] = round(record['entryMonoMs'] - start * 1000)
        result['readyRssMiB'] = memory(process.pid)['VmRSS']
    elif record.get('benchSteady'):
        result['steadyRssMiB'] = memory(process.pid)['VmRSS']
    elif 'bench' in record:
        result.update(record['bench'])
        result['peakRssMiB'] = memory(process.pid)['VmHWM']
process.wait(timeout=10)
result['exit'] = process.returncode
print('BENCH_RESULT ' + json.dumps(result), flush=True)
sys.exit(0 if process.returncode == 0 and 'singleUpdateMedianMs' in result else 1)
