#!/usr/bin/env python3
"""Run the isolated Storage emulator with persistent local QA data."""

import os
import subprocess
from pathlib import Path


root = Path(__file__).resolve().parent.parent
data = root / ".qa-local" / "firebase-data"
data.mkdir(parents=True, exist_ok=True)

environment = os.environ.copy()
java_home = Path("/opt/homebrew/opt/openjdk")
if java_home.is_dir():
    environment["JAVA_HOME"] = str(java_home)
    environment["PATH"] = str(java_home / "bin") + os.pathsep + environment["PATH"]
environment.setdefault("npm_config_cache", "/private/tmp/sdo-qa-npm-cache")

command = [
    "npx", "--yes", "firebase-tools", "emulators:start", "--only", "storage",
    "--project", "demo-sistema-operaciones-qa", "--config", "firebase.qa.json",
]
if (data / "firebase-export-metadata.json").is_file():
    command.extend(["--import", str(data)])
command.extend(["--export-on-exit", str(data)])

print("Storage QA: 127.0.0.1:9199, datos en .qa-local/firebase-data", flush=True)
process = subprocess.Popen(command, cwd=root, env=environment)
try:
    raise SystemExit(process.wait())
except KeyboardInterrupt:
    # La CLI recibe Ctrl-C al mismo tiempo y necesita terminar su exportación.
    raise SystemExit(process.wait(timeout=30))
