# App assets

## In-app branding

- `logo-scaramuzzo.png` / `logo-scaramuzzo.webp` — logo verticale per UI (non usare come app icon).

## Expo / store (quadrati, generati)

Eseguire dalla root del repo:

```bash
npm run generate:assets
```

Output:

- `icon.png` — 1024×1024, sfondo `#140905`, logo centrato
- `adaptive-icon.png` — 1024×1024, foreground trasparente (Android)
- `splash-icon.png` — splash plugin, logo centrato
- `favicon.png` — web favicon

Per sostituire il logo nelle icone, aggiornare `logo-scaramuzzo.png` e rigenerare.
