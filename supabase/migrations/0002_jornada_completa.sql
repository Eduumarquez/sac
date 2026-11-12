-- SAC: jornada completa (matrícula, personal, nutricionista)

alter type papel_equipe add value if not exists 'personal';
alter type papel_equipe add value if not exists 'nutricionista';

alter table equipe add column if not exists registro_profissional text; -- CREF / CRN

alter table planos
  add column if not exists inclui_personal boolean not null default false,
  add column if not exists inclui_nutricionista boolean not null default false,
  add column if not exists descricao text;

create type objetivo_aluno as enum ('emagrecimento', 'hipertrofia', 'condicionamento', 'saude', 'reabilitacao');

alter table alunos
  add column if not exists cpf text,
  add column if not exists objetivo objetivo_aluno,
  add column if not exists nutricionista_id uuid references equipe(id) on delete set null;

-- Anamnese (PAR-Q) feita na matrícula
create table anamneses (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  respostas jsonb not null default '{}',
  lesoes text,
  medicamentos text,
  observacoes text,
  precisa_atestado boolean not null default false,
  atestado_entregue_em timestamptz,
  criado_em timestamptz not null default now()
);

-- Treino passa a ter divisões (A, B, C...)
alter table exercicios_treino add column if not exists divisao text not null default 'A';
alter table exercicios_treino add column if not exists observacao text;

-- Avaliação física feita pelo personal
create table avaliacoes_fisicas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  personal_id uuid references equipe(id) on delete set null,
  feita_em timestamptz not null default now(),
  peso_kg numeric(5,2) not null,
  altura_cm numeric(5,1) not null,
  gordura_pct numeric(4,1),
  cintura_cm numeric(5,1),
  quadril_cm numeric(5,1),
  braco_cm numeric(5,1),
  coxa_cm numeric(5,1),
  observacoes text
);
create index on avaliacoes_fisicas (aluno_id, feita_em desc);

-- Plano alimentar da nutricionista
create table planos_alimentares (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  nutricionista_id uuid references equipe(id) on delete set null,
  meta_kcal integer not null,
  proteina_g integer,
  refeicoes jsonb not null default '[]', -- [{nome, horario, itens}]
  orientacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table consultas_nutricionais (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  nutricionista_id uuid references equipe(id) on delete set null,
  feita_em timestamptz not null default now(),
  peso_kg numeric(5,2),
  adesao smallint check (adesao between 1 and 5),
  anotacoes text,
  proximo_retorno date
);
create index on consultas_nutricionais (aluno_id, feita_em desc);

do $$
declare t text;
begin
  foreach t in array array['anamneses','avaliacoes_fisicas','planos_alimentares','consultas_nutricionais']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy equipe_da_academia on %I for all using (academia_id in (select minhas_academias())) with check (academia_id in (select minhas_academias()))',
      t);
  end loop;
end $$;

-- Aluno logado enxerga os próprios dados
create or replace function meu_aluno_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from alunos where usuario_id = auth.uid() limit 1
$$;

do $$
declare t text;
begin
  foreach t in array array['checkins','cobrancas','treinos','registros_carga','avaliacoes_fisicas','planos_alimentares','consultas_nutricionais']
  loop
    execute format('create policy aluno_ve_proprio on %I for select using (aluno_id = meu_aluno_id())', t);
  end loop;
end $$;

create policy aluno_registra_checkin on checkins for insert with check (aluno_id = meu_aluno_id());
create policy aluno_registra_carga on registros_carga for insert with check (aluno_id = meu_aluno_id());
create policy aluno_ve_cadastro on alunos for select using (id = meu_aluno_id());
