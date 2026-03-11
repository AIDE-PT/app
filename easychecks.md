# AIDE App — Accessibility EasyChecks Audit

**Date:** 23 February 2026  
**Platform:** React Native / Expo (iOS & Android)  
**Language:** Portuguese  
**Styling system:** NativeWind (Tailwind CSS)  
**Theme system:** Custom `ThemeContext` with light/dark toggle  

---

## How the EasyChecks Map to React Native

This is a mobile app, not a web page. The EasyCheck categories were designed for web, so the table below explains the equivalent check for React Native:

| EasyCheck (Web) | React Native Equivalent |
|---|---|
| Image Alternative Text | `accessibilityLabel` on `<Image>` and SVG wrappers; decorative images set `accessible={false}` |
| Page Title | Screen heading text with `accessibilityRole="header"`; `<Stack.Screen options={{ title }}>`|
| Headings | `accessibilityRole="header"` on section title `<Text>` elements |
| Color Contrast | WCAG 2.1 AA: ≥4.5:1 for normal text, ≥3:1 for large text (18 pt / 14 pt bold) and UI components |
| Skip Link | `accessibilityViewIsModal={true}` on overlays; `importantForAccessibility="no-hide-descendants"` to skip decorative regions |
| Visible Keyboard Focus | VoiceOver / TalkBack focus ring; `accessible={true}` and correct focus order |
| Language of Page | `expo-localization` or `I18n` declaring the app language; `accessibilityLanguage` prop on individual `Text` nodes |
| Zoom | `allowFontScaling` not set to `false`; layout does not overflow at system text size "Larger" |
| Captions | Captions on any embedded video |
| Transcripts | Text transcripts for audio content |
| Audio Description | Audio descriptions for visual information in video |
| Labels (Forms) | Visible `<Text>` label above/beside each `TextInput`; `accessibilityLabel` on the input |
| Required Fields | Visual star/badge + `accessibilityLabel` mentioning "required" |

---

## Global / Infrastructure Findings

### Theme System — [contexts/ThemeContext.tsx](app/contexts/ThemeContext.tsx)

- Light/dark theme toggling is supported and persisted via `AsyncStorage`. ✅  
- The theme does **not** read the OS `Appearance` API on first launch → defaults to `"light"` regardless of system preference. ⚠️  
- No `useColorScheme()` call found anywhere in the codebase. ❌

### Color Palette — [tailwind.config.js](app/tailwind.config.js)

| Token | Value | Notes |
|---|---|---|
| `aide-normal-blue` | `#5061FF` | Primary brand blue |
| `aide-light-blue` | `#7C89FF` | Secondary brand blue |
| `aide-background` | `#ECF5FF` | Page background (light) |
| `aide-dark-card` | `rgba(0,4,18,0.9)` | Card background (dark) |
| `aide-dark-text-secondary` | `rgba(255,255,255,0.6)` | Secondary text (dark) |

Key contrast issues:
- `text-gray-400` (`#9CA3AF`) on white (`#FFFFFF`) → **~3.5:1** — fails WCAG AA for normal text ❌  
- `text-gray-500` (`#6B7280`) on `#ECF5FF` → **~4.2:1** — borderline pass/fail for normal text ⚠️  
- `aide-dark-text-secondary` (white/60) on `aide-dark-card` → **~8:1** — passes ✅  
- `#5C6CFF` links on white background → **~3.5:1** — fails AA for normal text ❌  
- Status palette in MasterDetail: green `#166534` on `#DCFCE7` → **~7.6:1** ✅; red `#991B1B` on `#FEE2E2` → **~6.7:1** ✅

### Language

- App content is entirely in **Portuguese**.  
- No `expo-localization`, `I18n`, or language declaration anywhere in the codebase. ❌  
- No `accessibilityLanguage` prop used on any component. ❌

### Font Scaling / Zoom

- `allowFontScaling={false}` is **not used** anywhere — font scaling is available. ✅  
- No explicit minimum touch target sizing (44×44 pt) is enforced in any component. ⚠️  
- No layout reflow testing evidence at "Larger Accessibility Sizes". ⚠️

### Audio / Visual Media

- No `<Video>`, `<Audio>`, or embedded media found anywhere in the app. All checks in the **Captions**, **Transcripts**, and **Audio Description** categories are **N/A** for all screens.

---

## Per-Page Analysis

