#!/usr/bin/env python3
"""Run the backend against the local tutorial database (fictitious data only)."""

import os
import subprocess
import sys
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit('Uso: python3 tutoriales/scripts/run-backend.py "/ruta/al/backend"')

backend = Path(sys.argv[1]).expanduser().resolve()
secrets: dict[str, str] = {}
for line in (backend / ".env.local").read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        name, value = line.split("=", 1)
        secrets[name.removeprefix("export ").strip()] = value.strip().strip("'\"")

required = ("MYSQL_USER", "MYSQL_PASSWORD", "JWT_SECRET", "APP_CRYPTO_SECRET_KEY")
environment = os.environ.copy()
environment.update({name: secrets[name] for name in required})
environment.update({
    "SPRING_DATASOURCE_URL": (
        "jdbc:mysql://127.0.0.1:3306/db_sistema_operaciones_tutorial"
        "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
    ),
    "SPRING_JPA_HIBERNATE_DDL_AUTO": "validate",
    "SERVER_ADDRESS": "127.0.0.1",
    "SERVER_PORT": "8081",
    "APP_FRONTEND_LOCAL_ORIGIN": "http://127.0.0.1:5175",
    # Acepta comprobantes del Storage Emulator local (http://127.0.0.1:9199). Solo para tutoriales.
    "APP_STORAGE_ALLOW_EMULATOR": "true",
    "JAVA_TOOL_OPTIONS": (
        os.environ.get("JAVA_TOOL_OPTIONS", "") + " -Duser.timezone=America/Mexico_City"
    ).strip(),
})

print("Backend tutoriales: 127.0.0.1:8081 → db_sistema_operaciones_tutorial", flush=True)
raise SystemExit(subprocess.call(
    ["mvn", "-q", "-o", "spring-boot:run", "-Dspring-boot.run.profiles=local"],
    cwd=backend,
    env=environment,
))
