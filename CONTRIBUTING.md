# Contributing to AIDE

Welcome! 👋  
This guide explains **how to contribute** to the AIDE app.

Please read this before creating a branch or opening a Pull Request.

---

## About AIDE

AIDE is a React Native app that helps **caregivers monitor cared people** using smart devices, displaying **real-time biometrics** and **alerts** when needed.

---

## Tech Stack

We use the following tools and libraries:

- React Native + Expo
- expo-router (routing)
- NativeWind (Tailwind for React Native)
- clsx (conditional class names)
- Redux Toolkit (global state – Zustand allowed if justified)
- TanStack Query (server state & API caching)
- Axios (HTTP client)
- JSON Server (mock API)
- react-native-gifted-charts (charts)
- react-hook-form (form state)
- zod (schema validation)
- date-fns (date utilities)

👉 Avoid adding new libraries unless absolutely necessary.

---

## Contribution Rules

### Keep Changes Small
- One Jira issue = one branch = one PR
- Don’t mix features and refactors

### Use Pull Requests
- No direct commits to `main` or `dev`
- All changes must go through PR review

### Write Readable Code
- Prefer clarity over clever solutions
- Add comments if something is not obvious

---

## Project Structure

### Components
- Small and focused components
- Reusable components go in `components/`
- Screens live in `app/` (expo-router)

### Hooks
- Custom hooks go in `hooks/`
- Always prefix with `use`

---

## State Management

### Global State
- Use Redux Toolkit only when necessary
- Keep UI state local when possible

### Server State
- All API data must use **TanStack Query**
- Never store server data in Redux

---

## Styling (NativeWind)

- Prefer NativeWind classes over inline styles
- Use `clsx` for conditional styles

Example:

```tsx
className={clsx(
  'p-4 rounded-lg',
  isAlert && 'bg-red-500'
)}
```
---

## Forms & Validation

- Always use `react-hook-form`
- Always validate with `zod`
- Never trust user input

---

## API & Data Fetching

- Use the shared Axios instance
- Do not use `fetch` directly in components
- Handle loading and error states
- Use JSON Server only for local development

---

## Git, Jira & Branching

We use **Jira** and an **adapted GitFlow** strategy.

### Main Branches
- `main` → production-ready code
- `dev` → integration branch

Never commit directly to these branches.

### Feature Branches
- Created directly from Jira issues
- Branch from `dev`

Examples:
- `feature/AIDE-123-alert-system`
- `feature/AIDE-456-heart-rate-chart`

Rules:
- One Jira issue per branch
- Keep the branch focused on that issue only

### Hotfix Branches
- Used only for urgent production fixes
- Branch from `main`
- Merge back into both `main` and `dev`

Example:
- `hotfix/AIDE-999-critical-crash`

---

## Definition of Done

A feature or Jira issue is considered **Done** when:

- ✅ Feature is fully implemented
- ✅ Code is formatted and readable
- ✅ Feature was manually tested

If any of these are missing, the work is **not done**.

---

## Pull Request Checklist

Before opening a Pull Request, make sure:

- [ ] App runs without errors
- [ ] Code follows this guide
- [ ] Feature is done, formatted, and tested
- [ ] Works at least on Android
- [ ] PR description explains what and why