# KeyGenie

[繁體中文](README.zh-TW.md)

Deterministic password generator based on a master password—zero-knowledge architecture with optional cloud sync.

## Features

- **Local generation**: Passwords are computed on your device with Argon2id; we do not store your master password or generated passwords.
- **Zero knowledge**: Your master password and final passwords are never uploaded; only non-sensitive "site labels and account names" sync to Supabase when you choose to sign in.
- **Cross-device**: Optional Google sign-in syncs favorite labels to Supabase for use across devices.

## Quick start

```bash
cd frontend
npm install
cp .env.example .env   # optional: for Supabase sync / report-issue; fill in your own values
npm run dev
```

The dev server runs at `http://localhost:5173` by default.

## Documentation

- [Frontend project & development guide](frontend/README.md)
- [Password generation logic](docs/password-generation-logic.md)
- [Supabase setup](supabase/SUPABASE_SETUP.md) (optional, for cloud sync & report-issue)

## License

This project is licensed under the [MIT License](LICENSE).
