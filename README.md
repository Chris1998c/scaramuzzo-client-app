# Scaramuzzo Client App

App cliente Expo (React Native) per prenotazioni e gestione profilo Scaramuzzo.

## Setup

```bash
npm install
npx expo start
```

Configura `.env` da `.env.example` (Supabase + URL Manager API). Non usare mai una
service role key in una app pubblica.

## App web per iPhone

La PWA statica è pubblicata dal Manager su
`https://manager.scaramuzzo.green/app-clienti`. In Safari: Condividi →
**Aggiungi alla schermata Home**. L'app usa lo stesso login Supabase e le stesse
API di prenotazione della versione Expo Go. Dal profilo collegato, il cliente
può attivare i promemoria push circa 24 ore prima dell'appuntamento. Su iPhone
il permesso va richiesto dall'app aperta tramite l'icona Home. Ogni dispositivo
si abilita separatamente; logout e disattivazione eliminano la sottoscrizione
locale. Il canale WhatsApp resta indipendente.

Per aggiornare la versione web, con `scaramuzzo-client-app` e
`scaramuzzo-manager` affiancati:

```bash
npm ci --legacy-peer-deps
npm run build:web:manager
```

Il comando esporta in `dist/` e copia in `../scaramuzzo-manager/public/app-clienti/`.
Commit dei sorgenti Clienti e dell'export Manager, poi deploy del Manager.
`/app-clienti/*` è mappato alle pagine HTML in `next.config.ts`.
La sessione web è conservata nel browser; aprendo l'icona Home potrebbe essere
necessario effettuare di nuovo il login.

## Struttura

- `src/app/` — schermate (Expo Router)
- `src/services/customerApi.ts` — API Manager
- `assets/images/logo-scaramuzzo.webp` — unico logo brand (UI, icon, splash)

## Script

- `npm run lint` — ESLint su `src/`
- `npm start` — dev server Expo
