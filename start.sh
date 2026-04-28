#!/bin/sh
set -e

echo "=== PANOBIANCO IA STARTUP ==="
echo "REDIS_URL: $REDIS_URL"
echo "DATABASE_URL: $DATABASE_URL"
echo "JWT_SECRET_KEY: $([ -n "$JWT_SECRET_KEY" ] && echo SET || echo NOT_SET)"

echo ""
echo "=== TESTANDO CONEXOES ==="
python3 -c "
import socket, sys, os
from urllib.parse import urlparse

# Testa Redis
redis_url = os.environ.get('REDIS_URL', '')
if not redis_url:
    print('Redis TCP: PULADO (REDIS_URL nao definida)')
else:
    parsed = urlparse(redis_url)
    host = parsed.hostname or 'localhost'
    port = parsed.port or 6379
    try:
        s = socket.create_connection((host, port), timeout=5)
        s.close()
        print(f'Redis TCP: OK ({host}:{port})')
    except Exception as e:
        print(f'Redis TCP: FALHOU - {e}')
        sys.exit(1)

# Testa PostgreSQL
db_url = os.environ.get('DATABASE_URL', '')
if not db_url:
    print('PostgreSQL TCP: PULADO (DATABASE_URL nao definida)')
else:
    parsed = urlparse(db_url)
    host = parsed.hostname or 'localhost'
    port = parsed.port or 5432
    try:
        s = socket.create_connection((host, port), timeout=5)
        s.close()
        print(f'PostgreSQL TCP: OK ({host}:{port})')
    except Exception as e:
        print(f'PostgreSQL TCP: FALHOU - {e}')
        sys.exit(1)
"

echo ""
echo "=== ALEMBIC ==="
alembic upgrade heads 2>&1

echo ""
echo "=== INICIANDO UVICORN ==="
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info
