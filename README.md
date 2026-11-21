# SAC

**O sistema que faz o aluno ficar.** Cobre a jornada inteira do aluno, da matrícula ao acompanhamento com o personal e a nutricionista, e avisa a equipe quem está perto de cancelar.

**Ver no ar:** https://eduumarquez.github.io/sac/

## Áreas do sistema

| Área | Rota | O que faz |
| --- | --- | --- |
| Matrícula online | `/matricula` | Dados, objetivo, escolha do plano, anamnese (PAR-Q), aceite de termos e consentimento LGPD, pagamento. Atribui personal e nutricionista automaticamente (quem tem menos alunos) e gera as mensalidades. |
| Academia | `/painel` | Indicadores, lista do dia com risco de evasão e WhatsApp, lista de alunos, financeiro (cobranças em aberto) e ficha 360 do aluno. |
| Personal | `/personal` | Carteira de alunos com pendências (montar/renovar treino, avaliação), editor de treino por divisões, avaliação física com medidas e gráficos de evolução. |
| Nutricionista | `/nutricionista` | Pacientes e retornos, plano alimentar por refeição, registro de consulta (peso, adesão, anotações) e evolução. |
| Aluno | `/aluno` | Check-in, treino do dia com registro de carga, plano alimentar, próxima consulta, evolução de peso e carga, mensalidades. |

## Modo demonstração

Hoje todos os dados ficam no `localStorage` do navegador (`src/lib/db.ts`), começando com uma academia de exemplo (`src/lib/seed.ts`). O seletor "Entrar como" em cada área simula o login. O botão "Reiniciar demonstração" volta aos dados iniciais.

Para ir para produção, troque a implementação de `src/lib/db.ts` por chamadas ao Supabase, usando as migrações em `supabase/migrations/`. As telas não precisam mudar.

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

## Site no ar

O site é publicado automaticamente no GitHub Pages a cada push na `main`, pelo workflow `.github/workflows/deploy-pages.yml`: https://eduumarquez.github.io/sac/

Por enquanto o app é exportado como site estático (`output: "export"`). Quando precisar de rotas no servidor (login com cookies, webhooks do Asaas), migre para uma hospedagem com Node, como a Vercel.

## Banco de dados

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No painel do Supabase, abra **SQL Editor** e execute, em ordem, os arquivos de `supabase/migrations/`.
3. Copie a URL do projeto e a chave `anon` (em **Project Settings > API**) para o `.env.local`.

Tabelas principais: `academias`, `equipe`, `planos`, `alunos`, `checkins`, `cobrancas`, `treinos`, `exercicios_treino`, `registros_carga` e `contatos_retencao`. Cada tabela tem `academia_id` e uma política RLS para que cada equipe só veja os dados da própria academia.

## Estrutura

```
src/
  app/
    matricula/        matrícula online
    painel/           academia (dono e recepção) e ficha 360
    personal/         área do personal
    nutricionista/    área da nutricionista
    aluno/            app do aluno (PWA)
  components/         interface (ui, ficha do aluno, editores)
  lib/
    tipos.ts          modelo de dados
    db.ts             armazenamento (modo demonstração)
    seed.ts           dados de exemplo
    regras.ts         regras de negócio (PAR-Q, cobranças, atribuição, sequência)
    risco.ts          termômetro de risco de evasão
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

## Roteiro

- [x] Base do projeto, esquema do banco e termômetro de risco
- [x] Matrícula online com anamnese, LGPD e atribuição de profissionais
- [x] Painel da academia: lista do dia, alunos, financeiro, ficha 360
- [x] Área do personal: treinos, avaliação física, evolução
- [x] Área da nutricionista: plano alimentar, consultas, retornos
- [x] App do aluno: check-in, treino, registro de carga, dieta, evolução
- [ ] Criar projeto no Supabase e trocar `src/lib/db.ts` pelo banco real
- [ ] Login real (Supabase Auth) para equipe e alunos
- [ ] Cobrança recorrente real com Asaas
- [ ] Check-in por QR Code na recepção
- [ ] Agenda de avaliações e consultas
- [ ] Jornada dos primeiros 90 dias e envio automático pelo WhatsApp
- [ ] Upload de atestado médico

## LGPD

Medidas corporais e evolução são dados de saúde (sensíveis). O campo `alunos.consentimento_saude_em` registra o consentimento explícito do aluno; não colete esses dados sem ele.

## Contato

Dúvidas, sugestões ou interesse em usar o SAC na sua academia: [eduardocontato.sw@gmail.com](mailto:eduardocontato.sw@gmail.com)
