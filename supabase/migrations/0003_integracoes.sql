-- SAC: integrações da pesquisa de mercado
-- recados da equipe, avaliação do treino, metas, agenda, cancelamento salvo,
-- acesso (catraca/QR), agregadores e régua de cobrança.

alter table planos add column if not exists agregador text check (agregador in ('wellhub', 'totalpass'));
alter table alunos add column if not exists pausado_ate date;

-- Recados entre academia, personal e nutricionista
create table notas_equipe (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  autor_id uuid references equipe(id) on delete set null, -- null = escrito pelo aluno
  texto text not null,
  criado_em timestamptz not null default now()
);
create index on notas_equipe (aluno_id, criado_em desc);

-- Como o aluno se sentiu no treino (1 a 5)
create table feedbacks_treino (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  divisao text not null,
  sensacao smallint not null check (sensacao between 1 and 5),
  comentario text,
  criado_em timestamptz not null default now()
);
create index on feedbacks_treino (aluno_id, criado_em desc);

-- Meta única compartilhada por personal e nutricionista
create table metas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null unique references alunos(id) on delete cascade,
  tipo text not null check (tipo in ('peso', 'gordura')),
  inicial numeric(6,2) not null,
  alvo numeric(6,2) not null,
  prazo date not null,
  criada_por uuid references equipe(id) on delete set null,
  criada_em timestamptz not null default now()
);

-- Pedido de cancelamento e o que foi oferecido
create table pedidos_cancelamento (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  motivo text not null check (motivo in ('preco', 'tempo', 'resultado', 'mudanca', 'saude', 'outro')),
  origem text not null check (origem in ('recepcao', 'app')),
  resultado text not null check (resultado in ('pausou', 'trocou_plano', 'treino_curto', 'cancelou')),
  detalhe text,
  valor_mensal_centavos integer not null,
  criado_em timestamptz not null default now()
);
create index on pedidos_cancelamento (academia_id, criado_em desc);

-- Agenda: aulas coletivas e atendimentos individuais
create table aulas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  nome text not null,
  inicio timestamptz not null,
  duracao_min smallint not null default 50,
  profissional_id uuid references equipe(id) on delete set null,
  vagas smallint not null
);
create index on aulas (academia_id, inicio);

create table reservas_aula (
  aula_id uuid not null references aulas(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  academia_id uuid not null references academias(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (aula_id, aluno_id)
);

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  profissional_id uuid not null references equipe(id) on delete cascade,
  tipo text not null check (tipo in ('avaliacao', 'consulta')),
  inicio timestamptz not null,
  status text not null default 'marcado' check (status in ('marcado', 'feito', 'faltou'))
);
create index on agendamentos (profissional_id, inicio);

-- Tentativas de entrada (catraca / QR / agregadores)
create table acessos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  aluno_id uuid not null references alunos(id) on delete cascade,
  via text not null check (via in ('app', 'qr', 'wellhub', 'totalpass')),
  liberado boolean not null,
  motivo text,
  criado_em timestamptz not null default now()
);
create index on acessos (academia_id, criado_em desc);

-- Régua de cobrança: um lembrete por etapa e cobrança
create table lembretes_cobranca (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references academias(id) on delete cascade,
  cobranca_id uuid not null references cobrancas(id) on delete cascade,
  etapa text not null check (etapa in ('antes', 'no_dia', '3_dias', '7_dias')),
  enviado_em timestamptz not null default now(),
  unique (cobranca_id, etapa)
);

do $$
declare t text;
begin
  foreach t in array array['notas_equipe','feedbacks_treino','metas','pedidos_cancelamento','aulas','reservas_aula','agendamentos','acessos','lembretes_cobranca']
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy equipe_da_academia on %I for all using (academia_id in (select minhas_academias())) with check (academia_id in (select minhas_academias()))',
      t);
  end loop;
end $$;

-- O aluno vê e registra o que é dele pelo app
create policy aluno_ve_proprio on feedbacks_treino for select using (aluno_id = meu_aluno_id());
create policy aluno_avalia_treino on feedbacks_treino for insert with check (aluno_id = meu_aluno_id());
create policy aluno_ve_meta on metas for select using (aluno_id = meu_aluno_id());
create policy aluno_ve_agendamentos on agendamentos for select using (aluno_id = meu_aluno_id());
create policy aluno_ve_aulas on aulas for select using (academia_id in (select academia_id from alunos where id = meu_aluno_id()));
create policy aluno_reserva on reservas_aula for all using (aluno_id = meu_aluno_id()) with check (aluno_id = meu_aluno_id());
create policy aluno_pede_cancelamento on pedidos_cancelamento for insert with check (aluno_id = meu_aluno_id() and origem = 'app');
