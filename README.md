# SAC

**O sistema que faz o aluno ficar.** Um copiloto de retenção para academias: prevê quem está perto de cancelar, entrega ao professor a lista de quem procurar hoje e mostra ao aluno a própria evolução.

## Stack

- [Next.js](https://nextjs.org) 15 (App Router) com TypeScript e Tailwind CSS
- [Supabase](https://supabase.com): Postgres, login e segurança por linha (RLS)
- Vitest para testes
- Futuro: [Asaas](https://www.asaas.com) para cobrança (Pix, boleto, cartão) e WhatsApp Cloud API

## Como rodar

Pré-requisito: Node.js 20 ou mais novo.

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev                  # abre em http://localhost:3000
```

O painel (`/painel`) já funciona com dados de exemplo, mesmo sem o Supabase configurado.

Outros comandos:

```bash
npm test        # testes do termômetro de risco
npm run lint    # verificação de código
npm run build   # build de produção
```

## Banco de dados

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No painel do Supabase, abra **SQL Editor**, cole o conteúdo de `supabase/migrations/0001_esquema_inicial.sql` e execute.
3. Copie a URL do projeto e a chave `anon` (em **Project Settings > API**) para o `.env.local`.

Tabelas principais: `academias`, `equipe`, `planos`, `alunos`, `checkins`, `cobrancas`, `treinos`, `exercicios_treino`, `registros_carga` e `contatos_retencao`. Cada tabela tem `academia_id` e uma política RLS para que cada equipe só veja os dados da própria academia.

## Estrutura

```
src/
  app/
    page.tsx          início
    painel/           lista do dia (dono e professor)
    aluno/            app do aluno (PWA)
  lib/
    risco.ts          termômetro de risco de evasão
    demo.ts           dados de exemplo
    supabase/         clientes Supabase (navegador e servidor)
supabase/migrations/  esquema do banco
```

## Termômetro de risco (v1)

Regras simples em `src/lib/risco.ts`, que somam até 100 pontos:

| Sinal | Pontos |
| --- | --- |
| 14+ dias sem treinar (7+ dias: 20) | 40 |
| Frequência das últimas 2 semanas abaixo da metade das 4 anteriores | 25 |
| Pagamento atrasado há mais de 15 dias (1 a 15 dias: 10) | 20 |
| Iniciante, com até 90 dias de casa | 10 |
| Sem treino montado ou treino com mais de 60 dias | 10 |

Nível: alto a partir de 50, médio a partir de 25. Os pesos devem ser calibrados com dados reais das academias piloto.

## Roteiro do MVP

- [x] Base do projeto, esquema do banco e termômetro de risco
- [x] Lista do dia com link para WhatsApp (dados de exemplo)
- [ ] Login da equipe (Supabase Auth) e cadastro da academia
- [ ] Cadastro de alunos e planos, com importação por planilha
- [ ] Check-in por QR Code
- [ ] Painel lendo dados reais do Supabase
- [ ] Registro de contato e resultado na lista do dia
- [ ] App do aluno: ficha de treino, registro de carga e gráfico de evolução
- [ ] Jornada dos primeiros 90 dias
- [ ] Cobrança recorrente com Asaas
- [ ] Envio automático pelo WhatsApp Cloud API
- [ ] Relatório de alunos recuperados

## LGPD

Medidas corporais e evolução são dados de saúde (sensíveis). O campo `alunos.consentimento_saude_em` registra o consentimento explícito do aluno; não colete esses dados sem ele.
