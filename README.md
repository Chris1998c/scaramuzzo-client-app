# Scaramuzzo Client App

App cliente Expo (React Native) per prenotazioni e gestione profilo Scaramuzzo.

## Setup

```bash
npm install
npx expo start
```

Configura `.env` da `.env.example` (Supabase + URL Manager API).

## Struttura

- `src/app/` — schermate (Expo Router)
- `src/services/customerApi.ts` — API Manager
- `assets/images/logo-scaramuzzo.webp` — unico logo brand (UI, icon, splash)

## Script

- `npm run lint` — ESLint su `src/`
- `npm start` — dev server Expo