The checks are applied as follows:  
✅ = Passes or not applicable  ⚠️ = Partial / needs review  ❌ = Fails

---

### 1. Splash Screen — [app/index.tsx](app/app/index.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | `AideLogo` (SVG) and `AnimatedRing` (SVG) rendered with no `accessibilityLabel` or `accessible={false}` | ❌ |
| **Page Title** | No heading or `accessibilityRole="header"` on any element | ❌ |
| **Headings** | No headings present | ❌ |
| **Color Contrast** | Ring colors (`#5C7CFA`, `#3B5BDB`, `#BAC8FF`) are decorative but unverified against the background gradient | ⚠️ |
| **Skip Link** | Animated decorative rings are not hidden from the a11y tree; no skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | No interactive elements; focus order irrelevant | ✅ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | No `allowFontScaling={false}`; no text present to reflow | ✅ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form fields | ✅ |
| **Required Fields** | No form fields | ✅ |

**Notes:** The `AnimatedRing` components serve a purely decorative purpose and should be hidden with `accessible={false}` and `importantForAccessibility="no"`.

---

### 2. Login — [app/login.tsx](app/app/login.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No `<Image>` components; background is a CSS dot pattern (decorative) | ✅ |
| **Page Title** | "Login" rendered as 32 px `Text`; no `accessibilityRole="header"` | ❌ |
| **Headings** | "Login" title is the only heading-like element; no semantic role | ❌ |
| **Color Contrast** | `text-[#6B7280]` on `#ECF5FF` ≈ 4.2:1 borderline ⚠️; `text-[#5C6CFF]` links on white ≈ 3.5:1 fails AA | ❌ |
| **Skip Link** | No skip mechanism; `DotBackground` is not hidden from a11y tree | ⚠️ |
| **Visible Keyboard Focus** | No `returnKeyType` chaining between Email → Password; no `onSubmitEditing` to forward focus | ❌ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | No suppression; layout not tested at large text sizes | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | Email and Password `Input` components use placeholder as the only label; no visible label text, no `accessibilityLabel` | ❌ |
| **Required Fields** | Both fields are required but not marked visually or via `accessibilityLabel` | ❌ |

**Notes:**  
- "Regista-te" and "Recupera-a" `TouchableOpacity` elements have no `accessibilityRole="link"`.  
- `SocialButton` (Google, Apple) SVG icons have no `accessibilityLabel` on the touchable; the icon SVG paths are in the a11y tree.

---

### 3. Register — [app/register.tsx](app/app/register.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No images | ✅ |
| **Page Title** | "Registo" (32 px Safiro font) — no `accessibilityRole="header"` | ❌ |
| **Headings** | No semantic headings | ❌ |
| **Color Contrast** | Same issues as Login: blue links and gray secondary text fail AA | ❌ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | No `returnKeyType` chaining across 4 input fields | ❌ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | Nome, Email/telemóvel, Password, Repetir Password — all placeholders only, no visible labels | ❌ |
| **Required Fields** | All 4 fields required but no visual or accessible marking | ❌ |

**Notes:**  
- Password mismatch validation error is only logged to `console.log` — no user-visible or screen-reader-announced error message. ❌  
- Terms of Service checkbox (if present) should have a visible label and `accessibilityLabel`.

---

### 4. Recover Password — [app/recover-password.tsx](app/app/recover-password.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No images | ✅ |
| **Page Title** | `BackButton` label "Recuperar Password" serves as navigation context; main heading "Recuperar acesso" has no `accessibilityRole="header"` | ❌ |
| **Headings** | "Recuperar acesso" heading-like text has no semantic role | ❌ |
| **Color Contrast** | `text-[#4B5563]` on `#ECF5FF` ≈ 5.5:1 — passes ✅ | ✅ |
| **Skip Link** | No focus skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | Single input field; submit `returnKeyType="send"` would help but is absent | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | Email `Input` uses placeholder only; no visible label or `accessibilityLabel` | ❌ |
| **Required Fields** | Email is required but not marked | ❌ |

---

### 5. Complete Profile — [app/complete-profile.tsx](app/app/complete-profile.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No images | ✅ |
| **Page Title** | "Só mais uma coisa..." (32 px) — no `accessibilityRole="header"` | ❌ |
| **Headings** | No semantic headings | ❌ |
| **Color Contrast** | `GradientBackground` used — text contrast on gradient is unverified | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | No `returnKeyType` chaining across Idade → Peso → Altura | ❌ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | Idade, Peso, Altura, Género — all placeholder-only, no visible labels | ❌ |
| **Required Fields** | No Zod validation; required fields not marked visually or accessibly | ❌ |

