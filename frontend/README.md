# KeyGenie Frontend

[繁體中文](README.zh-TW.md)

## Overview

KeyGenie is a password-manager frontend based on deterministic password generation. It uses the Argon2id key derivation function (via WebAssembly) so that the same inputs (site name, account, master password) always produce the same password. Passwords are generated on the user’s device and are not stored on any server.

## Core features

### 1. Deterministic password generation
- **Inputs**: site name (siteName), account (optional), master password (masterPassword)
- **Output**: 12–18 character password (uppercase, lowercase, digits, symbols)
- **Property**: Same inputs always yield the same password
- **Algorithm**: Argon2id (via hash-wasm WebAssembly)

### 2. Zero-knowledge architecture
- Master password never leaves the device
- Generation is entirely client-side
- Server stores no password-related data

### 3. Cross-platform
- **Web**: Modern browsers (Chrome 57+, Firefox 52+, Safari 11+, Edge 16+)
- **Mobile**: Android via Capacitor
- **Requirement**: WebAssembly support is required for password generation

## Tech stack

- **React 19.2.3** – UI
- **Vite 7.2.4** – Build and dev server
- **React Router 7.11.0** – Routing
- **RSuite 6.1.1** – UI components
- **hash-wasm 4.12.0** – Argon2id (WebAssembly)
- **Capacitor 6.1.2** – Native app runtime
- **@aparajita/capacitor-biometric-auth** – Biometric auth

## Project structure

```
frontend/
├── src/
│   ├── components/       # Reusable components (e.g. Layout.jsx)
│   ├── pages/            # GeneratePassword, Favorites, Settings
│   ├── contexts/         # SyncContext
│   ├── utils/            # passwordGenerator, storage, i18n, biometric
│   ├── services/         # syncService
│   ├── styles/           # theme.css, mobile.css
│   ├── hooks/
│   ├── App.jsx
│   └── main.jsx
├── public/
├── android/              # Android native project
├── capacitor.config.ts
├── vite.config.js
└── package.json
```

## Password generation algorithm

KeyGenie uses **Argon2id** (2015 Password Hashing Competition winner) via WebAssembly. Parameters: parallelism 1, iterations 3, memory 128 MB, hash 32 bytes. Salt: `normalizedSiteName:normalizedAccount`. Output is 12–18 chars with guaranteed character types. Implementation: `src/utils/passwordGenerator.js` → `generatePassword(siteName, account, masterPassword)` returns `Promise<string>`. See [Password generation logic](../docs/password-generation-logic.md) for details.

## Development

### Requirements
- Node.js 18+ (LTS recommended)
- Browser with WebAssembly support

### Environment

Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` if you want sign-in and cloud sync. Do not commit `.env`.

### Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # output to dist/
npm run preview    # preview production build
npm run deploy     # build + Docker (requires Docker Compose)
```

### Android (Capacitor)
- Init: `npm run cap:init`, `npm run cap:add:android`
- Sync: `npm run cap:sync` (after `npm run build` when changing web code)
- Build & sync: `npm run cap:build:android`
- Open Android Studio: `npm run cap:open:android`

## Features by route

- **`/generate`**: Enter site/account/master password → deterministic password; copy, add to favorites
- **`/` (Favorites)**: Saved entries, groups, drag sort, search
- **`/settings`**: Account, sync, language, theme, biometrics

## Browser support

Password generation **requires** WebAssembly. Supported: Chrome 57+, Firefox 52+, Safari 11+, Edge 16+.

## Performance

Argon2id: ~200–500 ms on desktop, ~300 ms–2 s on mobile; memory peak ~130 MB. Loading states and route-level code splitting are used for UX.

## Security

Zero-knowledge, deterministic, high entropy, memory-hard (128 MB + 3 iterations), per-site salt, GPU/ASIC resistant. Master password cannot be recovered if lost. Inputs are normalized (lowercase, trim).

## Internationalization

Languages: 繁體中文 (zh-TW), 简体中文 (zh-CN), English (en). Strings in `src/utils/i18n.js`.

## FAQ

- **Why WebAssembly?** Same Argon2id everywhere and good performance.
- **Why is generation slow?** 200–800 ms is normal; it’s a security tradeoff.
- **Lost master password?** It cannot be recovered; keep it safe.

## Related docs

- [Password generation logic](../docs/password-generation-logic.md)
- [Android setup](./ANDROID_SETUP.md) (if present)

## License

This project is under the MIT License. See the root [LICENSE](../LICENSE).
