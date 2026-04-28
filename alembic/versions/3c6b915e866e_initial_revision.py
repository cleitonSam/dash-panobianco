"""Initial revision

Revision ID: 3c6b915e866e
Revises:
Create Date: 2026-03-14 11:51:49.373447

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3c6b915e866e'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS empresas (
            id            SERIAL PRIMARY KEY,
            uuid          VARCHAR(36) UNIQUE NOT NULL,
            nome          VARCHAR(255) NOT NULL,
            nome_fantasia VARCHAR(255),
            cnpj          VARCHAR(20) UNIQUE,
            email         VARCHAR(255),
            telefone      VARCHAR(50),
            website       VARCHAR(255),
            plano         VARCHAR(50) DEFAULT 'free',
            status        VARCHAR(50) DEFAULT 'active',
            config        JSONB,
            created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS unidades (
            id                SERIAL PRIMARY KEY,
            uuid              VARCHAR(36) UNIQUE NOT NULL,
            empresa_id        INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            slug              VARCHAR(100) NOT NULL,
            nome              VARCHAR(255) NOT NULL,
            nome_abreviado    VARCHAR(50),
            cidade            VARCHAR(100),
            bairro            VARCHAR(100),
            estado            VARCHAR(2),
            endereco          VARCHAR(255),
            numero            VARCHAR(20),
            telefone_principal VARCHAR(50),
            whatsapp          VARCHAR(50),
            site              VARCHAR(255),
            instagram         VARCHAR(255),
            link_matricula    TEXT,
            horarios          JSONB,
            modalidades       JSONB,
            planos            JSONB,
            formas_pagamento  JSONB,
            convenios         JSONB,
            infraestrutura    JSONB,
            servicos          JSONB,
            palavras_chave    TEXT[],
            foto_grade        TEXT,
            link_tour_virtual TEXT,
            latitude          FLOAT,
            longitude         FLOAT,
            ativa             BOOLEAN DEFAULT true,
            ordem_exibicao    INTEGER DEFAULT 0,
            created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_unidades_empresa_slug ON unidades(empresa_id, slug)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS conversas (
            id                      SERIAL PRIMARY KEY,
            conversation_id         INTEGER NOT NULL,
            empresa_id              INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            account_id              INTEGER,
            contato_id              INTEGER,
            contato_nome            VARCHAR(255),
            contato_telefone        VARCHAR(50),
            canal                   VARCHAR(100) DEFAULT 'WhatsApp',
            primeira_mensagem       TIMESTAMP WITH TIME ZONE,
            ultima_mensagem         TIMESTAMP WITH TIME ZONE,
            primeira_resposta_em    TIMESTAMP WITH TIME ZONE,
            status                  VARCHAR(50) DEFAULT 'ativa',
            total_mensagens_cliente INTEGER DEFAULT 0,
            total_mensagens_ia      INTEGER DEFAULT 0,
            resumo_ia               TEXT,
            lead_qualificado        BOOLEAN DEFAULT false,
            encerrada_em            TIMESTAMP WITH TIME ZONE,
            created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_conversas_empresa_status ON conversas(empresa_id, status)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS mensagens (
            id          SERIAL PRIMARY KEY,
            conversa_id INTEGER NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
            empresa_id  INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            role        VARCHAR(50) NOT NULL,
            tipo        VARCHAR(50) DEFAULT 'texto',
            conteudo    TEXT,
            url_midia   TEXT,
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_mensagens_conversa ON mensagens(conversa_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_mensagens_empresa ON mensagens(empresa_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id         SERIAL PRIMARY KEY,
            nome       VARCHAR(255) NOT NULL,
            email      VARCHAR(255) UNIQUE NOT NULL,
            senha_hash VARCHAR(255),
            empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            perfil     VARCHAR(50) DEFAULT 'atendente',
            ativo      BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_usuarios_empresa ON usuarios(empresa_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS integracoes (
            id         SERIAL PRIMARY KEY,
            empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            tipo       VARCHAR(50) NOT NULL,
            config     JSONB NOT NULL DEFAULT '{}',
            ativo      BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(empresa_id, tipo)
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS personalidade_ia (
            id               SERIAL PRIMARY KEY,
            empresa_id       INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            nome_ia          VARCHAR(255),
            personalidade    TEXT,
            instrucoes_base  TEXT,
            tom_voz          VARCHAR(100),
            idioma           VARCHAR(20) DEFAULT 'pt-BR',
            modelo_preferido VARCHAR(100) DEFAULT 'openai/gpt-4o-mini',
            temperatura      NUMERIC(3,2) DEFAULT 0.7,
            max_tokens       INTEGER DEFAULT 1000,
            ativo            BOOLEAN DEFAULT false,
            objetivos_venda  TEXT,
            metas_comerciais TEXT,
            script_vendas    TEXT,
            scripts_objecoes TEXT,
            frases_fechamento TEXT,
            diferenciais     TEXT,
            posicionamento   TEXT,
            publico_alvo     TEXT,
            restricoes       TEXT,
            linguagem_proibida TEXT,
            contexto_empresa TEXT,
            contexto_extra   TEXT,
            abordagem_proativa TEXT,
            exemplos         TEXT,
            palavras_proibidas TEXT,
            despedida_personalizada TEXT,
            regras_formatacao TEXT,
            regras_seguranca TEXT,
            fluxo_triagem    JSONB,
            created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS planos (
            id                  SERIAL PRIMARY KEY,
            empresa_id          INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            id_externo          VARCHAR(100),
            nome                VARCHAR(255) NOT NULL,
            valor               NUMERIC(10,2) DEFAULT 0.00,
            valor_promocional   NUMERIC(10,2),
            meses_promocionais  INTEGER,
            descricao           TEXT,
            diferenciais        TEXT[],
            link_venda          TEXT,
            ativo               BOOLEAN DEFAULT true,
            ordem               INTEGER DEFAULT 0,
            created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_planos_empresa ON planos(empresa_id, ativo)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS templates_followup (
            id            SERIAL PRIMARY KEY,
            empresa_id    INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            mensagem      TEXT NOT NULL,
            delay_minutos INTEGER DEFAULT 60,
            tipo          VARCHAR(50) DEFAULT 'auto',
            ordem         INTEGER DEFAULT 0,
            ativo         BOOLEAN DEFAULT true,
            created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_templates_followup_empresa ON templates_followup(empresa_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS followups (
            id              SERIAL PRIMARY KEY,
            conversa_id     INTEGER REFERENCES conversas(id) ON DELETE CASCADE,
            conversation_id INTEGER,
            account_id      INTEGER,
            empresa_id      INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            unidade_id      INTEGER REFERENCES unidades(id) ON DELETE SET NULL,
            template_id     INTEGER REFERENCES templates_followup(id) ON DELETE SET NULL,
            tipo            VARCHAR(50) DEFAULT 'auto',
            mensagem        TEXT,
            ordem           INTEGER DEFAULT 0,
            agendado_para   TIMESTAMP WITHOUT TIME ZONE,
            status          VARCHAR(50) DEFAULT 'pendente',
            enviado_em      TIMESTAMP WITHOUT TIME ZONE,
            updated_at      TIMESTAMP WITHOUT TIME ZONE,
            created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_followups_empresa ON followups(empresa_id, status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_followups_conversa ON followups(conversa_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS faq (
            id         SERIAL PRIMARY KEY,
            empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
            unidade_id INTEGER REFERENCES unidades(id) ON DELETE SET NULL,
            pergunta   TEXT NOT NULL,
            resposta   TEXT NOT NULL,
            ativo      BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_faq_empresa ON faq(empresa_id, ativo)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS faq CASCADE")
    op.execute("DROP TABLE IF EXISTS followups CASCADE")
    op.execute("DROP TABLE IF EXISTS templates_followup CASCADE")
    op.execute("DROP TABLE IF EXISTS planos CASCADE")
    op.execute("DROP TABLE IF EXISTS personalidade_ia CASCADE")
    op.execute("DROP TABLE IF EXISTS integracoes CASCADE")
    op.execute("DROP TABLE IF EXISTS usuarios CASCADE")
    op.execute("DROP TABLE IF EXISTS mensagens CASCADE")
    op.execute("DROP TABLE IF EXISTS conversas CASCADE")
    op.execute("DROP TABLE IF EXISTS unidades CASCADE")
    op.execute("DROP TABLE IF EXISTS empresas CASCADE")