---

### 6. Role Selection — [app/perfil.tsx](app/app/perfil.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | `aider.png`, `cuidado.png`, `icon_aider.png`, `icon_cuidado.png` rendered via `ProfileCard` / `ProfileImage` — no `accessibilityLabel` on any image | ❌ |
| **Page Title** | "Registo" heading + subtitle — no `accessibilityRole="header"` | ❌ |
| **Headings** | No semantic headings | ❌ |
| **Color Contrast** | `text-gray-600` on `#ECF5FF` ≈ 4.6:1 — borderline pass | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | Card selection via `TouchableOpacity`; no focus indicator beyond default ring | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No text inputs | ✅ |
| **Required Fields** | Selection is required; "Avançar" button is `disabled` when nothing selected ✅ — but no accessible explanation of why it is disabled | ⚠️ |

**Notes:**  
- `ProfileCard` `isSelected` changes only visual opacity/border — `accessibilityState={{ selected: isSelected }}` is missing. ❌  
- Invisible description text (opacity 0 when not selected) is still in the a11y tree and will be announced by screen readers. ❌

---

### 7. Select Conditions — [app/selectConditions.tsx](app/app/selectConditions.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No images | ✅ |
| **Page Title** | "Só mais uma coisa..." (30 px Safiro) — no `accessibilityRole="header"` | ❌ |
| **Headings** | No semantic headings | ❌ |
| **Color Contrast** | Text on `#ECF5FF` — primary text passes, gray secondary text borderline | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | `ChipButton` multi-select interaction relies solely on touch | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | `SearchBar` has placeholder `"Doenças que tenha"` but no `accessibilityLabel` | ❌ |
| **Required Fields** | No mandatory selection; optional step ✅ | ✅ |

**Notes:**  
- `ChipButton` selected state needs `accessibilityState={{ selected }}` verification. ⚠️

---

### 8. Extra Data — [app/extraData.tsx](app/app/extraData.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No images | ✅ |
| **Page Title** | "Só mais uma coisa..." — no `accessibilityRole="header"` | ❌ |
| **Headings** | No semantic headings | ❌ |
| **Color Contrast** | Text on `#ECF5FF` — borderline for secondary text | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | No `returnKeyType` chaining between Idade → Peso → Altura | ❌ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | Idade, Peso, Altura — placeholder-only inputs; no visible labels | ❌ |
| **Required Fields** | Zod validation in place ✅ but fields are not visually or accessibly marked as required | ❌ |

**Notes:**  
- `GenderSelector` is a custom `TouchableOpacity`-based dropdown with no `accessibilityRole="combobox"`, no `accessibilityState={{ expanded }}`, and no announcement of available options. ❌  
- Zod validation error messages displayed as red `Text` below each field — visible but no `accessibilityLiveRegion="polite"` to announce errors to screen reader users. ❌

---

### 9. Terms of Service — [app/terms-of-service.tsx](app/app/terms-of-service.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No images | ✅ |
| **Page Title** | BackButton "Termos de Serviço" — main page `Text` heading has no `accessibilityRole="header"` | ❌ |
| **Headings** | `TermSection` section titles rendered as plain `Text` — no `accessibilityRole="header"` | ❌ |
| **Color Contrast** | `text-[#4B5563]` on `#ECF5FF` ≈ 5.5:1 ✅; dark mode `text-white/80` on dark card ≈ 10:1 ✅ | ✅ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | Read-only content; no interactive elements beyond back button | ✅ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Long-form text — reflow at large text sizes unverified | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form fields | ✅ |
| **Required Fields** | No form fields | ✅ |

**Notes:**  
- The `fromStart` query param controls whether a "Register" button appears — dynamic content change is not announced via `accessibilityLiveRegion`. ⚠️

---

### 10. Recommendations — [app/recommendations.tsx](app/app/recommendations.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | `IconCardButton` contains health SVG icons — no `accessibilityLabel` on SVG wrappers | ❌ |
| **Page Title** | "Nós recomendamos" (30 px Safiro) — no `accessibilityRole="header"` | ❌ |
| **Headings** | No semantic headings | ❌ |
| **Color Contrast** | Text on `#ECF5FF` — secondary/gray text borderline | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | `IconCardButton` toggleable cards — focus ring present by default ✅ but selected state not exposed accessibly | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | Selection is optional — no required marking needed | ✅ |

