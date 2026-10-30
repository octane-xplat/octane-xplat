# Temporary files on shared hosts

Keep task-generated files under `~/agent-scratch/octane-xplat/<task>/` on each
host. On Windows, `~` means `%USERPROFILE%`. Everything in this tree must be
disposable: a human may delete a run, a task folder, or the whole tree. Deleting
an active run may interrupt it and require regeneration; it must not lose
implementation work or retained evidence.

## Choose a task and run folder

Use a readable task name plus its unique ID, then a dated folder for each run.
Keep uploads, helper scripts, archives, expanded packages, build outputs and
temporary logs together. For example:

```text
~/agent-scratch/octane-xplat/
  windows-core20-1640312b/
    README.md
    20261030-command-channel/
      scripts/
      build/
      packages/
      logs/
      tmp/
```

The task's `README.md` identifies the task and owner, the authoritative source
workspace, the location of retained results, and how to reproduce the run.
Start it with **Everything in this folder is disposable.** An activity label
is informational; it does not change that promise.

For a Windows run, derive paths from the signed-in user's profile:

```powershell
$taskRoot = Join-Path $env:USERPROFILE 'agent-scratch/octane-xplat/windows-core20-1640312b'
$runRoot = Join-Path $taskRoot '20261030-command-channel'
New-Item -ItemType Directory -Force -Path "$runRoot/scripts", "$runRoot/tmp" | Out-Null
# Use the current task's name/ID and a new run name for your own work.
$env:TEMP = Join-Path $runRoot 'tmp'
$env:TMP = $env:TEMP
```

These environment changes affect the current process and its children. Do not
change the machine-wide temporary directory. Pass explicit scratch paths to
upload, packaging and test commands instead of scattering files under `~/dev`,
the home directory, or a system temporary directory.

## Keep valuable work outside scratch

- Keep authoritative source workspaces and registered Git worktrees outside
  scratch. A disposable build clone or source copy may live inside it only
  when implementation changes already exist in an authoritative workspace or
  commit elsewhere. Prefer an independent clone or archive; deleting scratch
  must not leave an external Git worktree registration behind.
- One-off diagnostic scripts and probes may be disposable. Promote anything
  that must survive into the repository before relying on it.
- Copy evidence worth retaining outside scratch before citing it in an issue,
  Silo row or progress note. Retain the source identity, artifact hashes,
  commands, results and relevant raw logs. Scratch paths alone are not durable
  evidence references.
- Keep credentials, signing keys, original user data, shared SDKs and shared
  dependency caches outside this tree. Use the owning tool to clean caches or
  installed test apps; do not relabel them as scratch.

## Finish and recover a run

Agents clean their own run folders after collecting the results they need.
Stop owned processes and release device/build reservations first. Do not keep
large compiler intermediates or duplicate expanded packages after their run.
Before starting another large run, check available disk space and remove the
task's unused outputs.

If a human deletes scratch during a run, report the interruption and recreate
the disposable inputs. Do not require them to inspect manifests, infer safety
from file extensions, or reconstruct which files an agent still needs.

For older folders outside this convention, inventory them before migration.
Move only verified disposable copies; preserve uncommitted source, credentials
and required evidence. Record old-to-new paths and update active scripts.
Do not classify an existing folder as disposable just because an agent created
it or its name looks temporary.
