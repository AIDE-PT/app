# Relatório Técnico — Projeto "aide"

## Visão geral

O **aide** é uma aplicação móvel de **monitorização de saúde com modelo cuidador↔cuidado** (*aider* ↔ *cuidado*). Um utilizador "cuidado" gera dados biométricos (via Health Connect do telemóvel/wearables) e um "aider" (cuidador familiar/profissional) monitoriza-os à distância, recebendo alertas push quando há valores preocupantes ou um SOS. Construída com Expo/React Native, backend em Supabase, e geração de relatórios clínicos por IA.

---

## 1. Stack tecnológica

### Frontend / Mobile
| Tecnologia | Versão | Como é usada |
|---|---|---|
| **Expo (SDK 54) + React Native 0.81** | `~54.0.30` | Base da app, com **New Architecture** ativada (`newArchEnabled: true`) e **React Compiler** experimental ligado |
| **React 19.1** | `19.1.0` | Última geração; aproveita o React Compiler |
| **Expo Router 6** | `~6.0.21` | Routing baseado em ficheiros (pasta [app/](../app/)), com **typed routes** |
| **NativeWind 4 + Tailwind 3** | `^4.2.1` | Estilização utilitária (Tailwind no RN), com [global.css](../global.css) e [tailwind.config.js](../tailwind.config.js) |
| **TypeScript 5.9** | strict via [tsconfig.json](../tsconfig.json) | Tipagem em toda a base |