**Notes:**  
- `IconCardButton` `isSelected` state should expose `accessibilityState={{ selected }}` so screen reader users know which recommendations are active. ❌

---

### 11. Main Dashboard — [app/testDashboard.tsx](app/app/testDashboard.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | SVG metric icons inside widgets — no `accessibilityLabel` on any icon | ❌ |
| **Page Title** | No screen title set; `EditableDashboard` renders no heading | ❌ |
| **Headings** | No section headings within the dashboard | ❌ |
| **Color Contrast** | Theme-dependent; unverified on both light and dark modes for all widget states | ⚠️ |
| **Skip Link** | No skip mechanism; NavBar icons are icon-only with no labels | ❌ |
| **Visible Keyboard Focus** | Drag-and-drop widget editing has no accessible keyboard/switch-access alternative | ❌ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Widget grid layout may break at large text sizes — not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

**Notes:**  
- All 4 `NavBar` bottom-tab icons (Add, Calendar, Home, Profile) are icon-only `TouchableOpacity` elements with **no `accessibilityLabel`**. ❌  
- No `accessibilityRole="tab"` or `accessibilityState={{ selected: true }}` on the active tab. ❌  
- Status colors in widget cards are conveyed by color alone — no text or icon alternative. ❌

---

### 12. Metric Detail — [app/MasterDetail.tsx](app/app/MasterDetail.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | SVG ring gauges, sparklines, and line charts carry no `accessibilityLabel` or data summary | ❌ |
| **Page Title** | Chart title (`METRIC_CONFIGS[type].label`) displayed as large `Text` ✅ — no `accessibilityRole="header"` | ⚠️ |
| **Headings** | Section titles ("Histórico", "Estatísticas") have no `accessibilityRole="header"` | ❌ |
| **Color Contrast** | Status palette (green on light green, red on light red, orange on light orange) — all pass ✅ see global section | ✅ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | KPI cards and chart controls — no focus management | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Dense chart layout may clip at large text sizes | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

**Notes:**  
- Feather icon props inside KPI cards have no `accessibilityLabel`. ❌  
- Status text labels ("Normal", "Elevado", "Crítico") accompany color — partial pass ✅ — but status is also duplicated in color-only badge border. ⚠️

---

### 13. Health Data — [app/healthData.tsx](app/app/healthData.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No `<Image>` tags; metric icons are decorative emojis or Lucide icons — no `accessibilityLabel` | ❌ |
| **Page Title** | BackButton label "Gerir Dados" — main `Text` section heading has no `accessibilityRole="header"` | ❌ |
| **Headings** | No `accessibilityRole="header"` on any section title | ❌ |
| **Color Contrast** | Status-indicating colored dot in `MetricCard` — color only, no text alternative | ❌ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | `MetricCard` tap targets — no visible focus indicator beyond default | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

**Notes:**  
- `ActivityIndicator` loading spinner has no `accessibilityLabel` — screen readers will announce it with a generic description. ❌  
- Min/Max stats rendered as plain text — readable ✅

---

### 14. Daily History — [app/historicoDiario.tsx](app/app/historicoDiario.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | Widget icons and chart SVGs — no `accessibilityLabel` | ❌ |
| **Page Title** | BackButton "Histórico Diário" — no `accessibilityRole="header"` on main title | ❌ |
| **Headings** | No semantic heading roles | ❌ |
| **Color Contrast** | Theme-dependent — not verified across both modes | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | `CalendarButton` toggle labels ("Dia"/"Período") — `accessibilityLabel` presence unconfirmed | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Widget grid layout may clip at large text sizes | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

---

### 15. Associate Cuidado — [app/associar.tsx](app/app/associar.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No `<Image>` tags; QR camera preview is entirely inaccessible — no alternative input described | ❌ |
| **Page Title** | BackButton "Adicionar um cuidado" — subsection labels "Associar com QR Code" / "Associar com email" not marked as headings | ❌ |
| **Headings** | Section dividers styled as `text-lg` — no `accessibilityRole="header"` | ❌ |
| **Color Contrast** | Error text `text-red-500` on white — ≈ 4.0:1 borderline | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | Email `Input` — no `returnKeyType="send"` for submit-on-enter | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | Email `Input` placeholder-only ("Insira o email…") — no visible label | ❌ |
| **Required Fields** | Email required but not marked | ❌ |

