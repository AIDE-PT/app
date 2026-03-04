# Setup Expo Development Build — Android (Windows)

Guia baseado na experiência real de configuração de uma app Expo com
`expo-dev-client` no Windows.

---

## Contexto

A app usa `expo-dev-client` e dependências com código nativo
(`@gorhom/bottom-sheet`, `react-native-reanimated`, etc.), o que a torna
**incompatível com o Expo Go**. É necessário fazer um **Development Build**
para correr a app.

---

## Passo 1 — Tentar abrir com Expo Go

**Problema:** O Expo Go não abria a app.

**Causa:** O terminal mostrava `› Using development build`, o que significa
que a app requer um development build e não é compatível com o Expo Go.

**Solução:** Usar `expo run:android` em vez do Expo Go.

---

## Passo 2 — Correr `expo run:android`
```bash
npx expo run:android
```

**Erro:**
```
Failed to resolve the Android SDK path. Default install location not found:
C:\Users\leofi\AppData\Local\Android\Sdk.
Use ANDROID_HOME to set the Android SDK location.
Error: 'adb' is not recognized as an internal or external command.
```

**Causa:** Android Studio não estava instalado.

**Solução:**
1. Instalar o Android Studio em https://developer.android.com/studio
2. Configurar variáveis de ambiente do sistema:
   - `ANDROID_HOME` = `C:\Users\leofi\AppData\Local\Android\Sdk`
   - Adicionar ao `Path`:
     - `C:\Users\leofi\AppData\Local\Android\Sdk\platform-tools`
     - `C:\Users\leofi\AppData\Local\Android\Sdk\emulator`
3. Criar um emulador no Android Studio:
   - Device Manager → Create Virtual Device → Pixel 6 → API 35 → Finish
   - Iniciar o emulador com o botão ▶

---

## Passo 3 — Emulador offline

**Erro:**
```
CommandError: Failed to get properties for device (emulator-5554):
adb.exe: device offline
```

**Causa:** O emulador ainda não tinha terminado de arrancar.

**Solução:**
```bash
adb kill-server
adb start-server
adb devices
```
Aguardar o emulador carregar completamente (ecrã inicial do Android visível)
antes de voltar a correr o comando.

---

## Passo 4 — JAVA_HOME não configurado

**Erro:**
```
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
```

**Causa:** O JDK não estava configurado nas variáveis de ambiente.

**Solução:**
1. Verificar que o JDK do Android Studio existe:
```powershell
Test-Path "C:\Program Files\Android\Android Studio\jbr"
# Retorna: True
```

2. Adicionar às variáveis de sistema:
   - `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`
   - Adicionar ao `Path`: `C:\Program Files\Android\Android Studio\jbr\bin`

3. Para aplicar na sessão atual do PowerShell sem reiniciar:
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
java -version
```

---

## Passo 5 — SDK location not found (local.properties)

**Erro:**
```
SDK location not found. Define a valid SDK location with an ANDROID_HOME
environment variable or by setting the sdk.dir path in your project's
local.properties file.
```

**Causa:** O Gradle não conseguia ler o `ANDROID_HOME` e o ficheiro
`local.properties` não existia.

**Tentativa falhada** — o `echo` do PowerShell escreveu barras duplas erradas:
```powershell
# ❌ Não usar — gera sdk.dir=C\\:\Users\\... (formato errado)
echo "sdk.dir=C\:\\Users\\leofi\\AppData\\Local\\Android\\Sdk" > android\local.properties
```

**Solução correta** — usar `Set-Content` com barras `/`:
```powershell
Set-Content C:\Users\leofi\Desktop\ua\app\android\local.properties "sdk.dir=C\:/Users/leofi/AppData/Local/Android/Sdk"
```

Verificar o conteúdo:
```powershell
Get-Content C:\Users\leofi\Desktop\ua\app\android\local.properties
# sdk.dir=C\:/Users/leofi/AppData/Local/Android/Sdk
```

---

## Passo 6 — Build com sucesso ✅
```bash
npx expo run:android
```

A app compilou e instalou no emulador com sucesso.

---

## Resumo das variáveis de ambiente configuradas

| Variável        | Valor                                                    |
|-----------------|----------------------------------------------------------|
| `ANDROID_HOME`  | `C:\Users\leofi\AppData\Local\Android\Sdk`               |
| `JAVA_HOME`     | `C:\Program Files\Android\Android Studio\jbr`            |
| `Path` (extra)  | `%ANDROID_HOME%\platform-tools`                          |
| `Path` (extra)  | `%ANDROID_HOME%\emulator`                                |
| `Path` (extra)  | `%JAVA_HOME%\bin`                                        |

---

## Notas finais

- As variáveis de ambiente do sistema só são carregadas em **novos** terminais.
  Para aplicar sem reiniciar, usar `$env:VAR = "valor"` no PowerShell.
- O ficheiro `android/local.properties` **não deve ser commitado** no git
  (já está no `.gitignore` por defeito no Expo).
- Builds subsequentes são mais rápidos porque o Gradle fica em cache.