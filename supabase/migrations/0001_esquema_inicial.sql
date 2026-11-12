-- SAC: esquema inicial
-- Multi-academia: cada registro pertence a uma academia (tenant).

create extension if not exists "pgcrypto";

create table academias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  criado_em timestamptz not null default now()
);

-- Usuários da equipe (dono, professor, recepção) ligados ao auth.users do Supabase
create type papel_equipe as enum ('dono', 'professor', 'recepcao');

create table equipe (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  papel papel_equipe not null,
  telefone text,
  unique (academia_id, usuario_id)
);

create table planos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  nome text not null,
  valor_centavos integer not null check (valor_centavos >= 0),
  periodicidade_meses integer not null default 1 check (periodicidade_meses > 0),
  ativo boolean not null default true
);

create type origem_aluno as enum ('direto', 'wellhub', 'totalpass', 'outro');
create type status_aluno as enum ('ativo', 'pausado', 'cancelado');

create table alunos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  nome text not null,
  telefone text,
  email text,
  data_nascimento date,
  origem origem_aluno not null default 'direto',
  status status_aluno not null default 'ativo',
  plano_id uuid references planos(id) on delete set null,
  professor_id uuid references equipe(id) on delete set null,
  matriculado_em date not null default current_date,
  cancelado_em date,
  -- LGPD: consentimento explícito para dados de saúde (medidas, evolução)
  consentimento_saude_em timestamptz,
  criado_em timestamptz not null default now()
);
create index on alunos (academia_id, status);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  feito_em timestamptz not null default now(),
  metodo text not null default 'qrcode'
);
create index on checkins (aluno_id, feito_em desc);

create type status_cobranca as enum ('pendente', 'pago', 'atrasado', 'cancelado');

create table cobrancas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  valor_centavos integer not null,
  vencimento date not null,
  status status_cobranca not null default 'pendente',
  pago_em timestamptz,
  gateway text,              -- ex.: 'asaas'
  gateway_id text,           -- id da cobrança no gateway
  criado_em timestamptz not null default now()
);
create index on cobrancas (aluno_id, vencimento desc);

create table treinos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  professor_id uuid references equipe(id) on delete set null,
  nome text not null,
  criado_em timestamptz not null default now(),
  ativo boolean not null default true
);

create table exercicios_treino (
  id uuid primary key default gen_random_uuid(),
  treino_id uuid not null references treinos(id) on delete cascade,
  ordem integer not null,
  exercicio text not null,
  series integer,
  repeticoes text,
  carga_kg numeric(6,2)
);

-- Registro de carga feito pelo aluno (base do placar de evolução)
create table registros_carga (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  exercicio text not null,
  carga_kg numeric(6,2) not null,
  repeticoes integer,
  feito_em timestamptz not null default now()
);

-- Ações de retenção: quem foi contatado e o que aconteceu
create type resultado_contato as enum ('pendente', 'respondeu', 'voltou', 'sem_resposta', 'cancelou');

create table contatos_retencao (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  responsavel_id uuid references equipe(id) on delete set null,
  pontuacao_risco integer not null,
  motivos text[] not null default '{}',
  mensagem_sugerida text,
  contatado_em timestamptz,
  resultado resultado_contato not null default 'pendente',
  criado_em timestamptz not null default now()
);

-- Segurança por linha: cada membro da equipe só enxerga a própria academia
create or replace function minhas_academias() returns setof uuid
language sql stable security definer set search_path = public as $$
  select academia_id from equipe where usuario_id = auth.uid()
$$;

do $$
declare t text;
begin
  foreach t in array array['planos','alunos','checkins','cobrancas','treinos','registros_carga','contatos_retencao']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy equipe_da_academia on %I for all using (academia_id in (select minhas_academias())) with check (academia_id in (select minhas_academias()))',
      t);
  end loop;
end $$;

alter table academias enable row level security;
create policy equipe_ve_academia on academias for select using (id in (select minhas_academias()));

alter table equipe enable row level security;
create policy equipe_ve_equipe on equipe for select using (academia_id in (select minhas_academias()));

alter table exercicios_treino enable row level security;
create policy equipe_exercicios on exercicios_treino for all
  using (treino_id in (select id from treinos where academia_id in (select minhas_academias())));