**Notes:**  
- Validation error `{error}` displayed as red `Text` — visible but **no `accessibilityLiveRegion="polite"`** to announce to screen readers. ❌  
- `AssociarConfirmationModal` opens with no focus movement, no `accessibilityRole="dialog"`, no `accessibilityViewIsModal={true}`. ❌  
- QR Code scanning should offer an accessible alternative pathway (e.g., manual code entry). ❌

---

### 16. Devices — [app/dispositivos.tsx](app/app/dispositivos.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | Device logos are text initials — no image accessibility needed ✅; the `AddIcon` SVG has no `accessibilityLabel` on its wrapper | ❌ |
| **Page Title** | BackButton "Gerir Dispositivos" — no `accessibilityRole="header"` | ❌ |
| **Headings** | No section headings | ❌ |
| **Color Contrast** | `isDataSharingEnabled` conveyed by green (`#4cd964`) vs gray border — **color only, no text/icon label** | ❌ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | Device tiles are `TouchableOpacity` cards — no `accessibilityRole`, `accessibilityLabel`, or `accessibilityHint` | ❌ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

**Notes:**  
- `AddDeviceModal`, `DeviceConnectionModal`, `DeviceManagementModal` — none trap focus or use `accessibilityViewIsModal={true}` when opened. ❌  
- Active/sharing status must have a non-color indicator (e.g., a text label "A partilhar" / "Inativo"). ❌

---

### 17. Notifications — [app/notificacoes.tsx](app/app/notificacoes.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | `Ionicons` notification type icons — no `accessibilityLabel` on each icon | ❌ |
| **Page Title** | BackButton "Notificações" — no `accessibilityRole="header"` | ❌ |
| **Headings** | No semantic headings | ❌ |
| **Color Contrast** | Severity background colors paired with text labels ("Alerta Crítico", "Aviso", "Informação") — partial pass ✅; icon-only severity indicator still present ⚠️ | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | `Pressable` "Limpar" — no `accessibilityHint` warning destructive action | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

**Notes:**  
- `RefreshControl` is implemented — pull-to-refresh works. ✅  
- Empty state shows icon + descriptive text — good practice. ✅  
- Confirmation modal for clearing all notifications has no `accessibilityRole="alert"` and no `accessibilityLiveRegion`. ❌

---

### 18. Manage Profile — [app/gerir_perfil.tsx](app/app/gerir_perfil.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | Profile avatar is a text initial ✅; Camera icon `TouchableOpacity` has only the Lucide `Camera` icon — **no `accessibilityLabel`** | ❌ |
| **Page Title** | BackButton "Gerir Perfil" — section heading "A SUA IDENTIFICAÇÃO" has no `accessibilityRole="header"` | ❌ |
| **Headings** | Section titles lack `accessibilityRole="header"` | ❌ |
| **Color Contrast** | `text-xs font-bold text-white/60` description text on dark card — approximately 6:1 ✅ | ✅ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | Edit mode toggled by pencil `TouchableOpacity` — no `accessibilityLabel` on the pencil icon | ❌ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | `GerirPerfilFormulario` → `ElementoFormulario` renders a **visible `Text` label** above each `Input` ✅ — best practice in the project | ✅ |
| **Required Fields** | Fields not marked as required | ❌ |

**Notes:**  
- "Apagar Conta" destructive button has no `accessibilityHint` warning about its consequence. ❌  
- `Info` icon (Lucide) inside `ElementoFormulario` has no `accessibilityLabel`. ❌  
- No `accessibilityLabelledBy` linking the `Text` label node to the `TextInput`. ⚠️

---

### 19. Settings — [app/definicoes.tsx](app/app/definicoes.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No images | ✅ |
| **Page Title** | BackButton "Definições" — list header has no `accessibilityRole="header"` | ❌ |
| **Headings** | No semantic heading roles in `DefinicoesLista` group headers | ❌ |
| **Color Contrast** | Inherits theme tokens — primary text passes; secondary text borderline | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | `ElementoDefinicao` list items are `TouchableOpacity` — default focus ring ✅, no explicit `accessibilityRole="menuitem"` | ⚠️ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

---

