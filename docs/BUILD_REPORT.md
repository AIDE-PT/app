
# Relatório de Build do APK (sessão autónoma)

> Registo de tudo o que foi alterado e tentado enquanto o utilizador esteve ausente.
> Início: 2026-06-24. Objetivo: produzir um APK `preview` standalone, instalável e funcional.

---

## Estado atual

- **Estado:** ⏳ Build #2 em curso (com correção aplicada e commitada)
- **Perfil:** `preview` (APK standalone, assinado com keystore remoto)
- **Plataforma:** Android
- **Última atualização:** Build #1 falhou na fase `FIX_GRADLEW` (gradlew em falta). Causa corrigida e Build #2 lançado.

---

## Histórico de tentativas

### Build #1
- **Comando:** `npx eas-cli build --profile preview --platform android --non-interactive`
- **URL:** https://expo.dev/accounts/l.fiuza/projects/aide/builds/2a61cad1-de95-43fd-aad4-a28b74db7dc6
- **Arranque:** OK — usou credenciais Android remotas (keystore `Build Credentials VF8d6Px66Y`), comprimiu e enviou o projeto (3.6 MB), calculou fingerprint, entrou na fila.
- **Nota:** detetado diretório `android/` nativo → o `android.package` do app.json é ignorado e usa-se o do código nativo (`com.cbl2025.aide`). Comportamento esperado.
- **Resultado:** ❌ **FALHOU** após ~42s na fase `FIX_GRADLEW`.
- **Erro:** `ENOENT: no such file or directory, open '/home/expo/workingdir/build/android/gradlew'`
- **Diagnóstico:** o projeto tem a pasta `android/` parcialmente commitada (módulo nativo Health Connect custom), por isso o EAS trata-o como projeto "bare" e **salta o prebuild** — mas o `.gitignore` só commitava 8 ficheiros de `android/`, deixando de fora o Gradle wrapper (`gradlew`, `gradle/wrapper/*`), `settings.gradle`, `gradle.properties`, a pasta `res/`, `MainActivity.kt`, etc. Sem `gradlew`, o build falha imediatamente. (O `prebuildCommand` do eas.json é ignorado porque a pasta `android/` existe.)

### Build #2
- **Comando:** `npx eas-cli build --profile preview --platform android --non-interactive`
- **Baseado em:** correção abaixo (HEAD `f19e257`).
- **Resultado:** _(a aguardar)_

---

## Alterações ao código/configuração

### 1. `.gitignore` — commitar o projeto Android completo (correção do Build #1)
Substituída a allowlist restritiva de `/android/*` (que só deixava passar 8 ficheiros) por regras normais de projeto nativo: commita-se todo o `android/`, ignorando apenas artefactos de build e ficheiros específicos da máquina (`/android/.gradle/`, `/android/**/build/`, `/android/local.properties`, `.cxx/`, etc.).
- **Porquê:** o EAS precisa do projeto Gradle completo (incl. `gradlew`) para builds "bare". Manteve-se a opção do projeto (commitar nativo) em vez de migrar para CNG/prebuild, que exigiria reescrever o módulo nativo Health Connect como config plugin (risco alto).

### 2. `.gitattributes` (novo) + bit de execução do `gradlew`
- `android/gradlew text eol=lf` e binários (`*.jar`, `*.keystore`, `*.webp`, …) marcados como `binary`.
- `git update-index --chmod=+x android/gradlew` → modo `100755`.
- **Porquê:** o `gradlew` é executado em Linux no EAS; CRLF ou falta de bit executável fá-lo-iam falhar.

### 3. Commits criados (branch `fix/googleAuth`)
- `f19e257` — fix: commit full Android native project so EAS build finds gradlew (51 ficheiros de `android/` + `.gitignore` + `.gitattributes`)
- (auth) — o fix de onboarding do Google em `contexts/AuthContext.tsx` já estava commitado em `1b55beb`, por isso está incluído no build.

> Nota: o `git commit` inicial do #f19e257 levou uma mensagem mal formada (usei sintaxe de here-string do PowerShell na shell Bash); foi corrigida com `--amend` antes de qualquer push. Nada foi enviado para o remoto.

---

## Próximos passos / decisões pendentes

- A aguardar resultado do Build #2.
- Se falhar de novo: ler logs, diagnosticar, corrigir, relançar (ciclo).
- **Nada foi feito `git push`** — todos os commits são locais na branch `fix/googleAuth`. Confirmar contigo se queres que faça push.
- Ficheiros ainda **não commitados** (não afetam o APK): `README.md`, `.env.example`, `docs/BUILD_REPORT.md`.
