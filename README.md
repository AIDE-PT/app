![Jest Coverage](https://img.shields.io/endpoint?url=https%3A%2F%2Fgist.githubusercontent.com%2FDan1m4D%2F0d7da4825fe900c051580e2a6079d99d%2Fraw%2F30994fcfb1b7dea0ac004093262173bfb83f4734%2Faide-coverage.json)
![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E?logo=supabase)

# aide

**aide** é uma aplicação móvel de **monitorização de saúde com modelo cuidador↔cuidado** (*aider* ↔ *cuidado*). Um utilizador **cuidado** gera dados biométricos (via Health Connect do telemóvel/wearables) e um **aider** (cuidador familiar ou profissional) monitoriza-os à distância, recebendo alertas push quando há valores preocupantes ou um pedido de SOS. Inclui geração de relatórios clínicos assistida por IA.

> Construída com Expo / React Native, backend serverless em Supabase, e relatórios gerados por LLM (Groq).

---

## Arranque rápido

```bash
npm install                # instalar dependências
cp .env.example .env       # preencher EXPO_PUBLIC_SUPABASE_URL e a publishable key
npm start                  # arrancar o Metro (escolher plataforma no terminal)
```

Para correr nativo (necessário para Health Connect, push e background sync):

```bash
npx expo run:android       # Android (compila e instala o development build)
npx expo run:ios           # iOS
npm run web                # versão web
```

> `npm run android` / `npm run ios` são atalhos para `npx expo run:android` / `npx expo run:ios`.
> Funcionalidades nativas requerem um **development build**, não Expo Go. Detalhes em [Pré-requisitos](#pré-requisitos), [Variáveis de ambiente](#variáveis-de-ambiente) e [Executar a app](#executar-a-app).

---

## Índice

- [Arranque rápido](#arranque-rápido)
- [Funcionalidades](#funcionalidades)
- [Stack tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Começar](#começar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Executar a app](#executar-a-app)
- [Builds (EAS)](#builds-eas)
- [Scripts disponíveis](#scripts-disponíveis)
- [Testes e qualidade](#testes-e-qualidade)
- [Backend (Supabase)](#backend-supabase)
- [Resolução de problemas](#resolução-de-problemas)
- [Contribuir](#contribuir)

---

## Funcionalidades

- 👥 **Modelo cuidador↔cuidado** — relações `aider` ↔ `cuidado` com permissões e visibilidade controladas por RLS.
- ❤️ **Sincronização de dados de saúde** — leitura do Android Health Connect (FC, SpO₂, sono, passos, calorias, tensão, temperatura…) com sync incremental em background.
- 🔔 **Alertas push inteligentes** — classificação clínica de valores (`normal` / `warning` / `alert`) e notificações apenas para valores preocupantes; canal dedicado de **SOS** com prioridade máxima.
- 🤖 **Relatórios clínicos por IA** — geração na cloud (Supabase Edge Function + Groq) com redação de PII antes de qualquer chamada ao LLM.
- 🔐 **Autenticação** — email/password e **Login com Google** (OAuth PKCE no nativo), com guarda de rotas centralizada.
- 📊 **Dashboards e gráficos** — histórico diário, recomendações e visualizações configuráveis.
- ♿ **Acessibilidade** — tema claro/escuro, paletas para daltonismo (deuteranopia, protanopia, tritanopia, alto contraste) e vista simplificada/detalhada.
- 🌍 **Localização** — pt-PT nativo.
- 📄 **Exportação de relatórios em PDF**.

---

## Stack tecnológica

### Frontend / Mobile
| Tecnologia | Versão | Papel |
|---|---|---|
| Expo (SDK 54) + React Native | `~54.0.30` / `0.81.5` | Base da app, New Architecture + React Compiler experimental |
| React | `19.1.0` | UI |
| Expo Router | `~6.0.21` | Routing file-based (typed routes) |
| NativeWind + Tailwind | `^4.2.1` / `3.4` | Estilização utilitária |
| TypeScript | `~5.9.2` | Tipagem |

### Estado e dados
- **TanStack React Query** — fetching/cache de dados do servidor
- **Redux Toolkit**, **Zustand** e **React Context** — estado global (Auth, Theme, UserProfile, ConsentPrivacy)
- **React Hook Form + Zod** — formulários validados por schema

### Backend e cloud
- **Supabase** — Postgres + Auth + RLS + Edge Functions (backend principal)
- **Groq** (`llama-3.3-70b-versatile`) — LLM dos relatórios
- **EAS** — build e OTA updates
- **Firebase FCM** — transporte de push no Android (via Expo Push API)
- **Google Cloud** — provedor OAuth 2.0

### Saúde, notificações e UI
- `react-native-health-connect` (módulo nativo Kotlin custom)
- `expo-notifications` + `expo-background-fetch` + `expo-task-manager`
- `expo-auth-session` / `expo-web-browser` (OAuth)
- `react-native-gifted-charts`, `react-native-chart-kit`, `@gorhom/bottom-sheet`, `react-native-reanimated`
- `expo-print` / `expo-sharing` (PDF)

---

## Arquitetura

Arquitetura **100% serverless multi-cloud**. A lógica sensível (autorização, RLS, redação de PII, chaves de API) vive sempre do lado servidor; o cliente orquestra e apresenta.

```
                         ┌──────────────────────────┐
                         │     App (Expo / RN)       │
                         └────────────┬─────────────┘
        ┌───────────────┬─────────────┼───────────────┬──────────────┐
        ▼               ▼             ▼               ▼              ▼
  Google Cloud       EAS         Supabase        Expo Push      (build/OTA)
  (OAuth 2.0)     (build+OTA)   ┌─────────┐        │
        │            cloud      │ Postgres│        ▼
        └────► Supabase Auth    │  + RLS  │     FCM (Firebase) ─► Android
                                │ + RPCs  │
                                │ + Edge  │──► Groq Cloud (LLM)
                                └─────────┘     relatório IA
```

Para um aprofundamento técnico (estratégias de sync, RLS, RPCs `SECURITY DEFINER`, redação de PII, etc.) ver [docs/RELATORIO.md](docs/RELATORIO.md).

---

## Estrutura do projeto

```
.
├── app/                 # Rotas (Expo Router, file-based) — ecrãs da aplicação
├── components/          # Componentes reutilizáveis de UI
├── contexts/            # React Contexts (Auth, Theme, UserProfile, ConsentPrivacy)
├── hooks/               # Hooks custom (useGoogleAuth, useReportGeneration, …)
├── schemas/             # Schemas de validação Zod
├── src/                 # Tarefas/serviços (healthBackgroundSync, pushNotifications)
├── utils/               # Utilitários (cliente Supabase, geração de PDF, …)
├── constants/           # Constantes partilhadas
├── locales/             # Traduções (pt-PT)
├── assets/              # Ícones, imagens, fontes
├── android/             # Projeto nativo Android (módulo Health Connect Kotlin)
├── supabase/            # Migrações SQL + Edge Functions (Deno)
├── server/              # Mock API (json-server) para desenvolvimento
├── __tests__/           # Testes Jest
├── app.json             # Configuração Expo
└── eas.json             # Perfis de build EAS
```

---

## Pré-requisitos

- **Node.js** 18+ e **npm**
- **Expo CLI** (via `npx`, não precisa de instalação global)
- Para correr nativo Android: **Android Studio** + SDK, ou um **development build** instalado num dispositivo (ver [setup-expo-android.md](setup-expo-android.md))
- Conta **Supabase** (e, para builds, conta **Expo/EAS**)
- O **Health Connect** só funciona em **Android** com development build — não está disponível em Expo Go nem na web.

---

## Começar

```bash
# 1. Clonar o repositório
git clone <url-do-repo>
cd app

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente (ver secção abaixo)
cp .env.example .env   # e preencher os valores

# 4. Arrancar o servidor de desenvolvimento
npm start
```

---

## Variáveis de ambiente

Cria um ficheiro `.env` na raiz com:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<o-teu-projeto>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<a-tua-publishable-key>
```

Estas variáveis são lidas em [utils/supabase/client.ts](utils/supabase/client.ts). Como têm o prefixo `EXPO_PUBLIC_`, são embebidas no bundle do cliente — **usa sempre a publishable/anon key, nunca a service-role key**.

Segredos exclusivos do servidor (ex.: `GROQ_API_KEY`) vivem como variáveis de ambiente das **Edge Functions** do Supabase e nunca no cliente.

> **Login com Google:** o redirect URI `aide://auth/callback` (e `aide://**`) tem de estar registado em **Supabase → Authentication → URL Configuration → Redirect URLs**, e as credenciais OAuth na Google Cloud Console apontar para `https://<projeto>.supabase.co/auth/v1/callback`.

---

## Executar a app

```bash
npm start              # servidor de desenvolvimento (Metro) — escolher plataforma no terminal
npx expo run:android   # build/dev nativo Android (atalho: npm run android)
npx expo run:ios       # build/dev nativo iOS (atalho: npm run ios)
npm run web            # versão web (expo start --web)
npm run server         # mock API local (json-server) em server/server.js
```

> Funcionalidades nativas (Health Connect, push, background sync) requerem um **development build**, não Expo Go.

---

## Builds (EAS)

Perfis definidos em [eas.json](eas.json):

| Perfil | Distribuição | Output Android | Uso |
|---|---|---|---|
| `development` | internal | APK | Development build com dev client |
| `preview` | internal | APK | APK standalone instalável para testes |
| `production` | store | App Bundle (`.aab`) | Publicação nas lojas |

```bash
npm install -g eas-cli      # uma vez
eas login
eas build --profile preview --platform android
eas build --profile production --platform android
```

**OTA updates** (EAS Update) estão configurados (`updates.url` em [app.json](app.json)) — atualizações de JS podem ser publicadas com `eas update` sem passar pelas lojas.

---

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `npm start` | Arranca o Metro / servidor Expo |
| `npm run android` / `ios` / `web` | Corre na plataforma respetiva |
| `npm run server` | Mock API (json-server) |
| `npm run lint` | ESLint com `--fix` |
| `npm run lint:check` | ESLint sem alterar ficheiros |
| `npm run format` | Prettier (escreve) |
| `npm run prettier:check` | Prettier (apenas verifica) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Testes Jest |
| `npm run test:coverage` | Testes com relatório de cobertura |
| `npm run reset-project` | Reinicia para projeto Expo vazio (boilerplate) |

---

## Testes e qualidade

- **Jest** para testes unitários (`__tests__/`), com badge de cobertura no topo deste README.
- **ESLint 9** + **Prettier** (com `prettier-plugin-tailwindcss`).
- **lefthook** — git hooks (ver [lefthook.yml](lefthook.yml)).
- **GitHub Actions** — pipeline com audit, lint, prettier, typecheck e testes em paralelo (ver [.github/workflows](.github/workflows)).

```bash
npm test
npm run typecheck
npm run lint:check
```

---

## Backend (Supabase)

O schema vive em [supabase/migrations/](supabase/migrations/) (versionado por timestamp) e cobre tabelas como `users`, `user_types`, `care_relations`, `biometric_data`, `biometric_data_types`, `notes`, `notifications` e `push_tokens`.

Destaques de segurança:
- **RLS** — um aider só lê biometria de quem cuida.
- **RPCs `SECURITY DEFINER`** — `dispatch_metric_alert_notification`, `dispatch_sos_alert`, `get_patients_for_aider`, `find_care_by_email`.
- **Triggers** — validação de papéis em `care_relations` e `handle_new_user` no signup.
- **Edge Function** [generate-report](supabase/functions/generate-report/index.ts) — dupla autorização (paciente próprio ou aider com relação ativa) + redação de PII antes de chamar o LLM.

Com a [Supabase CLI](https://supabase.com/docs/guides/cli) (já incluída em devDependencies):

```bash
npx supabase start          # stack local
npx supabase db push        # aplicar migrações
npx supabase functions serve generate-report
```

---

## Resolução de problemas

- **Login com Google abre a versão web em vez de voltar à app nativa** → falta adicionar `aide://auth/callback` (e `aide://**`) aos Redirect URLs no Supabase; sem isso o Supabase faz fallback para o Site URL (web).
- **Health Connect não funciona** → só funciona em Android com development build (não em Expo Go/web) e requer a app Health Connect instalada e permissões concedidas.
- **App não arranca / Supabase indefinido** → confirmar que o `.env` está preenchido e reiniciar o Metro com cache limpa: `npx expo start -c`.

---

## Contribuir

Contribuições são bem-vindas. Consulta [CONTRIBUTING.md](CONTRIBUTING.md) e o [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Fluxo resumido:
1. Cria um branch a partir de `main`.
2. Garante que `npm run lint:check`, `npm run typecheck` e `npm test` passam.
3. Abre um Pull Request descrevendo a alteração.

---

## Licença

Projeto privado (`"private": true`). Não tem licença pública definida — todos os direitos reservados aos autores. Para uso ou distribuição, contactar a equipa do projeto.