### 20. Personalization — [app/personalizacao.tsx](app/app/personalizacao.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | `temaEscuro.png` and `temaClaro.png` rendered with `<Image>` — **no `accessibilityLabel`** | ❌ |
| **Page Title** | BackButton context; "Vista" section heading (24 px Safiro) — no `accessibilityRole="header"` | ❌ |
| **Headings** | "Temas", "Cores", "Vista" section labels have no semantic heading role | ❌ |
| **Color Contrast** | `text-white/60` on animated dark backgrounds — unverified | ⚠️ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | "Temas" / "Cores" tab `TouchableOpacity` — no `accessibilityRole="tab"`, no `accessibilityState={{ selected }}` | ❌ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

**Notes:**  
- Theme and View selection cards show selected state only via border color change — `accessibilityState={{ selected }}` is missing on all selection cards. ❌  
- "Visualização Detalhada" / "Visualização Simplificada" card buttons lack accessible selected state. ❌

---

### 21. Privacy Policy — [app/privacidade.tsx](app/app/privacidade.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | No images | ✅ |
| **Page Title** | BackButton "Política de Privacidade" — main `Text` heading has no `accessibilityRole="header"` | ❌ |
| **Headings** | `PrivacySection` titles rendered as `Text` — no `accessibilityRole="header"` | ❌ |
| **Color Contrast** | `text-[#4B5563]` on `#ECF5FF` ≈ 5.5:1 ✅; dark `text-white/80` on dark card ≈ 10:1 ✅ | ✅ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | Read-only content; no interactive elements | ✅ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Long-form text — layout reflow at large text sizes unverified | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

**Notes:**  
- Content is well-structured with numbered sections — good ✅  
- VoiceOver users cannot distinguish section titles from body text without heading roles.

---

### 22. About — [app/sobre.tsx](app/app/sobre.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | `AideLogo` (SVG) rendered with no `accessibilityLabel` | ❌ |
| **Page Title** | BackButton "Sobre" — no `accessibilityRole="header"` on main title | ❌ |
| **Headings** | `SectionTitle` component renders as plain `Text` — no `accessibilityRole="header"` | ❌ |
| **Color Contrast** | `text-gray-400` on white ≈ 3.5:1 — **fails WCAG AA** for normal text | ❌ |
| **Skip Link** | No skip mechanism | ⚠️ |
| **Visible Keyboard Focus** | No interactive elements beyond back button | ✅ |
| **Language of Page** | Not declared | ❌ |
| **Zoom** | Not tested | ⚠️ |
| **Captions** | N/A | ✅ |
| **Transcripts** | N/A | ✅ |
| **Audio Description** | N/A | ✅ |
| **Labels** | No form inputs | ✅ |
| **Required Fields** | No form inputs | ✅ |

**Notes:**  
- `FeatureCard` Ionicons / MaterialCommunityIcons used decoratively — no `accessibilityLabel` or `accessible={false}`. ❌  
- `ObjectiveItem` uses emoji icons (🏥, 🤖…) — emojis are announced by screen readers with verbose system names (e.g., "Hospital" for 🏥). Consider using SVG icons with proper labels or hide emojis. ⚠️  
- Team member list is plain text — readable. ✅

---

## Shared Components Analysis

These components are used across multiple screens. Issues here propagate everywhere.

---

### [components/input/Input.tsx](app/components/input/Input.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Labels** | No `accessibilityLabel` prop forwarded to `TextInput` — relies entirely on `placeholder` | ❌ |
| **Visible Keyboard Focus** | Password toggle `TouchableOpacity` (EyeIcon) has no `accessibilityLabel` | ❌ |
| **Required Fields** | No required indicator mechanism | ❌ |
| **Color Contrast** | Validation error shown as `text-red-500` on white ≈ 4.0:1 — borderline | ⚠️ |
| **Zoom** | `allowFontScaling` not set; field may reflow at large text sizes | ⚠️ |

**Additional:** `accessibilityLiveRegion` is not set on error messages — screen readers will not announce validation errors. ❌

---

### [components/navBar/NavBar.tsx](app/components/navBar/NavBar.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Labels** | All 4 navigation buttons are icon-only `TouchableOpacity` — **no `accessibilityLabel`** on any | ❌ |
| **Headings** | No navigation landmark equivalent | ❌ |
| **Visible Keyboard Focus** | Active tab state is visual-only (icon color); no `accessibilityState={{ selected: true }}` | ❌ |

**Additional:** No `accessibilityRole="tab"` or `accessibilityRole="tabbar"` on the container or individual tabs. ❌

---

