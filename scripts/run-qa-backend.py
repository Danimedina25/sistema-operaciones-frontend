#!/usr/bin/env python3
"""Run the backend against the isolated local QA database."""

import os
import subprocess
import sys
from pathlib import Path


def load_local_secrets(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.removeprefix("export ").strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        values[name] = value
    return values


if len(sys.argv) != 2:
    raise SystemExit('Uso: python3 scripts/run-qa-backend.py "/ruta/al/backend"')

backend = Path(sys.argv[1]).expanduser().resolve()
if not (backend / "pom.xml").is_file() or not (backend / ".env.local").is_file():
    raise SystemExit("La ruta debe contener pom.xml y .env.local del backend.")

secrets = load_local_secrets(backend / ".env.local")
required = ("MYSQL_USER", "MYSQL_PASSWORD", "JWT_SECRET", "APP_CRYPTO_SECRET_KEY")
missing = [name for name in required if not secrets.get(name)]
if missing:
    raise SystemExit("Faltan variables locales: " + ", ".join(missing))

environment = os.environ.copy()
environment.update({name: secrets[name] for name in required})
environment.update({
    "SPRING_DATASOURCE_URL": (
        "jdbc:mysql://127.0.0.1:3306/db_sistema_operaciones_qa"
        "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
    ),
    "SPRING_JPA_HIBERNATE_DDL_AUTO": "validate",
    "SERVER_ADDRESS": "127.0.0.1",
    "SERVER_PORT": "8081",
    "APP_FRONTEND_LOCAL_ORIGIN": "http://127.0.0.1:5175",
    "JAVA_TOOL_OPTIONS": (
        os.environ.get("JAVA_TOOL_OPTIONS", "") + " -Duser.timezone=America/Mexico_City"
    ).strip(),
})

print("Backend QA: 127.0.0.1:8081 → db_sistema_operaciones_qa", flush=True)
raise SystemExit(subprocess.call(
    ["mvn", "-q", "-o", "spring-boot:run", "-Dspring-boot.run.profiles=local"],
    cwd=backend,
    env=environment,
))