### Estado e dados
- **TanStack React Query** (`^5.90`) — cache/fetching de dados servidor (provider em [app/_layout.tsx:111](../app/_layout.tsx#L111))
- **Redux Toolkit + react-redux** e **Zustand** — ambos presentes (dois sistemas de estado global coexistem)
- **React Context** — usado para domínios transversais: [AuthContext](../contexts/AuthContext.tsx), [ThemeContext](../contexts/ThemeContext.tsx), [UserProfileContext](../contexts/UserProfileContext.tsx), [ConsentPrivacyContext](../contexts/ConsentPrivacyContext.tsx)
- **React Hook Form + Zod + @hookform/resolvers** — formulários validados por schema (ex.: [schemas/register.ts](../schemas/register.ts))

### Backend
- **Supabase** (Postgres + Auth + RLS + Edge Functions) — backend principal
- **Edge Function Deno** — [supabase/functions/generate-report/index.ts](../supabase/functions/generate-report/index.ts)
- **Groq API** (`llama-3.3-70b-versatile`) — LLM que gera os relatórios de saúde
- **Next.js 16** + helpers Supabase SSR — presente em dependências e [utils/supabase/](../utils/supabase/) (provável painel/web complementar)
- **json-server / server/server.js** — mock API para desenvolvimento

### Saúde e notificações
- **react-native-health-connect** — leitura de dados do Android Health Connect (módulo nativo Kotlin custom em [android/.../HealthConnectModule.kt](../android/app/src/main/java/com/cbl2025/aide/HealthConnectModule.kt))
- **expo-notifications + expo-background-fetch + expo-task-manager** — push + sincronização em background
- **Firebase FCM** ([google-services.json](../google-services.json)) — transporte de push no Android
- **expo-auth-session / expo-web-browser** — OAuth Google (fluxo PKCE)

### Visualização e UI
- **react-native-gifted-charts**, **react-native-chart-kit**, **react-native-simple-line-chart** — gráficos
- **@gorhom/bottom-sheet**, **react-native-reanimated 4 + worklets**, **gesture-handler** — interações fluidas
- **expo-print / expo-sharing** — exportação de relatórios em PDF ([utils/generateReportPdf.ts](../utils/generateReportPdf.ts))

### Qualidade / DevOps
- **ESLint 9 + Prettier + prettier-plugin-tailwindcss**
- **Jest** (com coverage badge automático)
- **lefthook** — git hooks
- **EAS Build** ([eas.json](../eas.json) com perfis dev/preview/prod)
- **GitHub Actions** ([pipeline.yaml](../.github/workflows/pipeline.yaml)) — audit, lint, prettier, typecheck e testes em paralelo

---

## 2. Estratégias principais (e como foram implementadas)

### A. Autenticação e proteção de rotas centralizada
[AuthContext.tsx](../contexts/AuthContext.tsx) é o coração da auth: escuta `onAuthStateChange` do Supabase, mantém a sessão, e implementa **guarda de rotas declarativa** com listas `PUBLIC_AUTH_ROUTES` / `PROTECTED_ROUTES`. Detalhes de qualidade:
- `fetchWithAuth` injeta o Bearer token e faz **logout automático em 401** ([AuthContext.tsx:232](../contexts/AuthContext.tsx#L232))
- Validação de `next` redirect contra open-redirect ([:137](../contexts/AuthContext.tsx#L137))
- Sincronização entre abas na web via evento `storage` ([:158](../contexts/AuthContext.tsx#L158))
- **OAuth Google** com fluxo distinto para web (redirect) e nativo (PKCE + `exchangeCodeForSession`) em [useGoogleAuth.ts](../hooks/useGoogleAuth.ts)

### B. Sincronização de dados de saúde em background (a estratégia mais sofisticada)
[src/tasks/healthBackgroundSync.ts](../src/tasks/healthBackgroundSync.ts) é o ficheiro mais elaborado do projeto. Estratégias notáveis:
- **Carregamento lazy/dinâmico** dos módulos nativos (`expo-task-manager`, `expo-background-fetch`) para não rebentar no Expo Go nem na web ([_layout.tsx:80](../app/_layout.tsx#L80))
- **Idempotência via `external_id` + upsert** — cada métrica/dia tem uma chave determinística (`health_connect:patient:steps:daily:2026-06-24`), por isso syncs repetidos atualizam em vez de duplicar ([:545](../src/tasks/healthBackgroundSync.ts#L545), [:924](../src/tasks/healthBackgroundSync.ts#L924))
- **Janela incremental persistida** em AsyncStorage (`last_sync_end_time`) + **partição por dia local** para alinhar passos/calorias/sono a dias de calendário ([:575](../src/tasks/healthBackgroundSync.ts#L575))
- **Retry com backoff** (`withRetry`, 3 tentativas) ([:230](../src/tasks/healthBackgroundSync.ts#L230))
- **Verificação passiva de permissões** (não abre diálogos no background) e exigência de `READ_HEALTH_DATA_IN_BACKGROUND`
- **Classificação clínica de valores** (`getMetricNotificationStatus`) que decide `normal`/`warning`/`alert` por métrica — ex.: FC≥120=alerta, SpO₂<92=crítico ([:602](../src/tasks/healthBackgroundSync.ts#L602)) — e só dispara notificações para valores preocupantes, evitando ruído
- **Separação de papéis no próprio sync**: um perfil "aider" nunca envia dados próprios ([:365](../src/tasks/healthBackgroundSync.ts#L365))

### C. Notificações multi-destinatário via RPC seguro no Postgres
Em vez de orquestrar no cliente, a app chama **RPCs `SECURITY DEFINER`** no Supabase ([dispatch_metric_alert_notification](../supabase/migrations/20260621120000_metric_alert_notifications.sql), `dispatch_sos_alert`):
- A função grava a notificação para o cuidado **e** para todos os aiders associados, e devolve os `expo_push_token` dos aiders
- O cliente ([pushNotifications.ts](../src/services/pushNotifications.ts)) então faz POST ao **Expo Push API**, validando o formato do token por regex
- Há um **canal Android dedicado de SOS** com importância MAX e vibração ([:30](../src/services/pushNotifications.ts#L30))

### D. Relatórios clínicos por IA com privacidade em primeiro lugar
A Edge Function [generate-report](../supabase/functions/generate-report/index.ts) é um bom exemplo de design defensivo:
- **Dupla autorização**: valida o JWT e confirma que o requerente é o próprio paciente *ou* um aider com `care_relation` ativa ([:128](../supabase/functions/generate-report/index.ts#L128))
- **Redação de PII** (nomes, emails, telefones) por regex **antes** de enviar ao LLM ([:23](../supabase/functions/generate-report/index.ts#L23))
- **Prompt engineering rígido** — secções fixas em Markdown, Português europeu, sem tabelas, formato previsível ([:205](../supabase/functions/generate-report/index.ts#L205))
- Service-role client para ler todas as notas, contornando RLS de forma controlada

### E. Segurança a nível de base de dados (RLS + triggers)
- **RLS** garante que um aider só vê biometria de quem cuida ([business_logic.sql:77](../supabase/migrations/20260421150634_business_logic.sql#L77))
- **Triggers de validação** garantem integridade dos papéis em `care_relations` (um aider tem de ser tipo `aider`, etc.)
- **Trigger `handle_new_user`** cria a linha em `users` no signup automaticamente
- Migrações versionadas e ordenadas por timestamp

### F. Acessibilidade e personalização
[ThemeContext](../contexts/ThemeContext.tsx) suporta tema claro/escuro **e paletas para daltonismo** (deuteranopia, protanopia, tritanopia, alto contraste) + vista de widgets simplificada/detalhada — preferências persistidas. Demonstra preocupação com um público potencialmente idoso/com necessidades especiais.

### G. Internacionalização e localização
App configurada nativamente para **pt-PT** ([app.json:76](../app.json#L76), [locales/pt-PT.json](../locales/pt-PT.json)), com formatação de datas/horas em pt-PT em todo o código.

---

## 3. Estratégias "essenciais" — o que torna este projeto bem desenhado

Três decisões são, na minha leitura, **essenciais e diferenciadoras**:

1. **Idempotência determinística no sync de saúde** (`external_id` + `upsert onConflict`). Sem isto, syncs em background gerariam duplicados massivos. É a peça que torna a sincronização contínua viável.

2. **Lógica sensível concentrada no servidor (RPC `SECURITY DEFINER` + RLS + Edge Function), não no cliente.** Push multi-destinatário, autorização de relatórios e redação de PII vivem onde não podem ser contornados pelo cliente. Para uma app de **dados de saúde**, isto é a diferença entre seguro e negligente.

3. **Degradação graciosa por ambiente de execução.** O `_layout.tsx` e o sync detetam Expo Go / web / Android e carregam módulos nativos dinamicamente, com `try/catch` em todo o lado. A app não rebenta onde as APIs nativas não existem — crítico num projeto Expo multi-target.

---

## 4. Observações / pontos de atenção

- **Duplicação de estado**: Redux Toolkit *e* Zustand *e* React Context coexistem. Vale a pena consolidar para reduzir carga cognitiva.
- **Permissões Android duplicadas** em [app.json:31-44](../app.json#L31-L44) (FOREGROUND_SERVICE, RECEIVE_BOOT_COMPLETED, etc. repetidas) — inofensivo mas sujo.
- **Logs verbosos** de dados de saúde (`console.log` de snapshots/sono) no sync — devem ser removidos/silenciados em produção por privacidade.
- **CI com builds desativados**: SonarCloud, preview e builds EAS estão comentados no pipeline; só correm lint/test/typecheck.
- **README ainda é o boilerplate** do `create-expo-app` — não reflete o projeto real.
- O cooldown de geração de relatório está desativado ("Cooldown disabled for testing" em [useReportGeneration.ts:55](../hooks/useReportGeneration.ts#L55)) — confirmar antes de produção, pois cada chamada gasta tokens do Groq.

---

# Anexo — Infraestrutura Cloud e Serviços Externos

O **aide** não tem servidor próprio: assenta numa arquitetura **serverless/BaaS** que combina cinco serviços cloud, cada um com um papel bem delimitado. Abaixo, o que cada um faz e como está integrado no código.

## 1. Google Cloud — OAuth / "Login com Google"

O Google Cloud fornece o **provedor de identidade OAuth 2.0** usado no login social.

- **Fluxo**: o cliente nunca fala diretamente com a Google — delega no Supabase Auth, que está configurado com as credenciais OAuth (Client ID/Secret) geradas na **Google Cloud Console**.
- **Implementação** em [useGoogleAuth.ts](../hooks/useGoogleAuth.ts):
  - **Web**: `signInWithOAuth({ provider: "google" })` faz o redirect completo da página.
  - **Nativo**: fluxo **PKCE** — abre o `WebBrowser`, e no callback (`scheme: aide` → `auth/callback`) troca o `code` pela sessão via `exchangeCodeForSession` ([useGoogleAuth.ts:21](../hooks/useGoogleAuth.ts#L21)).
- **Configuração**: o `scheme: "aide"` ([app.json:8](../app.json#L8)) e o redirect URI têm de estar registados tanto na Google Cloud Console como no Supabase. É a integração que motivou a branch atual (`fix/googleAuth`).

## 2. EAS (Expo Application Services) — Build e distribuição cloud

O **EAS** é a infraestrutura cloud da Expo que compila a app (Android/iOS) nos servidores da Expo, sem necessidade de máquina local com Android Studio/Xcode.

- **Projeto EAS**: `projectId: fb30b9b1-…` ([app.json:86](../app.json#L86)).
- **Perfis de build** em [eas.json](../eas.json): `development`, `preview` (APK instalável standalone) e `production` — os commits recentes mostram trabalho exatamente aqui (perfil preview, prebuild do Gradle).
- **EAS Update (OTA)**: `updates.url: https://u.expo.dev/…` ([app.json:90](../app.json#L90)) — permite enviar atualizações de JS over-the-air sem passar pelas lojas, com `runtimeVersion` a controlar a compatibilidade.
- **EAS Push token**: o token de notificações é emitido por `getExpoPushTokenAsync({ projectId })` usando este mesmo `projectId` ([pushNotifications.ts:70](../src/services/pushNotifications.ts#L70)).

## 3. Firebase (Google Cloud) — Transporte de Push Notifications no Android

O **Firebase Cloud Messaging (FCM)** é o canal de entrega física das notificações push no Android.

- **Configuração**: [google-services.json](../google-services.json) referenciado em [app.json:48](../app.json#L48) (`googleServicesFile`), com o plugin nativo configurado nos commits de Firebase FCM.
- **Cadeia de entrega**:
  **app → Expo Push API → FCM → dispositivo Android**.
  O código nunca chama o FCM diretamente — envia para o **Expo Push API** (`https://exp.host/--/api/v2/push/send` em [pushNotifications.ts:7](../src/services/pushNotifications.ts#L7)), e a Expo encaminha via FCM usando as credenciais do `google-services.json`.
- **Canais dedicados**: canal Android `sos-alerts` com importância MAX para os pedidos de socorro ([pushNotifications.ts:30](../src/services/pushNotifications.ts#L30)).

## 4. Supabase — Base de dados, Auth e backend (BaaS)

O **Supabase** (Postgres gerido na cloud) é o backend central que concentra quase toda a lógica.

- **Base de dados Postgres** com schema versionado em [supabase/migrations/](../supabase/migrations/) (utilizadores, `user_types`, `care_relations`, `biometric_data`, `biometric_data_types`, `notes`, `notifications`, `push_tokens`).
- **Auth**: gestão de sessões, JWT e OAuth (ver ponto 1) — orquestrada no cliente por [AuthContext.tsx](../contexts/AuthContext.tsx).
- **Segurança no servidor**:
  - **RLS** — um aider só lê biometria de quem cuida ([business_logic.sql:77](../supabase/migrations/20260421150634_business_logic.sql#L77)).
  - **RPCs `SECURITY DEFINER`** — `dispatch_metric_alert_notification`, `dispatch_sos_alert`, `get_patients_for_aider`, `find_care_by_email` — concentram a lógica multi-utilizador no Postgres.
  - **Triggers** — validação de papéis em `care_relations` e `handle_new_user` no signup.
- **Armazenamento de dados de saúde**: o sync em background faz `upsert` na tabela `biometric_data` ([healthBackgroundSync.ts:924](../src/tasks/healthBackgroundSync.ts#L924)).

## 5. Supabase Edge Functions + Groq.com — Funcionalidade de Relatório com IA na cloud

A geração de relatórios clínicos corre **inteiramente na cloud**, combinando dois serviços:

- **Supabase Edge Functions (Deno, serverless)** — [generate-report/index.ts](../supabase/functions/generate-report/index.ts) executa no edge da Supabase. É invocada do cliente por `supabase.functions.invoke("generate-report")` ([useReportGeneration.ts:63](../hooks/useReportGeneration.ts#L63)).
  - Faz **dupla autorização** (paciente próprio ou aider com relação ativa) e **redação de PII** antes de qualquer chamada externa.
- **Groq Cloud (`api.groq.com`)** — fornece o LLM **`llama-3.3-70b-versatile`** que analisa as notas do cuidador e devolve um relatório estruturado em Markdown ([generate-report/index.ts:191](../supabase/functions/generate-report/index.ts#L191)).
  - A chave `GROQ_API_KEY` vive como variável de ambiente da Edge Function (nunca no cliente).
  - Prompt fixo em Português europeu, secções pré-definidas, sem tabelas.

## Diagrama de responsabilidades

```
                         ┌──────────────────────────┐
                         │     App (Expo / RN)       │
                         └────────────┬─────────────┘
        ┌───────────────┬─────────────┼───────────────┬──────────────┐
        ▼               ▼             ▼               ▼              ▼
  Google Cloud       EAS         Supabase        Expo Push      (build/OTA)
  (OAuth 2.0)     (build+OTA)   ┌─────────┐      │   │
        │            cloud      │ Postgres│      ▼   ▼
        └────► Supabase Auth    │  + RLS  │     FCM (Firebase) ─► Android
                                │ + RPCs  │
                                │ + Edge  │──► Groq Cloud (LLM)
                                └─────────┘     relatório IA
```

**Resumo:** o aide é uma arquitetura **100% serverless multi-cloud** — Google Cloud (identidade) + EAS (build/OTA) + Firebase/FCM (entrega de push) + Supabase (dados, auth, lógica e edge) + Groq (IA dos relatórios) — em que a lógica sensível (autorização, RLS, redação de PII, chaves de API) está sempre do lado servidor, e o cliente apenas orquestra e apresenta.