### [components/buttons/button.tsx](app/components/buttons/button.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Labels** | Label rendered as `Text` child — readable by screen readers ✅ | ✅ |
| **Visible Keyboard Focus** | No explicit `accessibilityRole="button"` | ⚠️ |
| **Required Fields** | `disabled` prop applies `opacity-50` visually but no `accessibilityState={{ disabled: true }}` | ❌ |

---

### [components/buttons/backButton.tsx](app/components/buttons/backButton.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Labels** | `ArrowIcon` SVG is in the a11y tree alongside label text — screen readers may announce both separately | ⚠️ |
| **Visible Keyboard Focus** | No explicit `accessibilityRole="button"` | ⚠️ |

**Fix:** Set `accessibilityLabel="Voltar"` (or the route name) on the `TouchableOpacity` and `accessible={false}` on the `ArrowIcon`. ❌

---

### [components/buttons/socialButton.tsx](app/components/buttons/socialButton.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | `GoogleIcon` and `AppleIcon` SVG paths have no `accessibilityLabel` or `accessible={false}` — may be announced as unlabelled images | ❌ |
| **Labels** | Button has text label ("Google", "Apple") ✅ but SVG paths may redundantly be announced | ⚠️ |

---

### [components/profilecard.tsx](app/components/profilecard.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Image Alternative Text** | `imageSource` (Image) and `iconSource` (Image) have no `accessibilityLabel` | ❌ |
| **Visible Keyboard Focus** | `isSelected` changes opacity/border — no `accessibilityState={{ selected: isSelected }}` | ❌ |
| **Skip Link** | `description` text has `opacity: isSelected ? 1 : 0` — hidden text is still in the a11y tree and will be read aloud | ❌ |

---

### [components/modals/\*](app/components/modals/)

All modals share the same issues:

| EasyCheck | Finding | Status |
|---|---|---|
| **Skip Link / Focus** | Modal opens but focus is not moved to modal content | ❌ |
| **Visible Keyboard Focus** | No `accessibilityViewIsModal={true}` on modal container — background content remains accessible | ❌ |
| **Labels** | Modal close buttons are icon-only — no `accessibilityLabel` | ❌ |

`onRequestClose` is set for Android back button ✅ — but this does not resolve the focus trap issue.

---

### [components/gerir_perfil_formulario.tsx](app/components/gerir_perfil_formulario.tsx) + [components/elemento_formulario.tsx](app/components/elemento_formulario.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Labels** | Visible `Text` label rendered above each `Input` — **best practice in the project** ✅ | ✅ |
| **Required Fields** | Fields not marked as required | ❌ |

**Additional:** No `accessibilityLabelledBy` linking the `Text` label node to the `TextInput` — in React Native the label-to-input association must be done via `accessibilityLabel` on the input or via nesting. ⚠️  
`Info` icon (Lucide) inside the label row has no `accessibilityLabel`. ❌

---

### [components/input/SearchBar.tsx](app/components/input/SearchBar.tsx)

| EasyCheck | Finding | Status |
|---|---|---|
| **Labels** | `TextInput` has `placeholder` but no `accessibilityLabel` | ❌ |
| **Visible Keyboard Focus** | Search icon `TouchableOpacity` has no `accessibilityLabel` | ❌ |

---

## Cross-Cutting Issues Summary

