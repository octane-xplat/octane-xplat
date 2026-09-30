import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = str(Path(__file__).with_name("with-native-target-lock.py"))

class NativeTargetLockTest(unittest.TestCase):
    def test_conflict_release_and_independent_target(self):
        with tempfile.TemporaryDirectory() as directory:
            env = {**os.environ, "XPLAT_NATIVE_LOCK_DIR": directory}
            holder = subprocess.Popen([sys.executable, SCRIPT, "ios", sys.executable,
                                       "-c", "import time; time.sleep(30)"],
                                      env=env, stderr=subprocess.PIPE, text=True,
                                      start_new_session=True)
            try:
                self.assertIn("Holding native target lock:", holder.stderr.readline())
                command = [sys.executable, SCRIPT, "ios", sys.executable, "-c", "pass"]
                conflict = subprocess.run(command, env=env, capture_output=True, text=True)
                self.assertNotEqual(conflict.returncode, 0)
                self.assertIn("Native target is busy", conflict.stderr)
                independent = subprocess.run([sys.executable, SCRIPT, "android", sys.executable,
                                              "-c", "pass"], env=env, capture_output=True)
                self.assertEqual(independent.returncode, 0)
            finally:
                import signal
                os.killpg(holder.pid, signal.SIGTERM)
                holder.wait(timeout=5)
                holder.stderr.close()
            released = subprocess.run(command, env=env, capture_output=True)
            self.assertEqual(released.returncode, 0)

if __name__ == "__main__":
    unittest.main()
