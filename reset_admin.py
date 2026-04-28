"""
Script para recriar o usuário admin da Enotel com senha correta (bcrypt).
Execute no terminal do container bot:
  python3 reset_admin.py
"""
import asyncio
import os
import urllib.parse

import asyncpg
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

EMAIL = "admin@enotel.com"
SENHA = "enotel2026"
NOME  = "Admin Enotel"
PERFIL = "admin_master"
EMPRESA_ID = 1


def build_dsn():
    raw = os.getenv("DATABASE_URL", "")
    if not raw:
        raise RuntimeError("DATABASE_URL não definida")
    if raw.startswith("postgres://"):
        raw = raw.replace("postgres://", "postgresql://", 1)
    # asyncpg não gosta de parâmetros de query no DSN; removemos sslmode se presente
    if "?" in raw:
        raw = raw.split("?")[0]
    return raw


async def main():
    dsn = build_dsn()
    print(f"Conectando ao banco...")
    conn = await asyncpg.connect(dsn)

    # Verifica se a empresa existe
    empresa = await conn.fetchrow("SELECT id, nome FROM empresas WHERE id = $1", EMPRESA_ID)
    if not empresa:
        print(f"❌ Empresa id={EMPRESA_ID} não encontrada. Criando...")
        import uuid
        await conn.execute(
            """
            INSERT INTO empresas (uuid, nome, nome_fantasia, plano, status, created_at)
            VALUES ($1, 'Enotel', 'Enotel Resort', 'pro', 'active', NOW())
            """,
            str(uuid.uuid4()),
        )
        print("✅ Empresa Enotel criada (id=1)")
    else:
        print(f"✅ Empresa encontrada: {empresa['nome']}")

    # Gera hash correto
    senha_hash = pwd_context.hash(SENHA)
    print(f"Hash gerado: {senha_hash[:30]}...")

    # Verifica se usuário já existe
    user = await conn.fetchrow("SELECT id FROM usuarios WHERE email = $1", EMAIL)
    if user:
        await conn.execute(
            "UPDATE usuarios SET senha_hash = $1, perfil = $2, ativo = true WHERE email = $3",
            senha_hash, PERFIL, EMAIL,
        )
        print(f"✅ Senha do usuário '{EMAIL}' atualizada com sucesso!")
    else:
        await conn.execute(
            """
            INSERT INTO usuarios (nome, email, senha_hash, perfil, empresa_id, ativo, created_at)
            VALUES ($1, $2, $3, $4, $5, true, NOW())
            """,
            NOME, EMAIL, senha_hash, PERFIL, EMPRESA_ID,
        )
        print(f"✅ Usuário '{EMAIL}' criado com sucesso!")

    await conn.close()
    print(f"\n🔑 Login: {EMAIL}")
    print(f"🔑 Senha: {SENHA}")
    print("✅ Tudo certo! Tente fazer login agora.")


if __name__ == "__main__":
    asyncio.run(main())