| # | Issue | Severity | Affected Pages / Files |
|---|---|---|---|
| 1 | All `<Image>` components lack `accessibilityLabel` (or `accessible={false}` for decorative images) | **Critical** | perfil, personalizacao, sobre, profilecard.tsx |
| 2 | All 4 NavBar navigation buttons are icon-only with no `accessibilityLabel` | **Critical** | NavBar.tsx → all authenticated screens |
| 3 | Form inputs use `placeholder` as the only label; no visible label, no `accessibilityLabel` on `TextInput` | **Critical** | login, register, recover-password, complete-profile, extraData, associar, Input.tsx, SearchBar.tsx |
| 4 | No page or section `Text` has `accessibilityRole="header"` anywhere in the app | **High** | All 22 pages |
| 5 | Custom `GenderSelector` dropdown is not announced as a combobox; no expanded/collapsed state | **High** | extraData.tsx |
| 6 | Modals open without moving VoiceOver/TalkBack focus; no `accessibilityViewIsModal={true}` | **High** | All 6 modals |
| 7 | Status/severity and data-sharing state conveyed by color alone — no text or shape alternative | **High** | dispositivos, healthData, testDashboard |
| 8 | Charts, SVG ring gauges, and sparklines carry no accessible data summary or `accessibilityLabel` | **High** | MasterDetail, healthData, historicoDiario |
| 9 | Validation error messages are not announced via `accessibilityLiveRegion` | **High** | extraData, associar, register, Input.tsx |
| 10 | Selected/active state on cards and chip buttons not reflected via `accessibilityState={{ selected }}` | **High** | perfil, personalizacao, recommendations, selectConditions, profilecard.tsx |
| 11 | Active NavBar tab state not reflected via `accessibilityState={{ selected }}` | **High** | NavBar.tsx |
| 12 | `Button` and `BackButton` lack explicit `accessibilityRole="button"` | **Medium** | button.tsx, backButton.tsx |
| 13 | Decorative SVG icons (`ArrowIcon`, social icons, `HealthIcons`) not hidden with `accessible={false}` | **Medium** | backButton.tsx, socialButton.tsx, all SVG-heavy screens |
| 14 | `disabled` `Button` has no `accessibilityState={{ disabled: true }}` | **Medium** | button.tsx → perfil, register |
| 15 | Invisible `description` text (opacity 0) in `ProfileCard` remains in the a11y tree | **Medium** | profilecard.tsx → perfil |
| 16 | App does not read OS color scheme on first launch (`Appearance` API not used) | **Medium** | ThemeContext.tsx |
| 17 | Destructive actions ("Apagar Conta", "Limpar notificações") have no `accessibilityHint` warning | **Medium** | gerir_perfil, notificacoes |
| 18 | QR Code scanning has no accessible alternative pathway | **Medium** | associar.tsx |
| 19 | App language (Portuguese) is never declared to assistive technology | **Low** | _layout.tsx — app-wide |
| 20 | `text-gray-400` small/secondary text on white backgrounds fails WCAG AA contrast (≈3.5:1) | **Low** | sobre, login, register |
| 21 | `Info` icon in form labels has no `accessibilityLabel` | **Low** | elemento_formulario.tsx |
| 22 | Emoji icons in `ObjectiveItem` will be announced by screen readers with verbose OS names | **Low** | sobre.tsx |

---

## Recommended Fix Priority

### Sprint 1 — Critical (Blocks basic screen reader use)
1. Add `accessibilityLabel` to all `<Image>` components; set `accessible={false}` on decorative images and SVG icons.
2. Add `accessibilityLabel` to all 4 NavBar icon buttons and the active tab `accessibilityState`.
3. Fix `Input.tsx` to accept an `accessibilityLabel` prop and pass it to the underlying `TextInput`; add a visible `label` prop pattern.

### Sprint 2 — High (Impairs navigation and interaction)
4. Add `accessibilityRole="header"` to the first heading on every page and every major section title.
5. Fix all modals: add `accessibilityViewIsModal={true}`, move focus on open, label close buttons.
6. Add `accessibilityState={{ selected }}` to all card, chip, and tab selection components.
7. Add `accessibilityLiveRegion="polite"` to all validation error `Text` nodes.
8. Replace color-only status indicators with text or icon+text alternatives.
9. Add data summaries (`accessibilityLabel`) to all chart and SVG visualization components.
10. Fix `GenderSelector` to announce as `accessibilityRole="combobox"` with expanded state.

### Sprint 3 — Medium (Degrades experience for assistive technology users)
11. Add `accessibilityRole="button"` and `accessibilityState={{ disabled }}` to `button.tsx`.
12. Fix `backButton.tsx`: consolidate into a single `accessibilityLabel`, hide the arrow icon.
13. Fix `profilecard.tsx`: hide opacity-0 text with `importantForAccessibility="no"`.
14. Implement OS color scheme detection in `ThemeContext.tsx` using `Appearance.getColorScheme()`.
15. Add `accessibilityHint` to destructive action buttons.
16. Provide accessible alternative to QR code scanning in `associar.tsx`.

### Sprint 4 — Low (Refinement)
17. Declare the app language via `expo-localization` and surface it to assistive technology.
18. Increase contrast of `text-gray-400` secondary text on white (use `text-gray-600` or `#4B5563` minimum).
19. Add `accessibilityLabel` to all `Info` icon buttons in forms.
20. Replace emoji icons in `sobre.tsx` with SVG icons that have proper labels.
